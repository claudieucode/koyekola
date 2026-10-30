// Programme 22.3 — parcours HTTP réel : écran et API /site-web/sites/:id/mises-en-page, droits, isolation entre sites, application en brouillon, protections côté serveur, annulation.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, loginInstructor, newStudent } = require("./helpers");

describe("Mises en page avancées (serveur réel)", () => {
  let srv, db, boss, A, B, editorA, adminB, readerA, pageA, pageB, base0;
  const one = (sql, ...a) => db.prepare(sql).get(...a);
  const idOf = (c) => one("SELECT id FROM users WHERE email = ?", c.email).id;
  const U = (site, p = "") => `/marketing/site-web/sites/${site}/mises-en-page${p}`;
  const post = (c, path, body) => c.request(path, { method: "POST", json: body || {} });
  const json = (r) => JSON.parse(r.text);
  const sections = (id) => { const d = one("SELECT draft FROM mk_landing_pages WHERE id = ?", id).draft; return d ? JSON.parse(d).sections || [] : []; };
  const count = async (pid, site = A) => json(await boss.get(U(site, `/api/pages/${pid}/sections`))).sections.length;
  const im = (n) => ({ src: `https://exemple.test/${n}.jpg`, alt: `Image ${n}` });
  const items = (n) => Array.from({ length: n }, (_, i) => ({ title: `Service ${i + 1}`, text: `Description ${i + 1}` }));
  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv); db = srv.db();
    const mk = async (name) => Number((await boss.post("/marketing/site-web/sites", { name })).location.match(/sites\/(\d+)/)[1]);
    A = await mk("Site Alpha"); B = await mk("Site Bravo");
    const member = async (site, role) => { const c = await newStudent(srv); db.prepare("INSERT INTO mk_site_members (site_id, user_id, role) VALUES (?, ?, ?)").run(site, idOf(c), role); return c; };
    editorA = await member(A, "editor"); adminB = await member(B, "admin");
    await boss.post("/marketing/site-web/utilisateurs/roles", { name: "Contacts seuls", description: "t", perm: ["contacts.read"] });
    readerA = await member(A, one("SELECT key FROM mk_roles WHERE name = 'Contacts seuls'").key);
    await boss.post("/marketing/pages", { name: "Page Alpha", site_id: A, kind: "page" }); await boss.post("/marketing/pages", { name: "Page Bravo", site_id: B, kind: "page" });
    pageA = one("SELECT id FROM mk_landing_pages WHERE name = 'Page Alpha'").id; pageB = one("SELECT id FROM mk_landing_pages WHERE name = 'Page Bravo'").id; 
  });
  after(async () => { db.close(); await srv.stop(); });

  test("écran : rendu accessible, aucun secret ; introuvable pour un site inconnu ; refusé sans droit de lecture", async () => {
    const r = await boss.get(U(A)); assert.equal(r.status, 200);
    for (const s of ['id="ly-form"', 'role="status"', 'aria-live="polite"', 'aria-label="Écran de l\'aperçu"', "layouts.js", "layouts.css"]) assert.ok(r.text.includes(s), s);
    assert.ok(!/ANTHROPIC|sk-ant|ENCRYPTION/.test(r.text));
    assert.equal((await boss.get("/js/layouts.js")).status, 200); assert.equal((await boss.get("/css/layouts.css")).status, 200);
    assert.equal((await boss.get(U(999999))).status, 404);
    assert.notEqual((await readerA.get(U(A) + `?site=${A}`)).status, 200);
  });
  test("catalogue : 7 familles et layouts réellement générables ; variantes avec aperçus filaires pour les 3 écrans", async () => {
    const c = json(await boss.get(U(A, "/api/catalogue"))); assert.equal(Object.keys(c.families).length, 7); assert.ok(c.patterns.length >= 50);
    const v = await post(boss, U(A, "/api/variantes"), { pageId: pageA, role: "services", pageType: "services", content: { title: "Nos services", items: items(4) } });
    assert.equal(v.status, 200, v.text.slice(0, 300)); const j = json(v);
    assert.ok(j.variants.length >= 4); for (const x of j.variants) { assert.ok(x.wire.desktop.c.length && x.wire.tablet.c.length && x.wire.mobile.c.length); assert.ok(x.score > 0); }
    assert.ok(j.rejected.length > 0 && j.rejected.every((r) => r.reason), "layouts écartés avec leur raison");
    assert.equal(await count(pageA), 2, "aucune écriture (les 2 sections par défaut de la page)");
  });
  test("proposition → application : brouillon natif (jamais publié), section 'layout', annulation exacte", async () => {
    const pr = await post(boss, U(A, "/api/proposer"), { pageId: pageA, items: [{ role: "services", patternId: "numbered-services", content: { title: "Nos services", items: items(3) } }] });
    assert.equal(pr.status, 200, pr.text.slice(0, 300)); const p = json(pr); assert.equal(p.status, "proposed"); assert.equal(await count(pageA), 2);
    const ap = await post(boss, U(A, `/api/operations/${p.opId}/appliquer`), {}); assert.equal(ap.status, 200, ap.text.slice(0, 300));
    assert.equal(await count(pageA), 3); const s = sections(pageA); assert.equal(s[s.length - 1].type, "layout");
    assert.notEqual(one("SELECT status FROM mk_landing_pages WHERE id = ?", pageA).status, "published");
    assert.equal((await post(boss, U(A, `/api/operations/${p.opId}/appliquer`), {})).status, 409, "déjà appliquée");
    const un = await post(boss, U(A, `/api/operations/${p.opId}/annuler`)); assert.equal(un.status, 200, un.text.slice(0, 300)); assert.equal(await count(pageA), 2);
  });
  test("protections serveur : section verrouillée = 423 ; modification manuelle = confirmation (409) puis autorisation explicite", async () => {
    const mkp = async () => json(await post(boss, U(A, "/api/proposer"), { pageId: pageA, items: [{ role: "services", patternId: "structured-corporate-grid", content: { title: "S", items: items(3) } }] }));
    const p1 = await mkp(); assert.equal((await post(boss, U(A, `/api/operations/${p1.opId}/appliquer`), {})).status, 200);
    const sid = sections(pageA).find((x) => x.type === "layout").id;
    const reg = (kind, ref, state) => post(boss, `/marketing/site-web/sites/${A}/regeneration/api/protections`, { kind, ref, state });
    assert.equal((await reg("section", sid, "locked")).status, 200);
    const p2 = json(await post(boss, U(A, "/api/proposer"), { pageId: pageA, items: [{ sectionId: sid, patternId: "corporate-services" }] }));
    const lockedTry = await post(boss, U(A, `/api/operations/${p2.opId}/appliquer`), { confirm: true, allow: [sid] }); assert.equal(lockedTry.status, 423); assert.equal(json(lockedTry).code, "protected");
    assert.equal((await reg("section", sid, "validated")).status, 200);
    const needs = await post(boss, U(A, `/api/operations/${p2.opId}/appliquer`), { confirm: true }); assert.equal(needs.status, 409); assert.equal(json(needs).code, "needs_confirmation");
    const ok = await post(boss, U(A, `/api/operations/${p2.opId}/appliquer`), { confirm: true, allow: [sid] }); assert.equal(ok.status, 200, ok.text.slice(0, 300));
    assert.ok(sections(pageA).some((x) => x.id === sid));
  });
  test("droits et isolation : lecteur sans droit d'écriture = 403 ; autre site = introuvable ; un administrateur du site B ne touche pas le site A", async () => {
    assert.equal((await post(readerA, U(A, "/api/proposer"), { pageId: pageA, items: [] })).status, 403);
    const ro = await post(adminB, U(B, "/api/proposer"), { pageId: pageA, items: [{ role: "cta", content: { title: "x", cta: { label: "a", url: "/b" } } }] });
    assert.equal(ro.status, 404, "page du site A via le site B");
    assert.notEqual((await adminB.get(U(A, "/api/catalogue"))).status, 200);
    assert.equal((await post(adminB, U(A, "/api/variantes"), { pageId: pageA, role: "cta", content: { title: "x" } })).status === 200, false);
    const okB = await post(adminB, U(B, "/api/proposer"), { pageId: pageB, items: [{ role: "cta", content: { title: "Parlons-en", cta: { label: "Écrire", url: "/contact" } } }] }); assert.equal(okB.status, 200, okB.text.slice(0, 200));
    assert.equal((await post(boss, U(A, `/api/operations/${json(okB).opId}/appliquer`), {})).status, 404, "proposition d'un autre site");
    assert.equal((await post(editorA, U(A, "/api/proposer"), { pageId: pageB, items: [{ role: "cta", content: { title: "x", cta: { label: "a", url: "/b" } } }] })).status, 404);
  });
  test("contenu insuffisant : refus clair (422), rien d'inventé ; corps invalide toléré", async () => {
    const r = await post(boss, U(A, "/api/proposer"), { pageId: pageA, items: [{ role: "stats", content: { title: "Chiffres", items: items(2) } }] });
    assert.equal(r.status, 422); assert.match(json(r).error, /chiffres réels/);
    assert.equal((await post(boss, U(A, "/api/proposer"), { pageId: pageA, items: "n'importe quoi" })).status, 422);
    assert.equal((await post(boss, U(A, "/api/page"), { type: "services", sections: [{ kind: "hero", title: "T", text: "x" }, { kind: "stats", title: "S" }] })).status, 200);
  });
});
