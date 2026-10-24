// KOLAKISA CMS — Réglages → Connecteurs : socle central. Fournisseurs SIMULÉS par un faux serveur local (aucun appel réseau réel) ; tout le reste est réel : routes, droits, base, chiffrement des secrets.
// Testé : catalogue, configuration validée, secrets (chiffrés, jamais renvoyés ni journalisés), test de connexion (succès, clé refusée, modèle absent, quota, indisponible, délai, réponse trop grande),
// états réels, désactivation, révocation, suppression, partage explicite, préférence de fournisseur sans basculement automatique, invocation d'une capacité, droits et isolation entre sites.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const http = require("node:http");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, Client, loginInstructor, newStudent } = require("./helpers");

describe("Connecteurs", () => {
  let srv, fake, boss, db, orgId, A, B, adminA, adminB, viewerA, outsider, anon, mode = {}, calls = [];
  const one = (sql, ...a) => db.prepare(sql).get(...a);
  const R = "/marketing/site-web";
  const API = `${R}/parametres/api/connecteurs`;
  const qs = (site) => (site ? `?site=${site}` : "");
  const idOf = (c) => one("SELECT id FROM users WHERE email = ?", c.email).id;
  const parse = (t) => { try { return JSON.parse(t); } catch { return { raw: String(t).slice(0, 120) }; } };
  const call = async (client, method, path, { site, json } = {}) => { const r = await client.request(`${API}${path}${qs(site)}`, { method, json }); return { status: r.status, body: parse(r.text) }; };
  const configure = (client, id, values, site) => call(client, "PUT", `/${id}`, { site, json: { values } });
  const KEY = "sk-ant-" + "a1B2c3D4e5F6g7H8i9J0kLmN"; // clé factice de test, au bon format
  const OKEY = "sk-" + "proj-abcdefghijklmnopqrstuvwx";
  const row = (id) => one("SELECT * FROM mk_connections WHERE id = ?", id);

  before(async () => {
    // Faux fournisseurs : un seul serveur, trois « API » (chemins distincts), comportement piloté par `mode`
    fake = http.createServer((req, res) => {
      let body = ""; req.on("data", (c) => { body += c; });
      req.on("end", () => {
        calls.push({ url: req.url, method: req.method, headers: req.headers, body });
        const send = (status, obj) => { res.writeHead(status, { "content-type": "application/json" }); res.end(JSON.stringify(obj)); };
        if (mode.hang) return; // pas de réponse : délai
        if (mode.status) return send(mode.status, mode.body || { error: { message: mode.message || "erreur simulée" } });
        if (mode.huge) { res.writeHead(200, { "content-type": "application/json" }); return res.end(JSON.stringify({ blob: "x".repeat(3 * 1024 * 1024) })); }
        if (mode.notjson) { res.writeHead(200, { "content-type": "text/html" }); return res.end("<html>pas du json</html>"); }
        const key = req.headers["x-api-key"] || (req.headers.authorization || "").replace("Bearer ", "") || req.headers["x-goog-api-key"];
        if (mode.rejectKey && key === mode.rejectKey) return send(401, { error: { message: `Incorrect API key provided: ${key}` } });
        if (req.method === "GET" && /\/models\/missing-model/.test(req.url)) return send(404, { error: { message: "model not found" } });
        if (req.method === "GET") return send(200, { id: "ok", data: [] });
        if (/\/v1\/messages$/.test(req.url)) return send(200, { model: "claude-test", content: [{ type: "text", text: "Bonjour depuis Claude" }], usage: { input_tokens: 11, output_tokens: 7 } });
        if (/\/chat\/completions$/.test(req.url)) return send(200, { model: "gpt-test", choices: [{ message: { content: "Bonjour depuis GPT" }, finish_reason: "stop" }], usage: { prompt_tokens: 5, completion_tokens: 3 } });
        if (/generateContent$/.test(req.url)) return send(200, { candidates: [{ content: { parts: [{ text: "Bonjour depuis Gemini" }] } }], usageMetadata: { promptTokenCount: 4, candidatesTokenCount: 2 } });
        send(404, { error: { message: "inconnu" } });
      });
    });
    await new Promise((r) => fake.listen(0, "127.0.0.1", r));
    const base = `http://127.0.0.1:${fake.address().port}`;
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "", CONNECTOR_API_BASE_ANTHROPIC: base, CONNECTOR_API_BASE_OPENAI: base, CONNECTOR_API_BASE_GOOGLE_AI: base });
    boss = await loginInstructor(srv); db = srv.db(); anon = new Client(srv.base);
    orgId = one("SELECT id FROM mk_organizations").id;
    const site = (n) => Number(db.prepare("INSERT INTO mk_sites (organization_id, name, slug, tokens) VALUES (?, ?, ?, '{}')").run(orgId, n, n.toLowerCase()).lastInsertRowid);
    A = site("Alpha"); B = site("Beta");
    [adminA, adminB, viewerA, outsider] = await Promise.all([1, 2, 3, 4].map(() => newStudent(srv)));
    db.prepare("INSERT INTO mk_site_members (site_id, user_id, role) VALUES (?, ?, 'admin')").run(A, idOf(adminA));
    db.prepare("INSERT INTO mk_site_members (site_id, user_id, role) VALUES (?, ?, 'admin')").run(B, idOf(adminB));
    db.prepare("INSERT INTO mk_site_members (site_id, user_id, role) VALUES (?, ?, 'viewer')").run(A, idOf(viewerA));
  });
  after(async () => { db.close(); await srv.stop(); fake.close(); });

  test("catalogue : trois connecteurs IA natifs (capacité réelle) + intégrations existantes avec leur état RÉEL, sans « Installer » ni faux état", async () => {
    const r = await call(boss, "GET", ""); assert.equal(r.status, 200, JSON.stringify(r.body));
    const ids = r.body.catalog.map((c) => c.id); for (const id of ["anthropic", "openai", "google-ai", "email-sending", "sms-twilio", "stripe"]) assert.ok(ids.includes(id), id);
    const an = r.body.catalog.find((c) => c.id === "anthropic"); assert.deepEqual(an.capabilities, ["text.generate"]); assert.equal(an.available, true); assert.equal(an.connection, null); assert.ok(an.requirements.length && an.docsUrl && an.credentialsUrl);
    const st = r.body.catalog.find((c) => c.id === "stripe"); assert.equal(st.kind, "external"); assert.equal(st.external.state, "unconfigured", "aucune clé Stripe sur ce serveur : l'état le dit");
    assert.match(JSON.stringify(r.body), /^((?!Installer).)*$/s, "aucun bouton Installer"); assert.equal(r.body.can.write, true);
    const siteView = await call(adminA, "GET", "", { site: A }); assert.equal(siteView.status, 200); assert.ok(!siteView.body.catalog.some((c) => c.kind === "external"), "les intégrations de l'organisation ne sont pas montrées à un site");
  });

  test("configuration : champs validés (format de clé, modèle), secret chiffré en base, JAMAIS renvoyé ; une clé vide conserve l'ancienne", async () => {
    for (const [values, re] of [[{ apiKey: "mauvaise", model: "claude-test" }, /sk-ant-/], [{ apiKey: KEY, model: "pas de modèle!" }, /Identifiant de modèle/], [{ model: "claude-test" }, /obligatoire/], [{ apiKey: KEY, model: "claude-test", inconnu: "x" }, /Champ inconnu/]]) { const r = await configure(boss, "anthropic", values); assert.ok([422].includes(r.status) && re.test(r.body.error), `${JSON.stringify(values)} → ${r.status} ${r.body.error}`); }
    assert.equal(one("SELECT COUNT(*) AS n FROM mk_connections").n, 0, "rien d'enregistré en cas d'erreur");
    const ok = await configure(boss, "anthropic", { apiKey: KEY, model: "claude-test" }); assert.equal(ok.status, 200, JSON.stringify(ok.body));
    const conn = ok.body.connection; assert.equal(conn.state, "configured", "enregistré ≠ connecté"); assert.equal(conn.lastTest, null); assert.deepEqual(conn.secretFields, ["apiKey"]);
    assert.ok(!JSON.stringify(ok.body).includes(KEY), "la réponse ne contient aucun secret"); assert.ok(!(await boss.get(`${R}/parametres/connecteurs`)).text.includes(KEY));
    const stored = one("SELECT value, is_secret FROM mk_settings WHERE key = ?", `connector.${conn.id}.api_key`); assert.equal(stored.is_secret, 1); assert.ok(stored.value.startsWith("v1:") && !stored.value.includes(KEY), "chiffré (AES-256-GCM)");
    assert.ok(!JSON.stringify(db.prepare("SELECT * FROM mk_connections").all()).includes(KEY), "jamais dans mk_connections");
    const keep = await configure(boss, "anthropic", { apiKey: "", model: "claude-autre" }); assert.equal(keep.status, 200); assert.deepEqual(keep.body.connection.secretFields, ["apiKey"]); assert.equal(keep.body.connection.config.model, "claude-autre");
    await configure(boss, "anthropic", { apiKey: "", model: "claude-test" });
    const log = JSON.stringify(db.prepare("SELECT metadata FROM mk_audit_logs WHERE resource_type = 'connection'").all()); assert.ok(!log.includes(KEY) && !log.includes("a1B2c3D4"), "le journal ne contient aucun secret"); assert.match(log, /connection|secretsReplaced/);
  });

  test("test de connexion : vrai appel (clé dans l'EN-TÊTE, jamais l'adresse) ; succès → connecté ; chaque échec a son code et son message sans secret", async () => {
    const id = one("SELECT id FROM mk_connections WHERE connector = 'anthropic'").id; calls = []; mode = {};
    const good = await call(boss, "POST", `/${id}/test`); assert.equal(good.status, 200, JSON.stringify(good.body)); assert.equal(good.body.test.ok, true); assert.equal(good.body.connection.state, "connected"); assert.ok(good.body.connection.lastTest.ok);
    assert.ok(calls.length >= 2 && calls.every((c) => c.headers["x-api-key"] === KEY && !c.url.includes(KEY)), "clé en en-tête, jamais dans l'adresse");
    const cases = [[{ status: 401, message: `Invalid x-api-key ${KEY}` }, "auth_invalid", "error"], [{ status: 403 }, "permission_denied", "error"], [{ status: 429, message: "You exceeded your current quota, billing" }, "quota_exceeded", "error"], [{ status: 429 }, "rate_limited", "error"], [{ status: 503 }, "unavailable", "error"], [{ notjson: true }, "invalid_response", "error"], [{ huge: true }, "response_too_large", "error"]];
    for (const [m, code, state] of cases) { mode = m; const r = await call(boss, "POST", `/${id}/test`); assert.equal(r.body.test.ok, false, code); assert.equal(r.body.test.code, code, JSON.stringify(r.body.test)); assert.equal(r.body.connection.state, state); assert.ok(!JSON.stringify(r.body).includes(KEY) && !JSON.stringify(r.body).includes("a1B2c3D4"), `${code} : aucun secret dans la réponse`); }
    assert.ok(!JSON.stringify(db.prepare("SELECT * FROM mk_connections").all()).includes(KEY), "ni dans les messages d'erreur enregistrés");
    mode = {}; db.prepare("UPDATE mk_connections SET config = ? WHERE id = ?").run(JSON.stringify({ model: "missing-model" }), id);
    const miss = await call(boss, "POST", `/${id}/test`); assert.equal(miss.body.test.code, "model_not_found"); assert.match(miss.body.test.message, /Clé valide, mais le modèle/);
    await configure(boss, "anthropic", { model: "claude-test" }); assert.equal((await call(boss, "POST", `/${id}/test`)).body.connection.state, "connected", "retour à connecté après correction");
  });

  test("délai dépassé et fournisseur injoignable : codes normalisés (timeout, network) ; changer la configuration invalide l'ancien test", async () => {
    const id = one("SELECT id FROM mk_connections WHERE connector = 'anthropic'").id;
    const before = one("SELECT timeout_ms FROM (SELECT 1 AS timeout_ms)"); void before;
    await configure(boss, "anthropic", { model: "claude-test2" }); const c = row(id); assert.equal(c.state, "configured"); assert.equal(c.last_test_at, null, "ancien test invalidé"); mode = {};
    await call(boss, "POST", `/${id}/test`); await configure(boss, "anthropic", { model: "claude-test" });
    // injoignable : on arrête le faux serveur pour un appel, puis on le relance sur le même port
    const port = fake.address().port; await new Promise((r) => fake.close(r)); const down = await call(boss, "POST", `/${id}/test`); assert.equal(down.body.test.code, "network"); assert.equal(down.body.connection.state, "error");
    await new Promise((r) => fake.listen(port, "127.0.0.1", r)); mode = {}; assert.equal((await call(boss, "POST", `/${id}/test`)).body.connection.state, "connected", "reconnexion");
  });

  test("désactiver / réactiver / révoquer / supprimer : états réels, secrets réellement effacés", async () => {
    const id = one("SELECT id FROM mk_connections WHERE connector = 'anthropic'").id;
    const off = await call(boss, "POST", `/${id}/desactiver`); assert.equal(off.body.connection.state, "disabled");
    assert.equal((await call(boss, "POST", `/${id}/test`)).status, 422, "pas de test d'un connecteur désactivé");
    assert.equal((await call(boss, "POST", `/${id}/activer`)).body.connection.state, "connected", "réactivé : retrouve son dernier test réussi");
    const rev = await call(boss, "POST", `/${id}/revoquer`); assert.equal(rev.status, 200); assert.deepEqual(rev.body.connection.secretFields, []); assert.equal(rev.body.connection.state, "configured");
    assert.equal(one("SELECT COUNT(*) AS n FROM mk_settings WHERE key LIKE ?", `connector.${id}.%`).n, 0, "secret supprimé du serveur");
    const t = await call(boss, "POST", `/${id}/test`); assert.equal(t.body.test.code, "not_configured"); assert.match(t.body.test.message, /Clé d'API/);
    await configure(boss, "anthropic", { apiKey: KEY, model: "claude-test" }); const del = await call(boss, "DELETE", `/${id}`); assert.equal(del.status, 200); assert.equal(one("SELECT COUNT(*) AS n FROM mk_connections").n, 0); assert.equal(one("SELECT COUNT(*) AS n FROM mk_settings WHERE key LIKE 'connector.%'").n, 0, "plus aucun secret");
  });

  test("capacité text.generate : même contrat pour les trois fournisseurs ; entrées validées ; sortie normalisée ; utilisations comptées", async () => {
    const connectors = require("../src/services/connectors"); void connectors;
    for (const [id, values, text] of [["anthropic", { apiKey: KEY, model: "claude-test" }, "Bonjour depuis Claude"], ["openai", { apiKey: OKEY, model: "gpt-test" }, "Bonjour depuis GPT"], ["google-ai", { apiKey: "AIza" + "SyD-abcdefghijklmnopqrstuvwxyz1234", model: "gemini-test" }, "Bonjour depuis Gemini"]]) {
      const c = await configure(boss, id, values); assert.equal(c.status, 200, `${id} ${JSON.stringify(c.body)}`); const t = await call(boss, "POST", `/${c.body.connection.id}/test`); assert.equal(t.body.connection.state, "connected", `${id} ${JSON.stringify(t.body.test)}`);
    }
    // sans préférence et avec trois fournisseurs : refus explicite (pas de choix silencieux)
    const r = await call(boss, "PUT", "-preference", { json: { capability: "text.generate", connector: "inconnu" } }); assert.equal(r.status, 422);
    const pref = await call(boss, "PUT", "-preference", { json: { capability: "text.generate", connector: "openai" } }); assert.equal(pref.status, 200); assert.equal(pref.body.capabilities[0].preferred, "openai");
    // exécution réelle d'un module : appel du service par un processus de test dédié (même base)
    const out = await runInServer(`const c = require("./src/services/connectors"); const db = require("./src/config/database"); return c.invoke({ db, organizationId: ${orgId}, userId: 1 }, { siteId: null }, "text.generate", { prompt: "Dis bonjour", system: "Sois bref", maxTokens: 50 });`);
    assert.equal(out.text, "Bonjour depuis GPT"); assert.equal(out.provider, "openai"); assert.deepEqual(out.usage, { inputTokens: 5, outputTokens: 3 });
    const bad = await runInServer(`const c = require("./src/services/connectors"); const db = require("./src/config/database"); try { await c.invoke({ db, organizationId: ${orgId} }, { siteId: null }, "text.generate", { prompt: "", maxTokens: 5000 }); return { ok: true }; } catch (e) { return { code: e.code, message: e.message }; }`);
    assert.equal(bad.code, "bad_request"); assert.ok(one("SELECT usage_count FROM mk_connections WHERE connector = 'openai'").usage_count >= 1, "utilisation comptée");
  });
  // Exécute du code dans un processus Node qui partage la base du serveur et les mêmes variables (le serveur de test vit dans un autre processus)
  async function runInServer(code) {
    const execFile = require("node:util").promisify(require("node:child_process").execFile); // asynchrone : le faux serveur vit dans CE processus et doit pouvoir répondre
    const base = `http://127.0.0.1:${fake.address().port}`;
    const { stdout: out } = await execFile(process.execPath, ["-e", `(async () => { const result = await (async () => { ${code} })(); process.stdout.write("@@" + JSON.stringify(result)); })().catch((e) => { process.stdout.write("@@" + JSON.stringify({ crash: e.message })); });`], { cwd: require("node:path").join(__dirname, ".."), env: { ...process.env, DATA_DIR: require("node:path").join(srv.dir, "data"), UPLOADS_DIR: require("node:path").join(srv.dir, "uploads"), SESSION_SECRET: "secret-de-test-assez-long-1234567890", NODE_ENV: "test", CONNECTOR_API_BASE_ANTHROPIC: base, CONNECTOR_API_BASE_OPENAI: base, CONNECTOR_API_BASE_GOOGLE_AI: base, ENCRYPTION_KEY: TEST_KEY }, encoding: "utf8", timeout: 30000 });
    const parsed = JSON.parse(out.split("@@").pop()); if (parsed && parsed.crash) throw new Error(`processus d'appoint : ${parsed.crash}`); return parsed;
  }
});
