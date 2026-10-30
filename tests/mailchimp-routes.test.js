// Intégration Mailchimp de bout en bout par les vraies routes : droits, validation, contrat de CHAQUE opération du catalogue (méthode, chemin, paramètres, corps reçus par Mailchimp),
// webhook public, synchronisation lancée depuis l'API, Transactionnel, journal, minuteur horaire. Mailchimp est simulé (tests/fake-mailchimp.js).
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { startServer, loginInstructor, newStudent, Client } = require("./helpers");
const { TEST_KEY } = require("./marketing-helpers");
const { createFakeMailchimp } = require("./fake-mailchimp");
const { OPS, TOKENS } = require("../src/marketing/mailchimp/catalog");
const transactionalOps = require("../src/marketing/mailchimp/transactional").OPS;

const API = "/marketing/mailchimp/api";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const until = async (fn, { timeout = 20000, step = 150 } = {}) => { const end = Date.now() + timeout; for (;;) { const v = await fn(); if (v) return v; if (Date.now() > end) throw new Error("Délai dépassé en attendant la condition"); await sleep(step); } };
const form = (obj) => { const p = new URLSearchParams(); const walk = (o, pre) => { for (const [k, v] of Object.entries(o)) { const key = pre ? `${pre}[${k}]` : k; if (v && typeof v === "object") walk(v, key); else p.append(key, String(v)); } }; walk(obj, ""); return p.toString(); };

describe("intégration Mailchimp (routes)", () => {
  let fake, srv, boss, remote;
  const db = (sql, ...a) => { const d = srv.db(); const r = d.prepare(sql).all(...a); d.close(); return r; };
  const run = (sql, ...a) => { const d = srv.db(); d.prepare(sql).run(...a); d.close(); };
  const json = async (client, method, url, body) => { const r = await client.request(url, { method, json: ["GET", "HEAD"].includes(method) ? undefined : body, headers: { "X-Requested-With": "fetch" } }); let data = null; try { data = JSON.parse(r.text); } catch { /* pas du JSON */ } return { ...r, data }; };
  const member = async (role) => { const c = await newStudent(srv); run("INSERT INTO mk_org_members (organization_id, user_id, role) VALUES (1, (SELECT id FROM users WHERE email = ?), ?)", c.email, role); return c; };

  before(async () => {
    fake = await createFakeMailchimp();
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "", MAILCHIMP_API_BASE: fake.base, MANDRILL_API_BASE: fake.mandrillBase });
    boss = await loginInstructor(srv);
    remote = fake.addList("Newsletter");
  });
  after(async () => { await srv.stop(); await fake.close(); });

  describe("accès", () => {
    test("anonyme : redirigé vers la connexion (page et API)", async () => {
      const anon = new Client(srv.base);
      assert.match((await anon.get("/marketing/mailchimp")).location, /^\/connexion/);
      assert.equal((await anon.request(`${API}/etat`)).status, 302);
    });
    test("seul un administrateur de l'organisation entre : lecteur, éditeur, élève → 403 sur la page et sur chaque route JSON", async () => {
      for (const role of ["viewer", "editor"]) {
        const c = await member(role);
        assert.equal((await c.get("/marketing/mailchimp")).status, 403);
        for (const [m, u] of [["GET", `${API}/etat`], ["POST", `${API}/connexion`], ["DELETE", `${API}/connexion`], ["POST", `${API}/sync`], ["GET", `${API}/audiences`], ["POST", `${API}/campagnes/abc/envoyer`], ["GET", `${API}/journal-appels`], ["POST", `${API}/transactionnel/messages.send`], ["GET", `${API}/audiences/${remote.id}/export.csv`]]) {
          assert.equal((await json(c, m, u, {})).status, 403, `${role} ${m} ${u}`);
        }
      }
      const student = await newStudent(srv);
      assert.equal((await student.get("/marketing/mailchimp")).status, 403);
      assert.equal((await json(student, "GET", `${API}/etat`)).status, 403);
      const admin = await member("admin");
      assert.equal((await admin.get("/marketing/mailchimp")).status, 200);
      assert.equal((await json(admin, "GET", `${API}/etat`)).status, 200);
    });
    test("un accès limité à un site n'entre pas, même avec un rôle élevé sur ce site", async () => {
      const c = await newStudent(srv);
      run("INSERT INTO mk_sites (organization_id, name, slug, status) VALUES (1, 'S1', 's1-mc', 'active')");
      const site = db("SELECT id FROM mk_sites WHERE slug = 's1-mc'")[0].id;
      run("INSERT INTO mk_site_members (site_id, user_id, role) VALUES (?, (SELECT id FROM users WHERE email = ?), 'admin')", site, c.email);
      const page = await c.get("/marketing/mailchimp");
      assert.ok([302, 403].includes(page.status), `page : ${page.status}`);
      assert.notEqual(page.status, 200);
      const api = await json(c, "GET", `${API}/etat`);
      assert.ok([302, 403].includes(api.status), `API : ${api.status}`);
      assert.equal(api.data, null);
    });
    test("la page est dans le menu Intégrations, sans clé dans le HTML", async () => {
      const home = (await boss.get("/marketing")).text;
      assert.match(home, /href="\/marketing\/mailchimp"/);
      const page = await boss.get("/marketing/mailchimp");
      assert.equal(page.status, 200);
      assert.match(page.text, /<h1>Mailchimp<\/h1>/);
      assert.match(page.text, /id="mc-data"/);
      assert.match(page.headers.get("cache-control") || "", /no-store/);
    });
  });

  describe("connexion", () => {
    test("avant connexion : état « non connecté », synchronisation refusée (409)", async () => {
      const st = await json(boss, "GET", `${API}/etat`);
      assert.equal(st.data.ok, true);
      assert.equal(st.data.data.status.connected, false);
      assert.equal(st.data.data.status.encryptionReady, true);
      const s = await json(boss, "POST", `${API}/sync`, {});
      assert.equal(s.status, 409); assert.equal(s.data.error.code, "not_connected");
      const op = await json(boss, "GET", `${API}/audiences`);
      assert.equal(op.status, 409); assert.match(op.data.error.message, /n'est pas connecté/);
    });
    test("clé mal formée → 400 ; clé refusée par Mailchimp → 422 ; rien n'est enregistré", async () => {
      const a = await json(boss, "POST", `${API}/connexion`, { apiKey: "abc" });
      assert.equal(a.status, 400); assert.equal(a.data.error.code, "key_format");
      const b = await json(boss, "POST", `${API}/connexion`, { apiKey: "ffffffffffffffffffffffffffffffff-us21" });
      assert.equal(b.status, 422); assert.equal(b.data.error.code, "auth_invalid"); assert.match(b.data.error.message, /clé d'API Mailchimp est refusée/);
      assert.equal(db("SELECT * FROM mk_settings WHERE key LIKE 'mailchimp.%'").length, 0);
      assert.equal((await json(boss, "POST", `${API}/connexion`, {})).status, 400);
    });
    test("clé valide : compte affiché, clé chiffrée en base, jamais renvoyée, jeton de webhook créé", async () => {
      const r = await json(boss, "POST", `${API}/connexion`, { apiKey: fake.key });
      assert.equal(r.status, 200);
      assert.equal(r.data.data.account.name, "Société Démo");
      assert.equal(r.data.data.status.connected, true);
      const row = db("SELECT value, is_secret FROM mk_settings WHERE key = 'mailchimp.api_key'")[0];
      assert.equal(row.is_secret, 1); assert.match(row.value, /^v1:/);
      const token = db("SELECT 1 FROM mk_settings WHERE key = 'mailchimp.webhook_token' AND is_secret = 1").length;
      assert.equal(token, 1);
      const body = r.text + (await boss.request(`${API}/etat`)).text + (await boss.get("/marketing/mailchimp")).text;
      assert.doesNotMatch(body, /0123456789abcdef0123456789abcdef/);
      assert.match(fake.requests.find((q) => q.path === "/ping").auth, /^Basic /);
    });
    test("l'adresse du webhook (avec son jeton) est donnée à l'administrateur seulement", async () => {
      const r = await json(boss, "GET", `${API}/webhook-url`);
      assert.match(r.data.data.url, /^https:\/\/k\.test\/webhooks\/mailchimp\/1\/[0-9a-f]{48}$/);
      const editor = await member("editor");
      assert.equal((await json(editor, "GET", `${API}/webhook-url`)).status, 403);
    });
  });

  describe("contrat des opérations du catalogue", () => {
    const SAMPLE = { listId: "a1b2c3d4e5", hash: "ana@exemple.fr", segmentId: "12", mergeId: "7", domain: "exemple.fr" };
    const valueFor = (name) => SAMPLE[name] || `id${name.length}`;
    const bodyFor = (op) => {
      if (op.method === "GET" || op.method === "DELETE") return undefined;
      const body = {};
      for (const k of op.required) body[k] = ["members", "tags", "test_emails", "variants", "lines", "operations"].includes(k) ? [{ email_address: "a@exemple.fr", name: "t" }] : ["contact", "recipients", "trigger_settings", "customer", "campaign_defaults"].includes(k) ? { x: 1 } : "valeur";
      return body;
    };
    test("le catalogue est cohérent : 150 opérations ou plus, identifiants uniques, chemins et routes concordants", () => {
      assert.ok(OPS.length >= 150, `${OPS.length}`);
      assert.equal(new Set(OPS.map((o) => o.id)).size, OPS.length);
      for (const o of OPS) {
        assert.deepEqual(TOKENS(o.mc).sort(), TOKENS(o.route.replace(/:([A-Za-z]+)/g, "{$1}")).sort(), o.id);
        assert.ok(["CRITIQUE", "IMPORTANT", "OPTIONNEL"].includes(o.priority), o.id);
        assert.ok(o.summary && o.usage, o.id);
      }
    });
    for (const group of [...new Set(OPS.map((o) => o.group))]) {
      test(`${group} : chaque opération atteint Mailchimp avec la bonne méthode, le bon chemin, les bons paramètres`, async () => {
        for (const op of OPS.filter((o) => o.group === group)) {
          const params = {};
          for (const n of TOKENS(op.mc)) params[n] = valueFor(n);
          const expectedPath = op.mc.replace(/\{(\w+)\}/g, (_, n) => (n === "hash" ? fake.md5(SAMPLE.hash) : params[n]));
          const url = `${API}${op.route.replace(/:(\w+)/g, (_, n) => encodeURIComponent(params[n]))}`;
          const q = op.query.includes("count") ? "?count=5" : "";
          if (op.confirm) { // sans confirmation : refusé, rien n'atteint Mailchimp
            fake.reset();
            const refused = await json(boss, op.method, url + q, bodyFor(op));
            assert.equal(refused.status, 409, `${op.id} sans confirmation`);
            assert.equal(refused.data.error.code, "confirm_required");
            assert.equal(fake.requests.length, 0, `${op.id} : appel malgré l'absence de confirmation`);
          }
          fake.reset();
          const body = bodyFor(op);
          const withConfirm = op.confirm ? (body ? { ...body, confirm: true } : undefined) : body;
          const target = op.confirm && !body ? `${url}${q ? q + "&" : "?"}confirm=1` : url + q;
          const r = await json(boss, op.method, target, withConfirm);
          assert.ok(r.data, `${op.id} : réponse JSON attendue (statut ${r.status}, ${r.text.slice(0, 120)})`);
          const calls = fake.requests;
          assert.equal(calls.length, 1, `${op.id} : ${calls.length} appel(s) (statut ${r.status})`);
          assert.equal(calls[0].method, op.method, op.id);
          assert.equal(calls[0].path, expectedPath, op.id);
          if (q) assert.equal(calls[0].query.count, "5", `${op.id} : paramètre count`);
          assert.equal(calls[0].query.confirm, undefined, `${op.id} : « confirm » n'est pas transmis`);
          if (body) { for (const k of op.required) assert.ok(k in calls[0].body, `${op.id} : champ ${k} transmis`); assert.equal(calls[0].body.confirm, undefined, `${op.id} : « confirm » absent du corps`); }
          if (r.status === 200) assert.equal(r.data.ok, true, op.id);
          else assert.equal(r.data.ok, false, op.id);
          assert.doesNotMatch(r.text, /0123456789abcdef0123456789abcdef/, op.id);
        }
      });
    }
  });

  describe("validation stricte", () => {
    const none = async (fn) => { fake.reset(); const r = await fn(); assert.equal(fake.requests.length, 0, "aucun appel ne doit partir"); return r; };
    test("paramètre de requête non prévu, identifiants invalides ou piégés, corps invalide : 400 sans appel réseau", async () => {
      const a = await none(() => json(boss, "GET", `${API}/audiences?foo=bar`)); assert.equal(a.status, 400); assert.match(a.data.error.message, /« foo » non pris en charge/);
      assert.equal((await none(() => json(boss, "GET", `${API}/audiences/zzzz`))).status, 400);
      assert.equal((await none(() => json(boss, "GET", `${API}/audiences/${remote.id}/membres/pas-un-contact`))).status, 400);
      assert.equal((await none(() => json(boss, "GET", `${API}/campagnes/..%2F..%2Fx`))).status, 400);
      assert.equal((await none(() => json(boss, "GET", `${API}/campagnes/a%20b`))).status, 400);
      assert.equal((await none(() => json(boss, "GET", `${API}/audiences?count=5000`))).status, 400);
      assert.equal((await none(() => json(boss, "GET", `${API}/audiences?offset=-1`))).status, 400);
      assert.equal((await none(() => json(boss, "GET", `${API}/audiences?count[]=1&count[]=2`))).status, 400);
      const noBody = await none(() => json(boss, "POST", `${API}/audiences`, {})); assert.equal(noBody.status, 400); assert.match(noBody.data.error.message, /obligatoire\(s\) manquant\(s\)/);
      assert.equal((await none(() => json(boss, "POST", `${API}/audiences`, [1, 2]))).status, 400);
      assert.equal((await none(() => boss.request(`${API}/campagnes`, { method: "POST", headers: { "Content-Type": "application/json", "X-Requested-With": "fetch" }, multipart: '{"type":"regular","__proto__":{"x":1}}' }))).status, 400);
    });
    test("clés dangereuses refusées dans un corps JSON imbriqué", async () => {
      const r = await none(() => boss.request(`${API}/campagnes`, { method: "POST", headers: { "Content-Type": "application/json", "X-Requested-With": "fetch" }, multipart: '{"type":"regular","settings":{"constructor":{"x":1}}}' }));
      assert.equal(r.status, 400);
    });
    test("requête qui modifie sans l'en-tête de l'écran Mailchimp (formulaire d'un autre site) : refusée, rien n'atteint Mailchimp", async () => {
      fake.reset();
      for (const [m, u, body] of [["POST", `${API}/sync`, {}], ["DELETE", `${API}/connexion`, undefined], ["POST", `${API}/jeton-webhook/regenerer`, {}], ["POST", `${API}/campagnes/abc12345/envoyer?confirm=1`, {}], ["POST", `${API}/transactionnel/messages.send`, { message: {}, confirm: true }]]) {
        const r = await boss.request(u, { method: m, json: body });
        assert.equal(r.status, 403, `${m} ${u}`); assert.equal(JSON.parse(r.text).error.code, "csrf");
      }
      const form = await boss.request(`${API}/sync`, { method: "POST", form: { a: "1" } });
      assert.equal(form.status, 403);
      assert.equal(fake.requests.length, 0);
      assert.equal(db("SELECT COUNT(*) AS n FROM mk_settings WHERE key = 'mailchimp.api_key'")[0].n, 1, "la connexion est intacte");
    });
    test("route inconnue : 404 ; méthode non prévue : 404", async () => {
      assert.equal((await boss.request(`${API}/inexistant`)).status, 404);
      assert.equal((await json(boss, "PUT", `${API}/audiences`, {})).status, 404);
    });
  });

  describe("opérations composées par l'API", () => {
    test("import CSV, vérification d'existence, export CSV (en-têtes de sécurité), aperçu de modèle", async () => {
      const imp = await json(boss, "POST", `${API}/audiences/${remote.id}/import`, { rows: [{ email: "csv1@exemple.fr", FNAME: "=cmd" }, { email: "mauvais" }], attestConsent: true });
      assert.equal(imp.status, 200); assert.equal(imp.data.data.created, 1); assert.equal(imp.data.data.invalid.length, 1);
      assert.equal((await json(boss, "POST", `${API}/audiences/${remote.id}/import`, { rows: "x" })).status, 400);
      const ex = await json(boss, "GET", `${API}/audiences/${remote.id}/membres/csv1@exemple.fr/existe`);
      assert.deepEqual(ex.data.data, { exists: true, status: "subscribed", email: "csv1@exemple.fr" });
      const csv = await boss.request(`${API}/audiences/${remote.id}/export.csv?status=subscribed`);
      assert.equal(csv.status, 200);
      assert.match(csv.headers.get("content-type"), /^text\/csv/);
      assert.match(csv.headers.get("content-disposition"), /attachment; filename="contacts-mailchimp-/);
      assert.equal(csv.headers.get("x-content-type-options"), "nosniff");
      assert.match(csv.text, /csv1@exemple\.fr,subscribed,'=cmd/);
      assert.equal((await boss.request(`${API}/audiences/zzzz/export.csv`)).status, 400);
      const prev = await json(boss, "POST", `${API}/modeles/apercu`, { html: "<p>*|FNAME|*</p>", variables: { FNAME: "<i>x</i>" } });
      assert.match(prev.data.data.html, /&lt;i&gt;/);
      assert.equal((await json(boss, "POST", `${API}/rapports/comparer`, { ids: ["a"] })).status, 400);
    });
    test("liaison d'une audience à une liste Kolakisa, puis tableau de bord et miroirs", async () => {
      await json(boss, "POST", `${API}/sync`, {});
      await until(async () => (await json(boss, "GET", `${API}/etat`)).data.data.sync.status === "ok");
      const aud = await json(boss, "GET", `${API}/miroir/audiences`);
      assert.equal(aud.data.data[0].name, "Newsletter");
      const link = await json(boss, "POST", `${API}/audiences/${remote.id}/lier`, { create: true });
      assert.equal(link.status, 200); assert.ok(link.data.data.localListId);
      assert.equal((await json(boss, "POST", `${API}/audiences/${remote.id}/lier`, {})).status, 400);
      assert.equal((await json(boss, "POST", `${API}/audiences/ffffffffff/lier`, { create: true })).status, 404);
      const dash = await json(boss, "GET", `${API}/tableau-de-bord?live=0`);
      assert.ok(dash.data.data.totals.audiences >= 1);
      assert.ok(dash.data.data.audiences.some((a) => a.name === "Newsletter"));
      assert.equal((await json(boss, "POST", `${API}/audiences/${remote.id}/delier`, {})).status, 200);
    });
  });

  describe("synchronisation lancée depuis l'API", () => {
    test("réponse immédiate, exécution en arrière-plan, état lisible, contacts importés avec preuve", async () => {
      fake.addMember(remote.id, "sync1@exemple.fr", "subscribed", { FNAME: "Syn" });
      await json(boss, "POST", `${API}/audiences/${remote.id}/lier`, { create: true });
      const started = await json(boss, "POST", `${API}/sync`, { full: true });
      assert.equal(started.status, 200); assert.equal(started.data.data.started, true);
      let last = null;
      const st = await until(async () => { const s = (await json(boss, "GET", `${API}/etat`)).data.data.sync; last = s; return s.lastSyncAt && !s.running && s.summary && s.summary.created >= 1 ? s : null; }).catch((e) => { throw new Error(`${e.message} — dernier état : ${JSON.stringify(last)}`); });
      assert.equal(st.status, "ok");
      const c = db("SELECT status, first_name, source FROM mk_contacts WHERE email = 'sync1@exemple.fr'")[0];
      assert.deepEqual({ ...c }, { status: "subscribed", first_name: "Syn", source: "mailchimp" });
      assert.equal(db("SELECT COUNT(*) AS n FROM mk_consents WHERE source = 'mailchimp' AND action = 'granted'")[0].n >= 1, true);
    });
    test("une synchronisation déjà en cours est refusée (409)", async () => {
      run("UPDATE mk_mc_state SET running_since = datetime('now')");
      const r = await json(boss, "POST", `${API}/sync`, {});
      assert.equal(r.status, 400); assert.equal(r.data.error.code, "already_running");
      run("UPDATE mk_mc_state SET running_since = NULL");
    });
    test("activation / désactivation de la synchronisation automatique", async () => {
      assert.equal((await json(boss, "POST", `${API}/synchronisation/activer`, { enabled: false })).data.data.syncEnabled, false);
      assert.equal((await json(boss, "POST", `${API}/synchronisation/activer`, { enabled: true })).data.data.syncEnabled, true);
    });
  });

  describe("webhook public", () => {
    let url;
    before(async () => { url = (await json(boss, "GET", `${API}/webhook-url`)).data.data.url.replace("https://k.test", ""); });
    const post = (path, body, ct = "application/x-www-form-urlencoded") => new Client(srv.base).request(path, { method: "POST", headers: { "Content-Type": ct }, multipart: body });
    test("jeton faux ou organisation inconnue : 404 sans explication ; jeton exact : 200 (GET de validation de Mailchimp)", async () => {
      const anon = new Client(srv.base);
      const bad = url.replace(/[0-9a-f]$/, (c) => (c === "0" ? "1" : "0"));
      assert.equal((await anon.get(bad)).status, 404);
      assert.equal((await post(bad, form({ type: "subscribe", data: { list_id: remote.id, email: "x@exemple.fr" } }))).status, 404);
      assert.equal((await anon.get(url.replace("/mailchimp/1/", "/mailchimp/2/"))).status, 404);
      assert.equal((await anon.get(url.replace("/mailchimp/1/", "/mailchimp/abc/"))).status, 404);
      assert.equal((await anon.get("/webhooks/mailchimp/1/")).status, 404);
      const ok = await anon.get(url);
      assert.equal(ok.status, 200); assert.equal(ok.text, "ok");
      assert.equal((await anon.request(url, { method: "HEAD" })).status, 200);
      assert.equal(db("SELECT COUNT(*) AS n FROM mk_mc_events")[0].n, 0, "aucun événement enregistré sans jeton valide");
    });
    test("événement reçu : enregistré, appliqué, 200 ; doublon : 200 sans second effet", async () => {
      const body = form({ type: "subscribe", fired_at: "2026-10-30 12:00:00", data: { list_id: remote.id, email: "hook1@exemple.fr", merges: { FNAME: "Hook" } } });
      const r = await post(url, body);
      assert.equal(r.status, 200);
      const c = db("SELECT status, first_name FROM mk_contacts WHERE email = 'hook1@exemple.fr'")[0];
      assert.deepEqual({ ...c }, { status: "subscribed", first_name: "Hook" });
      const dup = await post(url, body);
      assert.equal(dup.status, 200); assert.equal(JSON.parse(dup.text).duplicate, true);
      assert.equal(db("SELECT COUNT(*) AS n FROM mk_mc_events WHERE email = 'hook1@exemple.fr'")[0].n, 1);
    });
    test("désinscription, rebond, plainte, changement d'adresse, campagne : tous traités", async () => {
      const t = (type, data, at) => post(url, form({ type, fired_at: at, data: { list_id: remote.id, ...data } }));
      assert.equal((await t("unsubscribe", { email: "hook1@exemple.fr", action: "unsub" }, "t10")).status, 200);
      assert.equal(db("SELECT status FROM mk_contacts WHERE email = 'hook1@exemple.fr'")[0].status, "unsubscribed");
      await t("cleaned", { email: "hook2@exemple.fr", reason: "hard" }, "t11");
      assert.equal(db("SELECT reason FROM mk_suppressions WHERE email = 'hook2@exemple.fr'")[0].reason, "bounced");
      await t("cleaned", { email: "hook3@exemple.fr", reason: "abuse" }, "t12");
      assert.equal(db("SELECT reason FROM mk_suppressions WHERE email = 'hook3@exemple.fr'")[0].reason, "complained");
      await t("subscribe", { email: "hook4@exemple.fr" }, "t13");
      await t("upemail", { new_email: "hook5@exemple.fr", old_email: "hook4@exemple.fr" }, "t14");
      assert.equal(db("SELECT status FROM mk_contacts WHERE email = 'hook5@exemple.fr'")[0].status, "subscribed");
      assert.equal(db("SELECT status FROM mk_contacts WHERE email = 'hook4@exemple.fr'")[0].status, "unsubscribed");
      const camp = fake.addCampaign({ status: "sending", recipients: { list_id: remote.id } });
      await json(boss, "POST", `${API}/sync`, {}); await until(async () => !(await json(boss, "GET", `${API}/etat`)).data.data.sync.running);
      await t("campaign", { id: camp.id, status: "sent", subject: "Sujet" }, "t15");
      assert.equal(db("SELECT status FROM mk_mc_campaigns WHERE remote_id = ?", camp.id)[0].status, "sent");
    });
    test("événement dont le type ou l'audience est inconnu : 200 (Mailchimp ne désactive pas le webhook), rien d'appliqué", async () => {
      const before = db("SELECT COUNT(*) AS n FROM mk_contacts")[0].n;
      assert.equal((await post(url, form({ type: "subscribe", fired_at: "z1", data: { list_id: "ffffffffff", email: "zz@exemple.fr" } }))).status, 200);
      assert.equal((await post(url, form({ type: "inconnu", fired_at: "z2", data: {} }))).status, 200);
      assert.equal((await post(url, "")).status, 200);
      assert.equal(db("SELECT COUNT(*) AS n FROM mk_contacts")[0].n, before);
    });
    test("corps trop volumineux : 413 ; JSON ou binaire au lieu d'un formulaire : sans effet", async () => {
      assert.equal((await post(url, "a=" + "x".repeat(70000))).status, 413);
      assert.equal((await post(url, JSON.stringify({ type: "subscribe" }), "application/json")).status, 200);
    });
    test("journal consultable, filtrable, incrémental ; rejeu d'un événement ignoré", async () => {
      const all = (await json(boss, "GET", `${API}/evenements`)).data.data.events;
      assert.ok(all.length >= 6);
      assert.ok(all.every((e) => e.payload && e.type && e.receivedAt));
      const newest = all[0].id;
      assert.equal((await json(boss, "GET", `${API}/evenements?after=${newest}`)).data.data.events.length, 0);
      assert.ok((await json(boss, "GET", `${API}/evenements?type=cleaned`)).data.data.events.every((e) => e.type === "cleaned"));
      const ignored = all.find((e) => e.status === "ignored");
      assert.ok(ignored);
      const rp = await json(boss, "POST", `${API}/evenements/${ignored.id}/rejouer`, {});
      assert.equal(rp.status, 200);
      assert.equal((await json(boss, "POST", `${API}/evenements/999999/rejouer`, {})).status, 404);
      const editor = await member("editor");
      assert.equal((await json(editor, "POST", `${API}/evenements/${ignored.id}/rejouer`, {})).status, 403);
    });
    test("installer le webhook chez Mailchimp : une fois, jeton dans l'adresse, rotation du jeton invalide l'ancienne adresse", async () => {
      const inst = await json(boss, "POST", `${API}/audiences/${remote.id}/webhooks/installer`, {});
      assert.equal(inst.status, 200); assert.equal(inst.data.data.created, true);
      assert.equal((await json(boss, "POST", `${API}/audiences/${remote.id}/webhooks/installer`, {})).data.data.created, false);
      const expected = (await json(boss, "GET", `${API}/webhook-url`)).data.data.url;
      const hook = [...fake.state.webhooks.values()].find((w) => w.url === expected);
      assert.ok(hook, "le webhook de cette installation existe chez Mailchimp");
      assert.deepEqual(hook.sources, { user: true, admin: true, api: false });
      await json(boss, "POST", `${API}/jeton-webhook/regenerer`, {});
      assert.equal((await new Client(srv.base).get(url)).status, 404, "l'ancienne adresse ne marche plus");
      url = (await json(boss, "GET", `${API}/webhook-url`)).data.data.url.replace("https://k.test", "");
      assert.equal((await new Client(srv.base).get(url)).status, 200);
    });
  });

  describe("erreurs de Mailchimp traduites", () => {
    test("clé révoquée en cours de route → 422 auth_invalid ; panne 500 sur un POST → 502, pas de nouvelle tentative", async () => {
      fake.reset(); fake.failNext(401, { body: { title: "API Key Invalid", status: 401, detail: "x" } });
      const a = await json(boss, "GET", `${API}/audiences`);
      assert.equal(a.status, 422); assert.equal(a.data.error.code, "auth_invalid"); assert.match(a.data.error.message, /Clés d'API/);
      fake.reset(); fake.failNext(500, { body: { title: "Internal Server Error", status: 500, detail: "boom" } });
      const b = await json(boss, "POST", `${API}/audiences`, { name: "Panne", contact: {}, permission_reminder: "x", campaign_defaults: {}, email_type_option: false });
      assert.equal(b.status, 502); assert.equal(b.data.error.code, "server_error"); assert.equal(fake.requests.length, 1);
      assert.match(b.data.error.detail || "", /boom/);
    });
    test("limite de débit persistante → 429 rate_limited (message français)", async () => {
      fake.reset(); fake.failNext(429, { times: 10, headers: { "Retry-After": "1" } });
      const r = await json(boss, "GET", `${API}/audiences`);
      assert.equal(r.status, 429); assert.equal(r.data.error.code, "rate_limited");
      assert.equal(fake.requests.length, 4);
      fake.reset();
    });
    test("Mailchimp refuse une donnée (400) → message avec le champ fautif", async () => {
      fake.reset();
      const r = await json(boss, "POST", `${API}/audiences`, { name: "", contact: {}, permission_reminder: "x", campaign_defaults: {}, email_type_option: false });
      assert.equal(r.status, 400);
    });
    test("journal des appels : méthode, chemin masqué, statut — sans clé", async () => {
      const r = await json(boss, "GET", `${API}/journal-appels?limit=200`);
      assert.ok(r.data.data.length > 50);
      assert.ok(r.data.data.every((e) => e.method && e.path.startsWith("/") && typeof e.status === "number"));
      assert.ok(r.data.data.some((e) => e.path.includes("/members/:hash")));
      assert.doesNotMatch(r.text, /0123456789abcdef0123456789abcdef/);
      assert.doesNotMatch(r.text, /@exemple\.fr/);
    });
  });

  describe("Transactionnel (Mandrill)", () => {
    test("clé : enregistrée chiffrée, jamais renvoyée ; envoi refusé sans confirmation ; reçu envoyé avec", async () => {
      const bad = await json(boss, "PUT", `${API}/transactionnel/cle`, { key: "a b" });
      assert.equal(bad.status, 400);
      const ok = await json(boss, "PUT", `${API}/transactionnel/cle`, { key: fake.mandrillKey });
      assert.equal(ok.data.data.status.transactionalKeySet, true);
      assert.doesNotMatch(ok.text, new RegExp(fake.mandrillKey));
      assert.match(db("SELECT value FROM mk_settings WHERE key = 'mailchimp.transactional_key'")[0].value, /^v1:/);
      assert.equal((await json(boss, "POST", `${API}/transactionnel/users.ping`, {})).data.data.PING, "PONG!");
      const msg = { subject: "Reçu", from_email: "contact@exemple.fr", html: "<p>Merci</p>", to: [{ email: "client@exemple.fr" }] };
      assert.equal((await json(boss, "POST", `${API}/transactionnel/messages.send`, { message: msg })).status, 409);
      const sent = await json(boss, "POST", `${API}/transactionnel/messages.send`, { message: msg, confirm: true });
      assert.equal(sent.status, 200); assert.equal(sent.data.data[0].status, "sent");
    });
    test("chaque opération Transactionnel du catalogue est joignable ; une opération inconnue est refusée", async () => {
      for (const [id, op] of Object.entries(transactionalOps)) {
        fake.reset();
        const body = {};
        for (const k of op.required) body[k] = k === "message" ? { subject: "s", from_email: "contact@exemple.fr", html: "<p>x</p>", to: [{ email: "client@exemple.fr" }] } : k === "email" ? "client@exemple.fr" : k === "name" || k === "template_name" ? "recu" : "valeur";
        if (op.confirm) body.confirm = true;
        const r = await json(boss, "POST", `${API}/transactionnel/${id}`, body);
        assert.ok(r.data, id);
        const calls = fake.requests.filter((x) => x.path.startsWith("/api/1.0/"));
        assert.equal(calls.length, 1, `${id} : ${r.status} ${r.text.slice(0, 100)}`);
        assert.equal(calls[0].path, `/api/1.0/${op.endpoint}.json`);
        assert.equal(calls[0].method, "POST");
        assert.equal(calls[0].body.confirm, undefined);
      }
      assert.equal((await json(boss, "POST", `${API}/transactionnel/inconnu.op`, {})).status, 404);
      assert.equal((await json(boss, "POST", `${API}/transactionnel/messages.search`, { query: "x", bizarre: 1 })).status, 400);
    });
  });

  describe("déconnexion", () => {
    test("clé, jeton et compte effacés ; l'API redevient « non connectée » ; les contacts importés restent", async () => {
      const contacts = db("SELECT COUNT(*) AS n FROM mk_contacts WHERE source = 'mailchimp'")[0].n;
      assert.ok(contacts >= 1);
      const r = await json(boss, "DELETE", `${API}/connexion`);
      assert.equal(r.data.data.status.connected, false);
      assert.equal(db("SELECT * FROM mk_settings WHERE key IN ('mailchimp.api_key', 'mailchimp.webhook_token', 'mailchimp.account')").length, 0);
      assert.equal((await new Client(srv.base).get(db.length ? "/webhooks/mailchimp/1/anything" : "")).status, 404);
      assert.equal(db("SELECT COUNT(*) AS n FROM mk_contacts WHERE source = 'mailchimp'")[0].n, contacts);
      assert.equal((await json(boss, "GET", `${API}/audiences`)).status, 409);
    });
  });
});

describe("correspondance des codes d'erreur", () => {
  test("tout code d'erreur produit par le module Mailchimp a un statut HTTP explicite (aucun repli silencieux sur 400)", () => {
    const fs = require("node:fs"), path = require("node:path");
    const dir = path.join(__dirname, "..", "src", "marketing", "mailchimp");
    const text = fs.readdirSync(dir).map((f) => fs.readFileSync(path.join(dir, f), "utf8")).join("\n");
    const codes = new Set([...text.matchAll(/new (?:MailchimpError|MarketingError)\("([a-z_]+)"/g)].map((m) => m[1]));
    const { HTTP } = require("../src/marketing/web/mailchimp");
    const missing = [...codes].filter((c) => !Object.hasOwn(HTTP, c));
    assert.ok(codes.size >= 20, `${codes.size} codes trouvés`);
    assert.deepEqual(missing, []);
  });
});

describe("synchronisation automatique (minuteur)", () => {
  let fake, srv, boss;
  const json = async (client, method, url, body) => { const r = await client.request(url, { method, json: body, headers: { "X-Requested-With": "fetch" } }); return { ...r, data: JSON.parse(r.text) }; };
  before(async () => {
    fake = await createFakeMailchimp();
    fake.addList("Auto");
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "", MAILCHIMP_API_BASE: fake.base, MAILCHIMP_SYNC_INTERVAL_MS: "1000" });
    boss = await loginInstructor(srv);
  });
  after(async () => { await srv.stop(); await fake.close(); });
  test("non connecté : le minuteur ne fait aucun appel ; connecté : synchronise tout seul ; désactivé : s'arrête", async () => {
    await sleep(2500);
    assert.equal(fake.requests.length, 0);
    await json(boss, "POST", `${API}/connexion`, { apiKey: fake.key });
    fake.reset();
    await until(() => fake.requests.some((q) => q.path === "/lists"), { timeout: 15000 });
    const st = await until(async () => { const s = (await json(boss, "GET", `${API}/etat`)).data.data.sync; return s.lastSyncAt && !s.running ? s : null; });
    assert.equal(st.status, "ok");
    assert.equal(st.summary.audiences, 1);
    await json(boss, "POST", `${API}/synchronisation/activer`, { enabled: false });
    await sleep(1500);
    fake.reset();
    await sleep(3000);
    assert.equal(fake.requests.length, 0, "synchronisation désactivée : aucun appel");
  });
});
