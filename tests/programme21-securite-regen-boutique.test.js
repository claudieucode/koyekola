// Programme 21.11 — isolation multisite des moteurs 21.9 (régénération, versions) et 21.10 (boutique par IA), par les adresses réelles (vrai serveur).
// Un administrateur du site A tente de lire ou de modifier les versions, opérations et projets de boutique du site B. Attendu : refus et base strictement inchangée. Aucun appel IA, aucun paiement.
const { describe, test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { startServer, Client, loginInstructor, newStudent } = require("./helpers");
const pages = require("../src/marketing/pages");
const regen = require("../src/regen");
const shop = require("../src/marketing/ai/shop/project");
const siteModules = require("../src/marketing/siteModules");

describe("isolation multisite : régénération (21.9) et boutique par IA (21.10)", () => {
  let srv, boss, db, A, B, adminA, viewerA, ids;
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const retry = async (fn) => { for (let i = 0; i < 40; i += 1) { try { return await fn(); } catch (e) { if (!/locked|busy/i.test(String(e.message))) throw e; await sleep(400); } } return fn(); };
  const idOf = (c) => db.prepare("SELECT id FROM users WHERE email = ?").get(c.email).id;
  const snapshot = () => {
    const rows = (t, cols) => { try { return db.prepare(`SELECT ${cols} FROM ${t} ORDER BY 1`).all(); } catch { return []; } };
    return JSON.stringify({ snaps: rows("mk_regen_snapshots", "*"), ops: rows("mk_regen_ops", "*"), shops: rows("mk_ai_shops", "*"), events: rows("mk_ai_shop_events", "id"), pages: rows("mk_landing_pages", "id, status, revision, sections, draft"), products: rows("shop_products", "*"), cat: rows("shop_categories", "*") });
  };
  before(async () => {
    srv = await startServer({ SITE_URL: "https://kolakisa.test" });
    boss = await loginInstructor(srv); db = srv.db(); db.exec("PRAGMA busy_timeout = 30000");
    const mk = async (n) => { await boss.post("/marketing/site-web/sites", { name: n }); return db.prepare("SELECT id FROM mk_sites WHERE name = ?").get(n).id; };
    A = await mk("Régén A"); B = await mk("Régén B");
    const member = async (site, role) => { const c = await newStudent(srv); db.prepare("INSERT INTO mk_site_members (site_id, user_id, role) VALUES (?, ?, ?)").run(site, idOf(c), role); return c; };
    adminA = await member(A, "admin"); viewerA = await member(A, "viewer");
    const ctxB = { db, organizationId: 1, userId: 1, settings: { get: (o, k, d) => d, set() {} } };
    await retry(() => siteModules.setEnabled(ctxB, B, "commerce", true));
    const pg = await retry(() => pages.createPage(ctxB, { name: "Page régén secrète B", siteId: B, kind: "page", blank: true })); const cur = pages.requirePage(ctxB, pg.id);
    await retry(() => pages.saveDraft(ctxB, pg.id, { ...cur.working, sections: [{ type: "hero", title: "Titre secret B", subtitle: "", image: "", imageAlt: "", buttonLabel: "", buttonUrl: "" }] }, { revision: cur.revision }));
    const snap = await retry(() => regen.takeSnapshot(ctxB, B, { level: "page", pageId: pg.id, label: "version secrète B" }));
    const shopP = await retry(() => shop.create(ctxB, { brief: "Je veux créer une boutique en ligne nommée « SecretShop » pour vendre des ordinateurs portables à Kinshasa, livraison en RDC, prix en dollars.", siteId: B }));
    ids = { pageB: pg.id, snapB: snap.id || snap.snapshot?.id, shopB: shopP.id };
  });
  after(() => { db.close(); return srv.stop(); });

  test("lecture : versions, comparaison, historique de régénération et projet de boutique du site B invisibles pour un administrateur du site A", async () => {
    const R = (site, rest) => `/marketing/site-web/sites/${site}/regeneration${rest}`;
    const urls = [R(A, `/versions/${ids.snapB}`), R(B, `/versions/${ids.snapB}`), R(B, "/versions"), R(B, "/historique"), R(B, "/pages"), R(A, `/comparer?de=${ids.snapB}`), `/marketing/ia/studio/boutique/${ids.shopB}`, `/marketing/ia/studio/boutique/${ids.shopB}/etat.json`, "/marketing/ia/studio/boutique/projets.json"];
    for (const u of urls) { const r = await adminA.get(u); assert.ok([302, 403, 404].includes(r.status) || (u.endsWith("projets.json") && r.status === 200), `${u} → ${r.status}`); assert.ok(!/SecretShop|version secrète B|Titre secret B|Page régén secrète/.test(r.text), `fuite sur ${u}`); }
  });
  test("écriture : restaurer, prendre une version, demander une régénération, modifier ou publier la boutique de B depuis A sont refusés ; base inchangée", async () => {
    const before = snapshot(); const R = (site, rest) => `/marketing/site-web/sites/${site}/regeneration${rest}`;
    const posts = [[R(A, "/restaurer"), { id: String(ids.snapB) }], [R(B, "/restaurer"), { id: String(ids.snapB) }], [R(B, "/versions"), { level: "page", pageId: String(ids.pageB) }], [R(B, "/demander"), { request: "Change tout" }], [R(B, "/annuler"), {}], [R(B, "/retablir"), {}],
      [`/marketing/ia/studio/boutique/${ids.shopB}/modifier`, { operation: { op: "rename" } }], [`/marketing/ia/studio/boutique/${ids.shopB}/publier`, {}], [`/marketing/ia/studio/boutique/${ids.shopB}/annuler`, {}]];
    for (const [u, body] of posts) { const r = await adminA.post(u, body); assert.ok([302, 400, 401, 403, 404, 409, 422].includes(r.status), `${u} → ${r.status}`); }
    assert.equal(snapshot(), before, "aucune donnée de régénération ni de boutique n'a changé");
  });
  test("lecteur du site A : aucune écriture dans la régénération ni la boutique ; anonyme renvoyé à la connexion", async () => {
    const before = snapshot();
    for (const u of [`/marketing/site-web/sites/${A}/regeneration/versions`, `/marketing/site-web/sites/${A}/regeneration/demander`, "/marketing/ia/studio/boutique/projets"]) { const r = await viewerA.post(u, { request: "x", brief: "x" }); assert.ok([302, 401, 403, 404, 405, 422].includes(r.status), `${u} → ${r.status}`); }
    assert.equal(snapshot(), before);
    for (const u of ["/marketing/ia/studio/boutique/projets.json", `/marketing/site-web/sites/${A}/regeneration/historique`]) { const r = await new Client(srv.base).get(u); assert.equal(r.status, 302, u); assert.match(r.location, /connexion/); }
  });
});
