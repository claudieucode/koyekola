// Marketing M1f (3/3) — pages publiques : désinscription et centre de préférences (sans compte, jetons signés).
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { startServer, Client } = require("./helpers");
const { TEST_KEY } = require("./marketing-helpers");
const { signToken } = require("../src/marketing/security/tokens");
const compliance = require("../src/marketing/compliance");

let srv, anon;
const sql = (query, ...args) => { const db = srv.db(); const r = db.prepare(query).all(...args); db.close(); return r; };
const run = (query, ...args) => { const db = srv.db(); db.prepare(query).run(...args); db.close(); };
let seq = 0;
// Contact abonné avec preuve, prêt à se désinscrire
function subscribed(email = `pub${++seq}@exemple.fr`) {
  const db = srv.db();
  const id = Number(db.prepare("INSERT INTO mk_contacts (organization_id, email, first_name, status) VALUES (1, ?, 'Awa', 'subscribed')").run(email).lastInsertRowid);
  db.prepare("INSERT INTO mk_consents (organization_id, contact_id, action, source, text_shown) VALUES (1, ?, 'granted', 'form', 'Je veux recevoir la newsletter')").run(id);
  db.close();
  return { id, email };
}
const org = { organizationId: 1 };
const status = (id) => sql("SELECT status FROM mk_contacts WHERE id = ?", id)[0]?.status;

before(async () => { srv = await startServer({ ENCRYPTION_KEY: TEST_KEY }); anon = new Client(srv.base); });
after(() => srv.stop());

describe("désinscription /u/:token", () => {
  test("GET : page de confirmation, adresse MASQUÉE, aucune désinscription (les aperçus de liens ne doivent rien faire)", async () => {
    const c = subscribed("awa.koffi@exemple.fr");
    const r = await anon.get(`/u/${compliance.unsubscribeToken(org, c.id, TEST_KEY)}`);
    assert.equal(r.status, 200);
    assert.match(r.text, /a\*\*\*@exemple\.fr/);
    assert.doesNotMatch(r.text, /awa\.koffi/);
    assert.match(r.text, /<form[^>]*method="post"/i);
    assert.equal(status(c.id), "subscribed");
  });
  test("en-têtes : pas de fuite du jeton par le Referer, pas de mise en cache, pas d'indexation", async () => {
    const c = subscribed();
    const r = await anon.get(`/u/${compliance.unsubscribeToken(org, c.id, TEST_KEY)}`);
    assert.equal(r.headers.get("referrer-policy"), "no-referrer");
    assert.match(r.headers.get("cache-control"), /no-store|no-cache/);
    assert.match(r.text, /noindex/);
  });
  test("POST : désinscrit, confirme, idempotent ; la preuve de retrait est enregistrée", async () => {
    const c = subscribed();
    const url = `/u/${compliance.unsubscribeToken(org, c.id, TEST_KEY)}`;
    const r = await anon.post(url, {});
    assert.equal(r.status, 200);
    assert.match(r.text, /désinscrit/i);
    assert.equal(status(c.id), "unsubscribed");
    assert.equal((await anon.post(url, {})).status, 200);
    assert.deepEqual(sql("SELECT action, source FROM mk_consents WHERE contact_id = ? ORDER BY id", c.id).map((x) => x.action), ["granted", "withdrawn"]);
  });
  test("désinscription « en un clic » d'un client mail (POST List-Unsubscribe=One-Click) : 200 sans page", async () => {
    const c = subscribed();
    const r = await anon.post(`/u/${compliance.unsubscribeToken(org, c.id, TEST_KEY)}`, { "List-Unsubscribe": "One-Click" });
    assert.equal(r.status, 200);
    assert.equal(status(c.id), "unsubscribed");
    assert.doesNotMatch(r.text, /<html/i);
  });
  test("jeton de liste : ne désinscrit que de cette liste", async () => {
    const c = subscribed();
    run("INSERT INTO mk_lists (organization_id, name) VALUES (1, ?)", `L${c.id}`);
    const listId = sql("SELECT id FROM mk_lists WHERE name = ?", `L${c.id}`)[0].id;
    const r = await anon.post(`/u/${compliance.unsubscribeToken(org, c.id, TEST_KEY, { listId })}`, {});
    assert.equal(r.status, 200);
    assert.equal(status(c.id), "subscribed");
    assert.equal(sql("SELECT COUNT(*) n FROM mk_unsubscribes WHERE contact_id = ? AND scope = 'list'", c.id)[0].n, 1);
  });
  test("jetons faux, modifiés, d'un autre type ou d'un contact effacé : réponse neutre, rien ne change", async () => {
    const c = subscribed();
    const good = compliance.unsubscribeToken(org, c.id, TEST_KEY);
    const forged = `${Buffer.from(JSON.stringify({ o: 1, c: c.id + 1, k: "unsub" })).toString("base64url")}.${good.split(".")[1]}`;
    for (const token of ["n-importe-quoi", `${good}x`, forged, compliance.preferencesToken(org, c.id, TEST_KEY), signToken({ o: 1, c: c.id, k: "unsub" }, "f".repeat(64))]) {
      assert.equal((await anon.get(`/u/${token}`)).status, 404, token.slice(0, 20));
      assert.equal((await anon.post(`/u/${token}`, {})).status, 404, token.slice(0, 20));
    }
    assert.equal(status(c.id), "subscribed");
    run("DELETE FROM mk_contacts WHERE id = ?", c.id);
    assert.equal((await anon.post(`/u/${good}`, {})).status, 404);
  });
  test("le message d'erreur ne révèle rien (ni existence du contact, ni cause)", async () => {
    const r = await anon.get("/u/abc.def");
    assert.equal(r.status, 404);
    assert.match(r.text, /lien n'est plus valide|lien n&#39;est plus valide/);
  });
  test("un jeton d'une autre organisation ne touche pas ce contact", async () => {
    const c = subscribed();
    const token = compliance.unsubscribeToken({ organizationId: 2 }, c.id, TEST_KEY);
    assert.equal((await anon.post(`/u/${token}`, {})).status, 404);
    assert.equal(status(c.id), "subscribed");
  });
  test("robots.txt interdit l'exploration de ces pages", async () => {
    const r = await anon.get("/robots.txt");
    assert.match(r.text, /Disallow: \/u\//);
    assert.match(r.text, /Disallow: \/preferences\//);
  });
});

describe("centre de préférences /preferences/:token", () => {
  before(() => {
    run("INSERT OR IGNORE INTO mk_preference_categories (organization_id, key, label, description, position) VALUES (1, 'promotions', 'Promotions', 'Offres et réductions', 0), (1, 'nouveautes', 'Nouveautés', 'Nouvelles formations', 1)");
  });
  test("GET : catégories cochées selon l'état ; POST enregistre les choix", async () => {
    const c = subscribed();
    const url = `/preferences/${compliance.preferencesToken(org, c.id, TEST_KEY)}`;
    const page = await anon.get(url);
    assert.equal(page.status, 200);
    assert.match(page.text, /Promotions/);
    assert.match(page.text, /<input[^>]*name="cat_promotions"[^>]*checked/);
    const r = await anon.post(url, { action: "save", cat_nouveautes: "on" });
    assert.equal(r.status, 200);
    assert.match(r.text, /préférences ont été enregistrées/i);
    const prefs = Object.fromEntries(sql("SELECT k.key, p.subscribed FROM mk_contact_preferences p JOIN mk_preference_categories k ON k.id = p.category_id WHERE p.contact_id = ?", c.id).map((x) => [x.key, x.subscribed]));
    assert.deepEqual(prefs, { promotions: 0, nouveautes: 1 });
    assert.equal(status(c.id), "subscribed");
  });
  test("« Me désinscrire de tout » depuis le centre", async () => {
    const c = subscribed();
    const r = await anon.post(`/preferences/${compliance.preferencesToken(org, c.id, TEST_KEY)}`, { action: "unsubscribe" });
    assert.match(r.text, /désinscrit/i);
    assert.equal(status(c.id), "unsubscribed");
  });
  test("un désinscrit peut se réabonner LUI-MÊME : preuve enregistrée (source preference_center)", async () => {
    const c = subscribed();
    await anon.post(`/u/${compliance.unsubscribeToken(org, c.id, TEST_KEY)}`, {});
    const url = `/preferences/${compliance.preferencesToken(org, c.id, TEST_KEY)}`;
    assert.match((await anon.get(url)).text, /Me réabonner/);
    const r = await anon.post(url, { action: "resubscribe" });
    assert.match(r.text, /de nouveau abonné|réabonné/i);
    assert.equal(status(c.id), "subscribed");
    const [proof] = sql("SELECT source, action, text_shown FROM mk_consents WHERE contact_id = ? ORDER BY id DESC LIMIT 1", c.id);
    assert.deepEqual([proof.source, proof.action], ["preference_center", "granted"]);
    assert.match(proof.text_shown, /de nouveau recevoir/);
  });
  test("adresse bloquée (rebond/plainte) : aucune réinscription possible, message clair", async () => {
    const c = subscribed();
    run("UPDATE mk_contacts SET status = 'complained' WHERE id = ?", c.id);
    run("INSERT INTO mk_suppressions (organization_id, email, reason) VALUES (1, ?, 'complained')", c.email);
    const url = `/preferences/${compliance.preferencesToken(org, c.id, TEST_KEY)}`;
    assert.doesNotMatch((await anon.get(url)).text, /Me réabonner/);
    const r = await anon.post(url, { action: "resubscribe" });
    assert.match(r.text, /bloquée/i);
    assert.equal(status(c.id), "complained");
  });
  test("jeton de désinscription refusé ici, jeton de préférences refusé pour /u", async () => {
    const c = subscribed();
    assert.equal((await anon.get(`/preferences/${compliance.unsubscribeToken(org, c.id, TEST_KEY)}`)).status, 404);
    assert.equal((await anon.get("/preferences/zzz")).status, 404);
  });
  test("le nom de catégorie posté est vérifié : une clé inconnue est ignorée sans erreur", async () => {
    const c = subscribed();
    const r = await anon.post(`/preferences/${compliance.preferencesToken(org, c.id, TEST_KEY)}`, { action: "save", "cat_inexistante": "on", cat_promotions: "on" });
    assert.equal(r.status, 200);
  });
});

describe("sans clé de chiffrement", () => {
  test("les pages publiques répondent « indisponible » (503) plutôt que de valider n'importe quoi", async () => {
    const other = await startServer({ ENCRYPTION_KEY: "" });
    try {
      const r = await new Client(other.base).get("/u/abc.def");
      assert.equal(r.status, 503);
    } finally { await other.stop(); }
  });
});
