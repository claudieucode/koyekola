// KOLAKISA CMS — Connecteurs → module d'IA : l'assistant utilise la clé du CENTRE DE CONNECTEURS (connexion du site, ou connexion centrale partagée), plus une variable d'environnement oubliée dans la config.
// Faux serveur d'API local avec le vrai SDK (aucune vraie demande à Anthropic). Sans connecteur ni variable : refus clair qui renvoie vers Réglages → Connecteurs.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const http = require("node:http");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, loginInstructor, newStudent } = require("./helpers");

describe("Connecteurs → assistant IA", () => {
  let srv, api, boss, db, A, adminA, apiKeys = [];
  const one = (sql, ...a) => db.prepare(sql).get(...a);
  const R = "/marketing/site-web";
  const API = `${R}/parametres/api/connecteurs`;
  const idOf = (c) => one("SELECT id FROM users WHERE email = ?", c.email).id;
  const parse = (t) => { try { return JSON.parse(t); } catch { return {}; } };
  const call = async (client, method, path, { site, json } = {}) => { const r = await client.request(`${API}${path}${site ? `?site=${site}` : ""}`, { method, json }); return { status: r.status, body: parse(r.text) }; };
  const KEY_C = "sk-ant-" + "CentralKey0123456789abcdef", KEY_A = "sk-ant-" + "SiteAlphaKey0123456789abcd";
  const ask = (client, site) => client.post("/marketing/ia/objets", { content: "Contenu de l'e-mail à titrer", ...(site ? { site } : {}) });

  before(async () => {
    api = http.createServer((req, res) => {
      let body = ""; req.on("data", (d) => (body += d));
      req.on("end", () => {
        if (req.method === "GET") { res.writeHead(200, { "content-type": "application/json" }); return res.end(JSON.stringify({ id: "ok" })); } // test de connexion du connecteur
        const r = JSON.parse(body || "{}"); apiKeys.push(req.headers["x-api-key"]);
        const text = JSON.stringify({ proposals: [{ subject: "Objet du faux serveur", preheader: "Préheader", why: "test" }] });
        res.writeHead(200, { "content-type": "application/json" });
        res.end(JSON.stringify({ id: "msg", type: "message", role: "assistant", model: r.model, content: [{ type: "text", text }], stop_reason: "end_turn", stop_sequence: null, usage: { input_tokens: 10, output_tokens: 20 } }));
      });
    });
    await new Promise((r) => api.listen(0, "127.0.0.1", r)); const base = `http://127.0.0.1:${api.address().port}`;
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "", ANTHROPIC_API_KEY: "", ANTHROPIC_BASE_URL: base, CONNECTOR_API_BASE_ANTHROPIC: base });
    boss = await loginInstructor(srv); db = srv.db();
    A = Number((await boss.post(`${R}/sites`, { name: "Site Alpha" })).location.match(/sites\/(\d+)/)[1]);
    adminA = await newStudent(srv); db.prepare("INSERT INTO mk_site_members (site_id, user_id, role) VALUES (?, ?, 'admin')").run(A, idOf(adminA));
    assert.equal((await boss.post(`${R}/sites/${A}/modules/ai`, { etat: "activer" })).status, 302);
  });
  after(async () => { db.close(); await srv.stop(); api.close(); });

  test("sans connecteur ni variable : refus clair qui renvoie vers Réglages → Connecteurs ; aucun appel au fournisseur", async () => {
    const r = await ask(boss); assert.notEqual(r.status, 200); assert.match(r.text, /Réglages → Connecteurs/); assert.equal(apiKeys.length, 0);
  });

  test("connecteur central configuré et testé : l'assistant l'utilise avec SA clé (l'ancienne variable n'est plus nécessaire)", async () => {
    const c = await call(boss, "PUT", "/anthropic", { json: { values: { apiKey: KEY_C, model: "claude-test" } } }); assert.equal(c.status, 200, JSON.stringify(c.body));
    assert.equal((await call(boss, "POST", `/${c.body.connection.id}/test`)).body.connection.state, "connected");
    const r = await ask(boss); assert.equal(r.status, 200); assert.match(r.text, /Objet du faux serveur/); assert.equal(apiKeys.at(-1), KEY_C);
  });

  test("un site n'utilise PAS la clé centrale tant qu'elle n'est pas partagée ; partagée, il l'utilise ; avec la sienne, c'est la sienne ; désactivée, il ne retombe pas en silence sur le central", async () => {
    const n = apiKeys.length;
    const refused = await ask(adminA, A); assert.notEqual(refused.status, 200); assert.equal(apiKeys.length, n, "aucun appel avec la clé centrale");
    const idC = one("SELECT id FROM mk_connections WHERE site_id IS NULL AND connector = 'anthropic'").id;
    assert.equal((await call(boss, "POST", `/${idC}/partager`, { json: { shared: true } })).status, 200);
    const shared = await ask(adminA, A); assert.equal(shared.status, 200, shared.text.slice(0, 200)); assert.equal(apiKeys.at(-1), KEY_C, "clé centrale partagée");
    const own = await call(adminA, "PUT", "/anthropic", { site: A, json: { values: { apiKey: KEY_A, model: "claude-test" } } }); assert.equal(own.status, 200);
    await call(adminA, "POST", `/${own.body.connection.id}/test`, { site: A });
    const mine = await ask(adminA, A); assert.equal(mine.status, 200, "propre clé : " + mine.text.slice(0, 300)); assert.equal(apiKeys.at(-1), KEY_A, "le site utilise SA clé");
    const central = await ask(boss); assert.equal(central.status, 200, "central : " + central.text.slice(0, 300)); assert.equal(apiKeys.at(-1), KEY_C, "le niveau central garde la sienne");
    // le site désactive SA connexion : il ne retombe PAS en silence sur la clé centrale (sa décision prime ; aucun coût ni transfert de données imprévu)
    await call(adminA, "POST", `/${own.body.connection.id}/desactiver`, { site: A });
    const n2 = apiKeys.length; const stopped = await ask(adminA, A); assert.notEqual(stopped.status, 200, "connexion du site désactivée : l'assistant s'arrête"); assert.equal(apiKeys.length, n2, "aucun appel, ni avec la clé centrale");
    await call(adminA, "POST", `/${own.body.connection.id}/activer`, { site: A }); assert.equal((await ask(adminA, A)).status, 200); assert.equal(apiKeys.at(-1), KEY_A, "réactivée : de nouveau sa clé");
    await call(adminA, "DELETE", `/${own.body.connection.id}`, { site: A }); assert.equal((await ask(adminA, A)).status, 200); assert.equal(apiKeys.at(-1), KEY_C, "connexion supprimée : retour à la connexion centrale partagée");
    await call(boss, "POST", `/${idC}/partager`, { json: { shared: false } }); const none = await ask(adminA, A); assert.notEqual(none.status, 200, "plus de partage ni de clé propre : l'assistant s'arrête");
  });
});
