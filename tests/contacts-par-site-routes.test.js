// R7 (lot 1) — Contacts par site de bout en bout (vrai serveur, base jetable) : un membre « Éditeur » limité à UN site lit les contacts associés à son site,
// n'écrit que ceux dont l'origine est son site, ne touche à aucun contact d'un autre site ni à l'historique sans association, ne fusionne pas.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, loginInstructor, newStudent } = require("./helpers");

let srv, boss, db, orgId, siteA, siteB, ed, edB, adm, ids = {};
const one = (sql, ...a) => db.prepare(sql).get(...a);
const count = (sql, ...a) => one(sql, ...a).n;
const C = "/marketing/contacts";
const idOf = (c) => one("SELECT id FROM users WHERE email = ?", c.email).id;
const add = (email, site = null) => Number(db.prepare("INSERT INTO mk_contacts (organization_id, email, first_name, origin_site_id) VALUES (?, ?, ?, ?)").run(orgId, email, email.split("@")[0], site).lastInsertRowid);

before(async () => {
  srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
  boss = await loginInstructor(srv);
  db = srv.db();
  orgId = one("SELECT id FROM mk_organizations").id;
  siteA = Number((await boss.post("/marketing/site-web/sites", { name: "Site Alpha" })).location.match(/sites\/(\d+)/)[1]);
  siteB = Number((await boss.post("/marketing/site-web/sites", { name: "Site Bravo" })).location.match(/sites\/(\d+)/)[1]);
  ids.own = add("propre@ex.fr", siteA);          // origine A
  ids.seen = add("vu@ex.fr");                    // origine principale, événement A
  ids.other = add("autre@ex.fr", siteB);         // origine B
  ids.both = add("deux@ex.fr", siteB);           // origine B, événement A
  ids.legacy = add("historique@ex.fr");          // aucune association
  for (const c of [ids.seen, ids.both]) db.prepare("INSERT INTO mk_events (organization_id, name, contact_id, source, occurred_at, created_at, site_id) VALUES (?, 'page.viewed', ?, 'cms', ?, ?, ?)").run(orgId, c, Date.now(), Date.now(), siteA);
  ed = await newStudent(srv); edB = await newStudent(srv); adm = await newStudent(srv);
  db.prepare("INSERT INTO mk_site_members (site_id, user_id, role) VALUES (?, ?, 'admin')").run(siteA, idOf(adm));
  db.prepare("INSERT INTO mk_site_members (site_id, user_id, role) VALUES (?, ?, 'editor')").run(siteA, idOf(ed));
  db.prepare("INSERT INTO mk_site_members (site_id, user_id, role) VALUES (?, ?, 'editor')").run(siteB, idOf(edB));
});
after(() => srv.stop());

describe("contacts par site : lecture", () => {
  test("liste : contacts associés au site (origine ou événement), jamais l'autre site ni l'historique ; autre site et sans site refusés", async () => {
    const list = (await ed.get(`${C}?site=${siteA}`)).text;
    for (const e of ["propre@ex.fr", "vu@ex.fr", "deux@ex.fr"]) assert.match(list, new RegExp(e.replace(".", "\\.")), e);
    for (const e of ["autre@ex.fr", "historique@ex.fr"]) assert.doesNotMatch(list, new RegExp(e.replace(".", "\\.")), e);
    assert.equal((await ed.get(`${C}?site=${siteB}`)).status, 403);
    assert.equal((await ed.get(C)).status, 302);
  });
  test("fiches : associée = 200 ; autre site, historique sans association = 404 (même en forçant le site B ou en changeant d'identifiant)", async () => {
    for (const id of [ids.own, ids.seen, ids.both]) assert.equal((await ed.get(`${C}/${id}?site=${siteA}`)).status, 200, String(id));
    for (const id of [ids.other, ids.legacy, 999999]) assert.equal((await ed.get(`${C}/${id}?site=${siteA}`)).status, 404, String(id));
    assert.equal((await ed.get(`${C}/${ids.own}?site=${siteB}`)).status, 403);
    assert.equal((await ed.get(`${C}/${ids.other}/evenements.json?site=${siteA}`)).status, 404);
    assert.equal((await edB.get(`${C}/${ids.own}?site=${siteB}`)).status, 404, "l'éditeur du site B ne voit pas le contact du site A");
  });
});

describe("contacts par site : écriture", () => {
  test("un contact dont l'origine est le site se modifie ; un contact seulement vu sur le site (événement) ou d'un autre site, non", async () => {
    const ok = await ed.post(`${C}/${ids.own}?site=${siteA}`, { first_name: "Modifie", site: siteA });
    assert.equal(ok.status, 302, ok.text.replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>|<[^>]*>/g, " ").replace(/\s+/g, " ").trim().slice(0, 300));
    assert.equal(one("SELECT first_name FROM mk_contacts WHERE id = ?", ids.own).first_name, "Modifie");
    for (const id of [ids.seen, ids.both, ids.other, ids.legacy]) {
      const before = one("SELECT first_name FROM mk_contacts WHERE id = ?", id).first_name;
      const r = await ed.post(`${C}/${id}?site=${siteA}`, { first_name: "PIRATE", site: siteA });
      assert.equal(r.status, 404, `écriture sur ${id}`);
      assert.equal(one("SELECT first_name FROM mk_contacts WHERE id = ?", id).first_name, before);
    }
  });
  test("étiquette, étape, archivage : mêmes limites (origine seulement)", async () => {
    assert.equal((await ed.post(`${C}/${ids.own}/etiquettes?site=${siteA}`, { name: "ok", site: siteA })).status, 302);
    assert.equal(count("SELECT COUNT(*) n FROM mk_contact_tags WHERE contact_id = ?", ids.own), 1);
    for (const id of [ids.seen, ids.both, ids.other]) {
      assert.equal((await ed.post(`${C}/${id}/etiquettes?site=${siteA}`, { name: "intrus", site: siteA })).status, 404);
      assert.equal((await ed.post(`${C}/${id}/cycle-de-vie?site=${siteA}`, { etape: "lead", site: siteA })).status, 404);
      assert.equal((await ed.post(`${C}/${id}/etat?site=${siteA}`, { etat: "archived", site: siteA })).status, 404);
      assert.equal(count("SELECT COUNT(*) n FROM mk_contact_tags WHERE contact_id = ?", id), 0);
      assert.equal(one("SELECT record_status FROM mk_contacts WHERE id = ?", id).record_status, "active");
    }
  });
  test("actions groupées : refusées en bloc si un seul contact n'est pas de l'origine du site ; acceptées pour ses propres contacts", async () => {
    const mixed = await ed.post(`${C}/actions?site=${siteA}`, { op: "tag_add", tag: "groupe", ids: [ids.own, ids.other].join(","), site: siteA });
    assert.equal(count("SELECT COUNT(*) n FROM mk_contact_tags WHERE tag_id IN (SELECT id FROM mk_tags WHERE name = 'groupe')"), 0, "rien n'est fait");
    assert.ok([302, 404, 403].includes(mixed.status), String(mixed.status));
    await ed.post(`${C}/actions?site=${siteA}`, { op: "tag_add", tag: "groupe", ids: String(ids.own), site: siteA });
    assert.equal(count("SELECT COUNT(*) n FROM mk_contact_tags ct JOIN mk_tags t ON t.id = ct.tag_id WHERE t.name = 'groupe' AND ct.contact_id = ?", ids.own), 1);
    await ed.post(`${C}/actions?site=${siteA}`, { op: "tag_add", tag: "groupe", ids: [ids.seen, ids.legacy].join(","), site: siteA });
    assert.equal(count("SELECT COUNT(*) n FROM mk_contact_tags ct JOIN mk_tags t ON t.id = ct.tag_id WHERE t.name = 'groupe' AND ct.contact_id IN (?, ?)", ids.seen, ids.legacy), 0);
  });
  test("création par un membre limité : le contact est rattaché à CE site (origine), jamais au site principal ni à un autre site", async () => {
    const r = await ed.post(`${C}?site=${siteA}`, { email: "nouveau@ex.fr", first_name: "Neuf", site: siteA });
    assert.equal(r.status, 302, r.text.slice(0, 200));
    const c = one("SELECT id, origin_site_id FROM mk_contacts WHERE email = 'nouveau@ex.fr'");
    assert.ok(c, "créé");
    assert.equal(c.origin_site_id, siteA);
    assert.equal(one("SELECT link FROM mk_contact_sites WHERE contact_id = ? AND site_id = ?", c.id, siteA).link, "origin");
  });
});

describe("contacts par site : fusion et doublons réservés à l'équipe", () => {
  test("même avec le droit de fusion sur le site (rôle Administrateur du site), un accès limité n'ouvre ni les doublons ni la fusion ; l'équipe, oui", async () => {
    // refus par la portée des routes (302 vers « Mes sites » : aucune règle de site pour ces adresses) ou par la garde « équipe seulement » (403) : jamais 200
    for (const r of [await adm.get(`${C}/doublons?site=${siteA}`), await adm.get(`${C}/fusion?site=${siteA}&maitre=${ids.own}&source=${ids.both}`), await adm.post(`${C}/fusion?site=${siteA}`, { maitre: ids.own, source: ids.both, confirmer: "1", site: siteA })]) {
      assert.ok([302, 403].includes(r.status), String(r.status));
      assert.doesNotMatch(r.text, /autre@ex\.fr|historique@ex\.fr/);
    }
    assert.equal(count("SELECT COUNT(*) n FROM mk_contacts WHERE record_status = 'merged'"), 0);
    assert.equal((await boss.get(`${C}/doublons`)).status, 200);
  });
  test("l'éditeur (sans droit de fusion) est refusé aussi, sans rien modifier", async () => {
    const r = await ed.post(`${C}/fusion?site=${siteA}`, { maitre: ids.own, source: ids.both, confirmer: "1", site: siteA });
    assert.ok([302, 403].includes(r.status));
    assert.equal(count("SELECT COUNT(*) n FROM mk_contacts WHERE record_status = 'merged'"), 0);
  });
});
