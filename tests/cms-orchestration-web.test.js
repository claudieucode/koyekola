// KOLAKISA CMS — palier 19 par les vraies routes : objectif d'un scénario, diagnostic d'un événement (site, permissions, masquage, XSS), détection des abandons, réglages.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, loginInstructor, newStudent } = require("./helpers");

let srv, boss, db, orgId, siteA, siteB, editorA, viewer, autoA, evA, evB, evXss;
const one = (sql, ...a) => db.prepare(sql).get(...a);
const M = "/marketing";
const idOf = (c) => one("SELECT id FROM users WHERE email = ?", c.email).id;
const lastId = (loc, re) => Number(String(loc).match(re)[1]);
const addEvent = (contact, site, name, md) => Number(db.prepare("INSERT INTO mk_events (organization_id, name, email, contact_id, source, site_id, metadata, occurred_at, created_at) VALUES (?, ?, ?, ?, 'site', ?, ?, ?, ?)").run(orgId, name, "orch@exemple.fr", contact, site, JSON.stringify(md), Date.now(), Date.now()).lastInsertRowid);

before(async () => {
  srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
  boss = await loginInstructor(srv); db = srv.db();
  orgId = one("SELECT id FROM mk_organizations").id;
  siteA = lastId((await boss.post(`${M}/site-web/sites`, { name: "Site Alpha" })).location, /sites\/(\d+)/);
  siteB = lastId((await boss.post(`${M}/site-web/sites`, { name: "Site Bravo" })).location, /sites\/(\d+)/);
  assert.equal((await boss.post(`${M}/automatisations`, { name: "Scénario Orch", kind: "marketing", trigger_event: "funnel.entered", site_id: siteA })).status, 302);
  autoA = one("SELECT id FROM mk_automations WHERE name = 'Scénario Orch'").id;
  editorA = await newStudent(srv); viewer = await newStudent(srv);
  db.prepare("INSERT INTO mk_site_members (site_id, user_id, role) VALUES (?, ?, 'editor')").run(siteA, idOf(editorA));
  db.prepare("INSERT INTO mk_org_members (organization_id, user_id, role) VALUES (?, ?, 'viewer')").run(orgId, idOf(viewer));
  const c = Number(db.prepare("INSERT INTO mk_contacts (organization_id, email, first_name, origin_site_id) VALUES (?, 'orch@exemple.fr', 'Orch', ?)").run(orgId, siteA).lastInsertRowid);
  evA = addEvent(c, siteA, "funnel.entered", { funnelId: "1", funnelName: "Lancement", stepName: "Inscription", password: "SECRET-VALUE" });
  evB = addEvent(c, siteB, "funnel.entered", { funnelName: "Autre site" });
  evXss = addEvent(c, siteA, "funnel.abandoned", { funnelName: "<script>alert(1)</script>" });
});
after(() => srv.stop());

describe("objectif d'un scénario", () => {
  test("enregistré par qui peut écrire, refusé aux autres, valeur inconnue rejetée", async () => {
    const r = await boss.post(`${M}/automatisations/${autoA}/objectif`, { objectif: "purchase.completed" });
    assert.equal(r.status, 302);
    assert.equal(one("SELECT goal_event FROM mk_automations WHERE id = ?", autoA).goal_event, "purchase.completed");
    await boss.post(`${M}/automatisations/${autoA}/objectif`, { objectif: "pirate.event" });
    assert.equal(one("SELECT goal_event FROM mk_automations WHERE id = ?", autoA).goal_event, "purchase.completed");
    const v = await viewer.post(`${M}/automatisations/${autoA}/objectif`, { objectif: "" });
    assert.ok([302, 403, 404].includes(v.status));
    assert.equal(one("SELECT goal_event FROM mk_automations WHERE id = ?", autoA).goal_event, "purchase.completed");
  });
  test("la page du scénario montre la source du déclencheur et l'objectif", async () => {
    const t = (await boss.get(`${M}/automatisations/${autoA}`)).text;
    assert.match(t, /source : Tunnel/);
    assert.match(t, /Enregistrer l'objectif/);
  });
});

describe("diagnostic d'un événement", () => {
  test("affiche l'événement, masque l'e-mail et les secrets", async () => {
    const t = (await boss.get(`${M}/evenements/${evA}`)).text;
    assert.match(t, /Lancement/);
    assert.doesNotMatch(t, /orch@exemple\.fr/);
    assert.doesNotMatch(t, /SECRET-VALUE/);
  });
  test("XSS : les données de l'événement sont échappées", async () => {
    const t = (await boss.get(`${M}/evenements/${evXss}`)).text;
    assert.doesNotMatch(t, /<script>alert\(1\)/);
  });
  test("un membre limité au site A ne voit pas l'événement du site B (IDOR)", async () => {
    assert.equal((await editorA.get(`${M}/evenements/${evA}`)).status, 200);
    assert.equal((await editorA.get(`${M}/evenements/${evB}`)).status, 403);
    assert.equal((await boss.get(`${M}/evenements/999999`)).status, 404);
  });
  test("détection des abandons : réservée à la gestion de la file", async () => {
    assert.notEqual((await viewer.post(`${M}/evenements/abandons`, {})).status, 200);
    assert.equal((await boss.post(`${M}/evenements/abandons`, {})).status, 302);
  });
});

describe("réglages des tunnels", () => {
  test("les délais d'abandon sont des réglages réels", async () => {
    const page = await boss.get(`${M}/site-web/parametres/tunnels`);
    assert.equal(page.status, 200);
    assert.match(page.text, /abandon/i);
  });
});

describe("fiche contact : panneau Tunnels", () => {
  test("montre le parcours réel ; limité au site pour un membre d'un seul site", async () => {
    const c = one("SELECT id FROM mk_contacts WHERE email = 'orch@exemple.fr'").id;
    addEvent(c, siteA, "funnel.step_reached", { funnelId: "77", funnelName: "Tunnel <b>Alpha</b>", stepName: "Inscription" });
    addEvent(c, siteB, "funnel.step_reached", { funnelId: "78", funnelName: "Tunnel Bravo", stepName: "Autre" });
    const t = (await boss.get(`${M}/contacts/${c}`)).text;
    assert.match(t, /Tunnel &lt;b&gt;Alpha&lt;\/b&gt;/);
    assert.match(t, /Tunnel Bravo/);
    assert.doesNotMatch(t, /Tunnel <b>Alpha/);
    const e = await editorA.get(`${M}/contacts/${c}?site=${siteA}`);
    if (e.status === 200) { assert.match(e.text, /Tunnel &lt;b&gt;Alpha/); assert.doesNotMatch(e.text, /Tunnel Bravo/); }
  });
});
