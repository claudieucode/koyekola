// R2 — portée de site de l'API publique /api/v1 (A-01), bout en bout : vrai serveur, vraie base d'essai, vraies routes.
// Clés d'organisation inchangées ; clés limitées à un site : lectures et écritures filtrées, accès croisé refusé, usurpation de portée impossible,
// refus journalisés ; création par l'interface (portée choisie par le serveur) ; webhooks d'un site visibles dans l'écran.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { startServer, loginInstructor, Client } = require("./helpers");
const { TEST_KEY } = require("./marketing-helpers");

describe("API /api/v1 : portée de site des clés", () => {
  let srv, boss, db, orgId;
  let A, B, D;
  let listA, listB, listMain, campA, campB, campMain;
  let cA, cB, cMain, cEvtA;
  const key = {};
  const one = (sql, ...a) => db.prepare(sql).get(...a);
  const run = (sql, ...a) => Number(db.prepare(sql).run(...a).lastInsertRowid);
  const mkSite = (name, status = "active") => run("INSERT INTO mk_sites (organization_id, name, slug, tokens, status) VALUES (?, ?, ?, '{}', ?)", orgId, name, name.toLowerCase(), status);
  const rawKeyFrom = (html) => html.match(/<code>(mk_live_[0-9a-f]{48})<\/code>/)[1];
  const call = (k, path, opts = {}) => new Client(srv.base).request(`/api/v1${path}`, { ...opts, headers: { ...opts.headers, authorization: `Bearer ${k}` } });
  const json = (res) => JSON.parse(res.text);
  const ids = (res) => json(res).data.map((r) => r.id).sort((x, y) => x - y);
  async function newKey(name, scope, site) {
    await boss.post("/marketing/api", { name, scope, ...(site ? { site_id: String(site) } : {}) });
    return rawKeyFrom((await boss.get("/marketing/api")).text);
  }

  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv);
    db = srv.db();
    orgId = one("SELECT id FROM mk_organizations").id;
    A = mkSite("Alpha"); B = mkSite("Beta"); D = mkSite("Delta");
    listA = run("INSERT INTO mk_lists (organization_id, name, site_id) VALUES (?, 'Liste A', ?)", orgId, A);
    listB = run("INSERT INTO mk_lists (organization_id, name, site_id) VALUES (?, 'Liste B', ?)", orgId, B);
    listMain = run("INSERT INTO mk_lists (organization_id, name, site_id) VALUES (?, 'Liste principale', NULL)", orgId);
    const camp = (name, list, site) => run("INSERT INTO mk_campaigns (organization_id, name, target_type, target_id, site_id) VALUES (?, ?, 'list', ?, ?)", orgId, name, list, site);
    campA = camp("Campagne A", listA, A); campB = camp("Campagne B", listB, B); campMain = camp("Campagne principale", listMain, null);
    cA = run("INSERT INTO mk_contacts (organization_id, email, first_name, origin_site_id) VALUES (?, 'a@ex.fr', '', ?)", orgId, A);
    cB = run("INSERT INTO mk_contacts (organization_id, email, first_name, origin_site_id) VALUES (?, 'b@ex.fr', '', ?)", orgId, B);
    cMain = run("INSERT INTO mk_contacts (organization_id, email, first_name) VALUES (?, 'main@ex.fr', '')", orgId);
    key.orgW = await newKey("Org écriture", "write");
    key.orgR = await newKey("Org lecture", "read");
    key.aW = await newKey("Alpha écriture", "write", A);
    key.aR = await newKey("Alpha lecture", "read", A);
    key.bR = await newKey("Beta lecture", "read", B);
    // un contact « de A » seulement par un événement de A (origine inconnue)
    cEvtA = run("INSERT INTO mk_contacts (organization_id, email, first_name) VALUES (?, 'evt-a@ex.fr', '')", orgId);
    assert.equal((await call(key.orgW, "/events", { method: "POST", json: { name: "page.viewed", contact_id: cEvtA, site_id: A } })).status, 201); // clé d'organisation : peut nommer le site (comportement historique)
  });
  after(() => srv.stop());

  describe("création : la portée est décidée côté serveur", () => {
    test("clés d'organisation : portée « organization » explicite ; clés de site : le site choisi", () => {
      const rows = db.prepare("SELECT name, reach, site_id FROM mk_api_keys ORDER BY id").all().map((r) => [r.name, r.reach, r.site_id]);
      assert.deepEqual(rows.slice(0, 5), [["Org écriture", "organization", null], ["Org lecture", "organization", null], ["Alpha écriture", "site", A], ["Alpha lecture", "site", A], ["Beta lecture", "site", B]]);
    });
    test("site inexistant : aucune clé créée", async () => {
      const n = () => one("SELECT COUNT(*) n FROM mk_api_keys").n;
      const before = n();
      await boss.post("/marketing/api", { name: "Fantôme", scope: "read", site_id: "99999" });
      assert.equal(n(), before);
    });
    test("l'écran des clés affiche le périmètre de chaque clé", async () => {
      const html = (await boss.get("/marketing/api")).text;
      assert.match(html, /Toute l'organisation|Toute l&#39;organisation/);
      assert.match(html, /Site : Alpha/);
    });
  });

  describe("clés d'organisation : accès historique inchangé", () => {
    test("elles voient les contacts, listes et campagnes de tous les sites et du principal", async () => {
      assert.deepEqual(ids(await call(key.orgR, "/lists")), [listA, listB, listMain]);
      assert.deepEqual(ids(await call(key.orgR, "/campaigns")), [campA, campB, campMain]);
      const contacts = json(await call(key.orgR, "/contacts")).data.map((c) => c.email);
      for (const e of ["a@ex.fr", "b@ex.fr", "main@ex.fr", "evt-a@ex.fr"]) assert.ok(contacts.includes(e), e);
    });
    test("vue d'ensemble, fiche d'un contact de n'importe quel site : accessibles", async () => {
      assert.equal((await call(key.orgR, "/overview")).status, 200);
      for (const id of [cA, cB, cMain]) assert.equal((await call(key.orgR, `/contacts/${id}`)).status, 200);
    });
    test("une clé d'organisation en écriture crée un contact sans site, comme avant", async () => {
      const res = await call(key.orgW, "/contacts", { method: "POST", json: { email: "org-new@ex.fr" } });
      assert.equal(res.status, 201);
      assert.equal(one("SELECT origin_site_id o FROM mk_contacts WHERE email = 'org-new@ex.fr'").o, null);
    });
  });

  describe("clé limitée au site A : lectures", () => {
    test("listes : seulement celles de A (ni B, ni le principal)", async () => assert.deepEqual(ids(await call(key.aR, "/lists")), [listA]));
    test("campagnes : seulement celles de A ; la fiche d'une campagne de B ou du principal est introuvable", async () => {
      assert.deepEqual(ids(await call(key.aR, "/campaigns")), [campA]);
      assert.equal((await call(key.aR, `/campaigns/${campA}`)).status, 200);
      for (const c of [campB, campMain]) assert.equal((await call(key.aR, `/campaigns/${c}`)).status, 404);
    });
    test("contacts : ceux dont l'origine OU un événement est le site A, aucun autre", async () => {
      const emails = json(await call(key.aR, "/contacts")).data.map((c) => c.email).sort();
      assert.deepEqual(emails, ["a@ex.fr", "evt-a@ex.fr"]);
    });
    test("fiche d'un contact : ceux de A répondent ; ceux de B, du principal ou inexistants répondent pareil (404)", async () => {
      for (const id of [cA, cEvtA]) assert.equal((await call(key.aR, `/contacts/${id}`)).status, 200);
      const refused = await Promise.all([cB, cMain, 987654].map((id) => call(key.aR, `/contacts/${id}`)));
      assert.deepEqual(refused.map((r) => r.status), [404, 404, 404]);
      assert.equal(new Set(refused.map((r) => r.text)).size, 1, "même réponse : aucune indication sur l'existence");
    });
    test("la vue d'ensemble (agrégat de l'organisation) est refusée", async () => {
      const res = await call(key.aR, "/overview");
      assert.equal(res.status, 403);
      assert.match(res.text, /"code":"out_of_scope"/);
    });
    test("la clé de B ne voit rien de A, et inversement", async () => {
      assert.deepEqual(ids(await call(key.bR, "/lists")), [listB]);
      assert.deepEqual(json(await call(key.bR, "/contacts")).data.map((c) => c.email), ["b@ex.fr"]);
      assert.equal((await call(key.bR, `/contacts/${cA}`)).status, 404);
    });
  });

  describe("usurpation ou élargissement de la portée : impossibles", () => {
    test("site demandé par l'adresse, un en-tête ou le corps : ignoré, la portée vient de la clé", async () => {
      for (const suffix of [`?site=${B}`, `?site_id=${B}`, "?site=principal", "?organization_id=1"]) {
        assert.deepEqual(ids(await call(key.aR, `/lists${suffix}`)), [listA], suffix);
        assert.deepEqual(ids(await call(key.aR, `/campaigns${suffix}`)), [campA], suffix);
      }
      const res = await call(key.aR, "/lists", { headers: { "x-site-id": String(B), "x-site": String(B) } });
      assert.deepEqual(ids(res), [listA]);
    });
    test("la portée d'une clé ne se modifie ni par l'API ni par la base", () => {
      const id = one("SELECT id FROM mk_api_keys WHERE name = 'Alpha lecture'").id;
      assert.throws(() => db.prepare("UPDATE mk_api_keys SET reach = 'organization', site_id = NULL WHERE id = ?").run(id), /portée figée/);
      assert.throws(() => db.prepare("UPDATE mk_api_keys SET site_id = ? WHERE id = ?").run(B, id), /portée figée/);
    });
  });

  describe("clé limitée au site A : écritures", () => {
    test("une clé en lecture seule ne peut toujours pas écrire", async () => {
      const res = await call(key.aR, "/contacts", { method: "POST", json: { email: "refuse@ex.fr" } });
      assert.equal(res.status, 403);
      assert.match(res.text, /"code":"read_only"/);
    });
    test("un contact créé est rattaché au site de la clé (origine), visible de A, invisible de B", async () => {
      // R7 lot 2 : la création par une clé de site répond 202 SANS donnée (identique au cas d'une adresse déjà connue ailleurs : aucune confirmation d'existence) ; la fiche se retrouve par la liste
      const res = await call(key.aW, "/contacts", { method: "POST", json: { email: "nouveau-a@ex.fr", first_name: "Ada" } });
      assert.equal(res.status, 202);
      assert.deepEqual(json(res), { data: null, accepted: true });
      const id = one("SELECT id FROM mk_contacts WHERE email = 'nouveau-a@ex.fr'").id;
      assert.equal(one("SELECT origin_site_id o FROM mk_contacts WHERE id = ?", id).o, A);
      assert.equal((await call(key.aR, `/contacts/${id}`)).status, 200);
      assert.equal((await call(key.bR, `/contacts/${id}`)).status, 404);
    });
    test("un contact de A existant : renvoyé (created: false) et complété comme avant", async () => {
      const res = await call(key.aW, "/contacts", { method: "POST", json: { email: "a@ex.fr", first_name: "Alice" } });
      assert.equal(res.status, 200);
      assert.equal(json(res).created, false);
      assert.equal(one("SELECT first_name f FROM mk_contacts WHERE id = ?", cA).f, "Alice");
    });
    test("une adresse déjà connue hors du site : MÊME réponse qu'une création (202, aucune donnée), la fiche n'est ni lue ni modifiée, la tentative est journalisée (R7 lot 2 : plus de 403, qui confirmait l'existence)", async () => {
      const before = one("SELECT first_name f, updated_at u FROM mk_contacts WHERE id = ?", cB);
      const res = await call(key.aW, "/contacts", { method: "POST", json: { email: "b@ex.fr", first_name: "Pirate" } });
      assert.equal(res.status, 202);
      const fresh = await call(key.aW, "/contacts", { method: "POST", json: { email: "jamais-vu@ex.fr", first_name: "Neuf" } });
      assert.equal(fresh.status, 202);
      assert.equal(res.text, fresh.text, "réponses strictement identiques");
      assert.ok(!/b@ex\.fr|Pirate/.test(res.text));
      assert.deepEqual({ ...one("SELECT first_name f, updated_at u FROM mk_contacts WHERE id = ?", cB) }, { ...before });
      const logged = one("SELECT COUNT(*) n FROM mk_audit_logs WHERE action = 'api_key.out_of_scope'").n;
      assert.ok(logged >= 1);
    });
    test("champs réservés du Contact Core (compte lié, étape, site) : ignorés pour une clé de site", async () => {
      const res = await call(key.aW, "/contacts", { method: "POST", json: { email: "champs@ex.fr", siteId: B, site_id: B, userId: 1, lifecycleStage: "customer", origin_site_id: B } });
      assert.equal(res.status, 202);
      const row = one("SELECT origin_site_id o, lms_user_id u, lifecycle_stage s FROM mk_contacts WHERE email = 'champs@ex.fr'");
      assert.deepEqual({ ...row }, { o: A, u: null, s: row.s });
      assert.notEqual(row.s, "customer");
    });
    test("événements : rattachés au site de la clé ; un autre site, un contact d'un autre site : refusés, jamais rattachés", async () => {
      const ok = await call(key.aW, "/events", { method: "POST", json: { name: "page.viewed", contact_id: cA } });
      assert.equal(ok.status, 201);
      assert.equal(one("SELECT site_id s FROM mk_events WHERE id = ?", json(ok).data.id).s, A);
      const explicit = await call(key.aW, "/events", { method: "POST", json: { name: "page.viewed", contact_id: cA, site_id: A } });
      assert.equal(explicit.status, 201);
      const otherSite = await call(key.aW, "/events", { method: "POST", json: { name: "page.viewed", contact_id: cA, site_id: B } });
      assert.equal(otherSite.status, 403);
      assert.equal((await call(key.aW, "/events", { method: "POST", json: { name: "page.viewed", contact_id: cB } })).status, 404);
      // R7 lot 2 : un événement par adresse d'un contact d'un autre site est enregistré SANS identité (même réponse qu'une adresse inconnue) ; jamais rattaché au contact
      const byEmail = await call(key.aW, "/events", { method: "POST", json: { name: "page.viewed", email: "b@ex.fr" } });
      assert.equal(byEmail.status, 201);
      const ev = one("SELECT contact_id c, email e, site_id s FROM mk_events WHERE id = ?", json(byEmail).data.id);
      assert.deepEqual({ ...ev }, { c: null, e: null, s: A });
      assert.equal(one("SELECT COUNT(*) n FROM mk_events WHERE contact_id = ? AND site_id = ?", cB, A).n, 0, "le contact de B n'a pas été rattaché à A");
      assert.equal((await call(key.aR, `/contacts/${cB}`)).status, 404);
    });
    test("actions de pilotage : une campagne d'un autre site est introuvable et reste inchangée", async () => {
      const status = () => one("SELECT status s FROM mk_campaigns WHERE id = ?", campB).s;
      const before = status();
      for (const action of ["pause", "resume", "cancel"]) assert.equal((await call(key.aW, `/campaigns/${campB}/${action}`, { method: "POST" })).status, 404, action);
      assert.equal(status(), before);
    });
  });

  describe("cycle de vie du site et de la clé", () => {
    test("site archivé ou supprimé : sa clé est refusée (401) ; réactivé : acceptée ; clé révoquée : refusée", async () => {
      const k = await newKey("Delta lecture", "read", D);
      assert.equal((await call(k, "/lists")).status, 200);
      db.prepare("UPDATE mk_sites SET status = 'archived' WHERE id = ?").run(D);
      assert.equal((await call(k, "/lists")).status, 401);
      db.prepare("UPDATE mk_sites SET status = 'active' WHERE id = ?").run(D);
      assert.equal((await call(k, "/lists")).status, 200);
      db.prepare("UPDATE mk_sites SET deleted_at = datetime('now') WHERE id = ?").run(D);
      assert.equal((await call(k, "/lists")).status, 401);
      db.prepare("UPDATE mk_sites SET deleted_at = NULL WHERE id = ?").run(D);
      const id = one("SELECT id FROM mk_api_keys WHERE name = 'Delta lecture'").id;
      await boss.post(`/marketing/api/${id}/revoquer`, {});
      assert.equal((await call(k, "/lists")).status, 401);
    });
    test("sans clé ou clé inconnue : toujours 401", async () => {
      assert.equal((await new Client(srv.base).request("/api/v1/lists")).status, 401);
      assert.equal((await call("mk_live_" + "0".repeat(48), "/lists")).status, 401);
    });
  });

  describe("webhooks : création par l'interface", () => {
    test("un point d'arrivée de site est enregistré avec sa portée ; l'écran l'indique", async () => {
      await boss.post("/marketing/webhooks", { name: "Hook Alpha", url: "https://exemple.fr/alpha", events: "*", site_id: String(A) });
      await boss.post("/marketing/webhooks", { name: "Hook Org", url: "https://exemple.fr/org", events: "*" });
      const rows = db.prepare("SELECT name, reach, site_id FROM mk_webhook_endpoints ORDER BY id").all().map((r) => [r.name, r.reach, r.site_id]);
      assert.deepEqual(rows, [["Hook Alpha", "site", A], ["Hook Org", "organization", null]]);
      const html = (await boss.get("/marketing/webhooks")).text;
      assert.match(html, /Site : Alpha/);
    });
  });
});
