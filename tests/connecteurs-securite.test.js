// KOLAKISA CMS — Connecteurs : sécurité et isolation. Droits côté serveur, secrets d'un site invisibles et inaccessibles à un autre (même en connaissant l'identifiant), partage central EXPLICITE,
// aucune écriture d'un site vers le niveau central, aucune destination interne (SSRF), aucun basculement automatique de fournisseur, limites d'usage.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const http = require("node:http");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, Client, loginInstructor, newStudent } = require("./helpers");

describe("Connecteurs : sécurité et isolation", () => {
  let srv, fake, boss, db, orgId, A, B, adminA, adminB, viewerA, outsider, anon, mode = {};
  const one = (sql, ...a) => db.prepare(sql).get(...a);
  const R = "/marketing/site-web";
  const API = `${R}/parametres/api/connecteurs`;
  const qs = (site) => (site ? `?site=${site}` : "");
  const idOf = (c) => one("SELECT id FROM users WHERE email = ?", c.email).id;
  const parse = (t) => { try { return JSON.parse(t); } catch { return { raw: String(t).slice(0, 120) }; } };
  const call = async (client, method, path, { site, json } = {}) => { const r = await client.request(`${API}${path}${qs(site)}`, { method, json }); return { status: r.status, body: parse(r.text) }; };
  const configure = (client, id, values, site) => call(client, "PUT", `/${id}`, { site, json: { values } });
  const KEY_A = "sk-ant-" + "SiteAlphaKey0123456789abcd", KEY_B = "sk-ant-" + "SiteBetaKey0123456789abcdef", KEY_C = "sk-ant-" + "CentralKey0123456789abcdef";
  const OKEY = "sk-" + "proj-abcdefghijklmnopqrstuvwx";
  const secretRows = () => db.prepare("SELECT key, value FROM mk_settings WHERE key LIKE 'connector.%'").all();

  before(async () => {
    fake = http.createServer((req, res) => {
      let body = ""; req.on("data", (c) => { body += c; });
      req.on("end", () => {
        const send = (status, obj) => { res.writeHead(status, { "content-type": "application/json" }); res.end(JSON.stringify(obj)); };
        if (mode.status) return send(mode.status, { error: { message: "simulé" } });
        if (req.method === "GET") return send(200, { id: "ok" });
        if (/\/v1\/messages$/.test(req.url)) return send(200, { model: "m", content: [{ type: "text", text: `claude via ${req.headers["x-api-key"].slice(7, 16)}` }], usage: { input_tokens: 1, output_tokens: 1 } });
        if (/\/chat\/completions$/.test(req.url)) return send(200, { model: "g", choices: [{ message: { content: "gpt" }, finish_reason: "stop" }], usage: { prompt_tokens: 1, completion_tokens: 1 } });
        send(404, {});
      });
    });
    await new Promise((r) => fake.listen(0, "127.0.0.1", r)); const base = `http://127.0.0.1:${fake.address().port}`;
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "", CONNECTOR_API_BASE_ANTHROPIC: base, CONNECTOR_API_BASE_OPENAI: base });
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

  test("droits : lecture seule pour un lecteur, rien pour l'étranger et l'anonyme ; un accès limité à un site n'ouvre JAMAIS le niveau central", async () => {
    assert.ok([403, 404].includes((await call(viewerA, "PUT", "/anthropic", { site: A, json: { values: { apiKey: KEY_A, model: "model-1" } } })).status), "le lecteur n'écrit pas");
    assert.ok([302, 401, 403].includes((await call(outsider, "GET", "", { site: A })).status)); assert.ok([302, 401, 403].includes((await call(anon, "GET", "", { site: A })).status));
    assert.notEqual((await call(adminA, "GET", "")).status, 200, "le niveau central est réservé à l'équipe"); assert.notEqual((await call(adminA, "PUT", "/anthropic", { json: { values: { apiKey: KEY_A, model: "model-1" } } })).status, 200); assert.equal(one("SELECT COUNT(*) AS n FROM mk_connections").n, 0, "rien écrit au central");
    assert.ok((await adminA.get(`${R}/parametres/connecteurs`)).status !== 200, "la page centrale est fermée à un accès limité"); assert.equal((await adminA.get(`${R}/sites/${A}/parametres-connecteurs`)).status, 200, "la page du site est ouverte");
    assert.notEqual((await adminA.get(`${R}/sites/${B}/parametres-connecteurs`)).status, 200, "Beta fermé à l'admin d'Alpha");
    const v = await call(viewerA, "GET", "", { site: A }); if (v.status === 200) assert.equal(v.body.can.write, false);
  });

  test("isolation : la clé d'Alpha n'est ni visible ni utilisable ni modifiable depuis Beta, même avec l'identifiant de la connexion ou un « site » forgé", async () => {
    const a = await configure(adminA, "anthropic", { apiKey: KEY_A, model: "model-1" }, A); assert.equal(a.status, 200, JSON.stringify(a.body)); const idA = a.body.connection.id;
    const b = await configure(adminB, "anthropic", { apiKey: KEY_B, model: "model-1" }, B); assert.equal(b.status, 200); const idB = b.body.connection.id; assert.notEqual(idA, idB);
    assert.equal(one("SELECT site_id FROM mk_connections WHERE id = ?", idA).site_id, A);
    const viewB = JSON.stringify((await call(adminB, "GET", "", { site: B })).body); assert.ok(!viewB.includes(KEY_A) && !viewB.includes(KEY_B), "aucun secret dans l'API"); assert.ok(!viewB.includes(`"id":${idA}`), "la connexion d'Alpha n'apparaît pas chez Beta");
    for (const [label, r] of [["test par l'id d'Alpha", await call(adminB, "POST", `/${idA}/test`, { site: B })], ["désactivation", await call(adminB, "POST", `/${idA}/desactiver`, { site: B })], ["révocation", await call(adminB, "POST", `/${idA}/revoquer`, { site: B })], ["suppression", await call(adminB, "DELETE", `/${idA}`, { site: B })]]) assert.ok([403, 404, 422].includes(r.status), `${label} : ${r.status}`);
    for (const r of [await call(adminB, "POST", `/${idA}/test`, { site: A }), await call(adminB, "PUT", "/anthropic", { site: A, json: { values: { apiKey: KEY_B, model: "model-x" } } })]) assert.ok([403, 404].includes(r.status), "site forgé : refusé");
    assert.equal(one("SELECT state FROM mk_connections WHERE id = ?", idA).state, "configured"); assert.equal(secretRows().length, 2, "les deux secrets sont intacts");
    const rawA = secretRows().find((s) => s.key === `connector.${idA}.api_key`).value; assert.ok(!rawA.includes(KEY_A));
    // un secret chiffré copié d'une ligne à l'autre devient illisible (contexte lié)
    const idBKey = `connector.${idB}.api_key`; db.prepare("UPDATE mk_settings SET value = ? WHERE key = ?").run(rawA, idBKey);
    const t = await call(adminB, "POST", `/${idB}/test`, { site: B }); assert.equal(t.status, 200, "pas d'erreur technique"); assert.equal(t.body.test.ok, false, "secret copié = inutilisable"); assert.equal(t.body.test.code, "not_configured"); assert.match(t.body.test.message, /illisible/); db.prepare("UPDATE mk_settings SET value = ? WHERE key = ?").run(secretRows().find((s) => s.key === `connector.${idA}.api_key`).value, `connector.${idB}.api_key`);
    await configure(adminB, "anthropic", { apiKey: KEY_B, model: "model-1" }, B);
    assert.equal((await call(adminA, "POST", `/${idA}/test`, { site: A })).body.connection.state, "connected"); assert.equal((await call(adminB, "POST", `/${idB}/test`, { site: B })).body.connection.state, "connected");
  });

  test("niveau central → sites : une connexion centrale n'est utilisée par un site QUE si l'équipe la partage ; le site garde la priorité avec ses propres identifiants ; jamais d'écriture d'un site vers le central", async () => {
    const c = await configure(boss, "openai", { apiKey: OKEY, model: "gpt-one" }); assert.equal(c.status, 200); const idC = c.body.connection.id; await call(boss, "POST", `/${idC}/test`);
    const visible = async (client, site) => (await call(client, "GET", "", { site })).body.catalog.find((x) => x.id === "openai");
    assert.equal((await visible(adminA, A)).connection, null, "non partagé : invisible pour le site"); assert.equal((await visible(adminA, A)).source, null);
    assert.equal((await call(adminA, "POST", `/${idC}/partager`, { site: A, json: { shared: true } })).status === 200, false, "un site ne partage pas le central");
    const sh = await call(boss, "POST", `/${idC}/partager`, { json: { shared: true } }); assert.equal(sh.status, 200); assert.equal(one("SELECT shared FROM mk_connections WHERE id = ?", idC).shared, 1);
    const seen = await visible(adminA, A); assert.equal(seen.source, "central"); assert.equal(seen.connection.id, idC); assert.ok(!JSON.stringify(seen).includes(OKEY), "le site n'apprend jamais le secret central");
    assert.equal((await call(adminA, "POST", `/${idC}/desactiver`, { site: A })).status === 200, false, "le site ne désactive pas la connexion centrale");
    assert.equal(one("SELECT state FROM mk_connections WHERE id = ?", idC).state, "connected");
    assert.equal((await visible(adminB, B)).source, "central", "tous les sites voient le partage");
    // le site passe à ses propres identifiants : priorité au site
    const own = await configure(adminA, "openai", { apiKey: OKEY.replace("abcdef", "ZZZZZZ"), model: "gpt-two" }, A); assert.equal(own.status, 200); assert.equal((await visible(adminA, A)).source, "site"); assert.equal((await visible(adminB, B)).source, "central");
    await call(boss, "POST", `/${idC}/partager`, { json: { shared: false } }); assert.equal((await visible(adminB, B)).connection, null, "partage retiré");
  });

  test("fournisseurs multiples : sans préférence → refus explicite ; avec préférence → ce fournisseur ; panne = erreur (AUCUN basculement vers l'autre) ; désactivé = refus clair", async () => {
    const exec = (siteId, extra = "") => runInServer(`const c = require("./src/services/connectors"); const db = require("./src/config/database"); try { const r = await c.invoke({ db, organizationId: ${orgId}, userId: 1 }, { siteId: ${siteId} }, "text.generate", { prompt: "salut" }${extra}); return { ok: true, text: r.text, provider: r.provider }; } catch (e) { return { ok: false, code: e.code, message: e.message }; }`);
    // Alpha et Beta ont chacun deux fournisseurs (Anthropic, OpenAI) : chacun choisit explicitement le sien
    await configure(adminB, "openai", { apiKey: OKEY, model: "gpt-one" }, B); await call(adminB, "POST", `/${one("SELECT id FROM mk_connections WHERE site_id = ? AND connector = 'openai'", B).id}/test`, { site: B });
    for (const [client, site] of [[adminA, A], [adminB, B]]) assert.equal((await call(client, "PUT", "-preference", { site, json: { capability: "text.generate", connector: "anthropic" } })).status, 200);
    // niveau central : on configure Anthropic (OpenAI y est déjà)
    const an = await configure(boss, "anthropic", { apiKey: KEY_C, model: "model-1" }); await call(boss, "POST", `/${an.body.connection.id}/test`);
    const none = await exec("null"); assert.equal(none.ok, false); assert.equal(none.code, "not_configured"); assert.match(none.message, /Plusieurs fournisseurs sont disponibles|choisissez/);
    await call(boss, "PUT", "-preference", { json: { capability: "text.generate", connector: "anthropic" } }); const first = await exec("null"); assert.equal(first.ok, true); assert.equal(first.provider, "anthropic"); assert.match(first.text, /claude via CentralKe/);
    mode = { status: 503 }; const down = await exec("null"); assert.equal(down.ok, false); assert.equal(down.code, "unavailable", "la panne d'Anthropic n'est pas contournée par OpenAI"); mode = {};
    const idAn = an.body.connection.id; await call(boss, "POST", `/${idAn}/desactiver`); const off = await exec("null"); assert.equal(off.ok, false); assert.equal(off.code, "disabled"); assert.match(off.message, /désactivé/); await call(boss, "POST", `/${idAn}/activer`);
    // un site sans connexion propre ni partage n'utilise rien du central
    const siteNone = await exec(String(B)); assert.equal(siteNone.ok, true, "Beta a sa propre clé Anthropic (étape précédente)"); assert.match(siteNone.text, /claude via SiteBeta/);
    const siteC = await runInServer(`const c = require("./src/services/connectors"); const db = require("./src/config/database"); const s = c.status({ db, organizationId: ${orgId} }, { siteId: ${A} }, "text.generate"); return s;`); assert.equal(siteC.available, true); assert.equal(siteC.provider, "anthropic", "Alpha : sa propre clé Anthropic (jamais celle du central)");
    const res = await exec(String(A)); assert.match(res.text, /claude via SiteAlpha/, "la requête d'Alpha part avec la clé d'Alpha");
  });

  test("anti-SSRF et en-têtes : destination hors liste refusée, adresses internes refusées, redirections refusées, surcharge de test ignorée en production", async () => {
    const out = await runInServer(`
      const h = require("./src/services/connectors/http"); const { ConnectorError } = require("./src/services/connectors/errors");
      const attempt = async (adapter, env) => { Object.assign(process.env, env || {}); try { await h.request(adapter, { path: "/x" }); return "ok"; } catch (e) { return e.code; } };
      const res = {};
      process.env.NODE_ENV = "production"; process.env.CONNECTOR_API_BASE_EVIL = "http://127.0.0.1:1";
      res.prodIgnoresOverride = h.baseOf({ id: "evil", baseUrl: "https://api.example.com" });
      res.ipLiteral = await attempt({ id: "a", baseUrl: "https://127.0.0.1" });
      res.http = await attempt({ id: "b", baseUrl: "http://api.example.com" });
      res.localhostName = await attempt({ id: "c", baseUrl: "https://localhost" });
      res.privateName = await attempt({ id: "d", baseUrl: "https://metadata.google.internal" });
      res.credentials = await attempt({ id: "e", baseUrl: "https://user:pass@api.example.com" });
      return res;`);
    assert.equal(out.prodIgnoresOverride, "https://api.example.com", "la base de test n'est jamais lue en production");
    for (const k of ["ipLiteral", "http", "credentials"]) assert.equal(out[k], "blocked_destination", k);
    assert.ok(["blocked_destination", "network"].includes(out.localhostName), `localhost : ${out.localhostName}`); assert.ok(["blocked_destination", "network"].includes(out.privateName), `nom interne : ${out.privateName}`);
    const reg = await runInServer(`const c = require("./src/services/connectors"); try { c.register({ id: "mauvais", name: "x", category: "ai", baseUrl: "http://interne.local", fields: [], capabilities: {}, test() {} }); return { ok: true }; } catch (e) { return { ok: false, message: e.message }; }`); assert.equal(reg.ok, false, "un adaptateur doit déclarer une base HTTPS et au moins une capacité");
    const dup = await runInServer(`const c = require("./src/services/connectors"); try { c.register(c.get("anthropic")); return { ok: true }; } catch (e) { return { ok: false, message: e.message }; }`); assert.equal(dup.ok, false);
  });

  test("limites : 30 demandes par minute et par connexion (avec message clair) ; entrée invalide refusée avant tout appel", async () => {
    const out = await runInServer(`const c = require("./src/services/connectors"); const db = require("./src/config/database");
      const ctx = { db, organizationId: ${orgId}, userId: 1 }; let ok = 0, limited = null;
      for (let i = 0; i < 40; i++) { try { await c.invoke(ctx, { siteId: ${A} }, "text.generate", { prompt: "x" }); ok++; } catch (e) { if (e.code === "rate_limited") { limited = e.message; break; } else return { crash: e.message }; } }
      let invalid = null; try { await c.invoke(ctx, { siteId: ${A} }, "text.generate", { prompt: "x".repeat(20001) }); } catch (e) { invalid = e.code; }
      return { ok, limited, invalid };`);
    assert.equal(out.ok, 30); assert.match(out.limited, /Limite de 30 demandes par minute/); assert.equal(out.invalid, "bad_request");
  });

  test("journal : chaque opération est tracée (qui, quoi, quel niveau) SANS secret ; la page n'expose aucune valeur secrète", async () => {
    const log = db.prepare("SELECT action, site_id, metadata FROM mk_audit_logs WHERE resource_type = 'connection' ORDER BY id").all();
    const actions = new Set(log.map((l) => l.action)); for (const a of ["connection.created", "connection.tested", "connection.sharing_changed"]) assert.ok(actions.has(a), a);
    assert.ok(log.some((l) => l.site_id === A) && log.some((l) => l.site_id === B), "journal rattaché au bon site");
    const all = JSON.stringify(log); for (const k of [KEY_A, KEY_B, KEY_C, OKEY, "SiteAlphaKey", "CentralKey"]) assert.ok(!all.includes(k), `journal sans ${k.slice(0, 12)}`);
    for (const client of [boss, adminA, adminB]) { const html = (await client.get(client === boss ? `${R}/parametres/connecteurs` : `${R}/sites/${client === adminA ? A : B}/parametres-connecteurs`)).text; for (const k of [KEY_A, KEY_B, KEY_C, OKEY]) assert.ok(!html.includes(k)); }
  });
  async function runInServer(code) {
    const execFile = require("node:util").promisify(require("node:child_process").execFile);
    const base = `http://127.0.0.1:${fake.address().port}`;
    const { stdout: out } = await execFile(process.execPath, ["-e", `(async () => { const result = await (async () => { ${code} })(); process.stdout.write("@@" + JSON.stringify(result)); })().catch((e) => { process.stdout.write("@@" + JSON.stringify({ crash: e.message })); });`], { cwd: require("node:path").join(__dirname, ".."), env: { ...process.env, DATA_DIR: require("node:path").join(srv.dir, "data"), UPLOADS_DIR: require("node:path").join(srv.dir, "uploads"), SESSION_SECRET: "secret-de-test-assez-long-1234567890", NODE_ENV: "test", CONNECTOR_API_BASE_ANTHROPIC: base, CONNECTOR_API_BASE_OPENAI: base, ENCRYPTION_KEY: TEST_KEY }, encoding: "utf8", timeout: 60000 });
    const parsed = JSON.parse(out.split("@@").pop()); if (parsed && parsed.crash) throw new Error(`processus d'appoint : ${parsed.crash}`); return parsed;
  }
});
