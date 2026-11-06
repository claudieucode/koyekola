// Programme 21.9 — parcours HTTP réel : écran et API /site-web/sites/:id/regeneration, droits, isolation, protections côté serveur, design réel (personnalisateur natif), IA simulée par un faux serveur local (vrai SDK).
const http = require("node:http");
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, loginInstructor, newStudent } = require("./helpers");

const KEY = "sk-ant-test-factice";
describe("Régénération intelligente et historique (serveur réel)", () => {
  let srv, db, boss, api, requests = [], A, B, editorA, adminB, readerA, pageA, pageB;
  const one = (sql, ...a) => db.prepare(sql).get(...a);
  const idOf = (c) => one("SELECT id FROM users WHERE email = ?", c.email).id;
  const M = (site) => `/marketing/site-web/sites/${site}/modules`;
  const U = (site, p = "") => `/marketing/site-web/sites/${site}/regeneration${p}`;
  const post = (c, path, body) => c.request(path, { method: "POST", json: body || {} });
  const json = (r) => JSON.parse(r.text);
  const sections = (id) => JSON.parse(one("SELECT draft FROM mk_landing_pages WHERE id = ?", id).draft).sections;
  const prep = (name) => { const p = one("SELECT id, draft FROM mk_landing_pages WHERE name = ?", name); const d = p.draft ? JSON.parse(p.draft) : {}; d.sections = [{ id: "sechero1", type: "hero", title: "Bienvenue", subtitle: "Un sous-titre long", image: "", imageAlt: "", buttonLabel: "", buttonUrl: "", style: { padding: "lg", background: "primary" } }, { id: "secfeat1", type: "features", title: "Nos services", intro: "Ce que nous faisons", columns: 3, items: [{ title: "Conception", text: "Des plans" }] }, { id: "sectext1", type: "text", markdown: "Un texte" }]; db.prepare("UPDATE mk_landing_pages SET draft = ?, revision = revision + 1 WHERE id = ?").run(JSON.stringify(d), p.id); return p.id; };
  before(async () => {
    api = http.createServer((req, res) => {
      let body = ""; req.on("data", (d) => (body += d));
      req.on("end", () => { const r = JSON.parse(body || "{}"); requests.push({ key: req.headers["x-api-key"] }); res.writeHead(200, { "Content-Type": "application/json" }); res.end(JSON.stringify({ id: "m", type: "message", role: "assistant", model: r.model, content: [{ type: "text", text: JSON.stringify({ variants: ["Nos activités."] }) }], stop_reason: "end_turn", stop_sequence: null, usage: { input_tokens: 5, output_tokens: 5 } })); });
    });
    await new Promise((resolve) => api.listen(0, "127.0.0.1", resolve));
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "", ANTHROPIC_API_KEY: KEY, ANTHROPIC_BASE_URL: `http://127.0.0.1:${api.address().port}` });
    boss = await loginInstructor(srv); db = srv.db();
    const mk = async (name) => Number((await boss.post("/marketing/site-web/sites", { name })).location.match(/sites\/(\d+)/)[1]);
    A = await mk("Site Alpha"); B = await mk("Site Bravo");
    const member = async (site, role) => { const c = await newStudent(srv); db.prepare("INSERT INTO mk_site_members (site_id, user_id, role) VALUES (?, ?, ?)").run(site, idOf(c), role); return c; };
    editorA = await member(A, "editor"); adminB = await member(B, "admin");
    await boss.post("/marketing/site-web/utilisateurs/roles", { name: "Contacts seuls", description: "t", perm: ["contacts.read"] });
    readerA = await member(A, one("SELECT key FROM mk_roles WHERE name = 'Contacts seuls'").key);
    await boss.post(`${M(A)}/ai`, { etat: "activer" });
    await boss.post("/marketing/pages", { name: "Page Alpha", site_id: A, kind: "page" }); await boss.post("/marketing/pages", { name: "Page Bravo", site_id: B, kind: "page" });
    pageA = prep("Page Alpha"); pageB = prep("Page Bravo");
  });
  after(async () => { db.close(); await srv.stop(); api.close(); });

  test("écran : rendu (onglets accessibles, aucun secret) ; refus sans droit de lecture", async () => {
    const r = await boss.get(U(A)); assert.equal(r.status, 200);
    for (const s of ['role="tablist"', 'id="rg-form"', 'id="rg-proposal"', 'aria-live="polite"', "regen.js"]) assert.ok(r.text.includes(s), s);
    assert.ok(!r.text.includes(KEY) && !/ANTHROPIC/.test(r.text));
    assert.equal((await boss.get("/js/regen.js")).status, 200); assert.equal((await boss.get(U(999999))).status, 404);
    assert.notEqual((await readerA.get(U(A) + `?site=${A}`)).status, 200);
  });
  test("modification locale → historique → comparaison → restauration → annulation / rétablissement (brouillon seulement, jamais publié)", async () => {
    const pr = await post(boss, U(A, "/api/demander"), { text: "Change uniquement le fond de cette section en sombre", selection: { pageId: pageA, sectionId: "sechero1" } });
    assert.equal(pr.status, 200, pr.text.slice(0, 300)); const p = json(pr); assert.equal(p.status, "proposed"); assert.equal(p.plan.scope, "section");
    assert.equal(sections(pageA)[0].style.background, "primary", "la proposition ne modifie rien");
    const ap = await post(boss, U(A, `/api/operations/${p.opId}/appliquer`), {}); assert.equal(ap.status, 200, ap.text.slice(0, 300));
    assert.equal(sections(pageA)[0].style.background, "dark"); assert.equal(one("SELECT status FROM mk_landing_pages WHERE id = ?", pageA).status === "published", false);
    const h = json(await boss.get(U(A, "/api/historique"))); assert.equal(h.total, 1); assert.equal(h.items[0].actor, "ai");
    const op = json(await boss.get(U(A, `/api/operations/${p.opId}`))).operation; const before = op.snapshots.find((s) => s.phase === "before" && s.level === "page"), after = op.snapshots.find((s) => s.phase === "after" && s.level === "page");
    const cmp = json(await boss.get(U(A, `/api/comparer?a=${before.id}&b=${after.id}`))).comparison; assert.ok(cmp.changes.some((c) => /style\.background/.test(c.path) && c.before === "primary" && c.after === "dark"));
    assert.equal(json(await boss.get(U(A, `/api/comparer?a=${after.id}&vs=actuel`))).comparison.identical, true);
    const un = await post(boss, U(A, "/api/annuler")); assert.equal(un.status, 200, un.text.slice(0, 300)); assert.equal(sections(pageA)[0].style.background, "primary");
    const rd = await post(boss, U(A, "/api/retablir")); assert.equal(rd.status, 200); assert.equal(sections(pageA)[0].style.background, "dark");
    const rs = await post(boss, U(A, "/api/restaurer"), { snapshotId: before.id, restoreAnyway: true }); assert.equal(rs.status, 200, rs.text.slice(0, 300)); assert.equal(sections(pageA)[0].style.background, "primary");
    assert.ok(json(await boss.get(U(A, "/api/historique"))).total >= 4, "rien n'est supprimé de l'historique");
  });
  test("design réel : changement GLOBAL = confirmation d'impact obligatoire ; écrit dans le brouillon de Styles ; annulation", async () => {
    const pr = await post(boss, U(A, "/api/demander"), { text: "Modifie toutes les couleurs secondaires du site en rouge" }); assert.equal(pr.status, 200, pr.text.slice(0, 300));
    const p = json(pr); assert.equal(p.plan.executor, "design_token"); assert.equal(p.impact.level, "high"); assert.equal(p.plan.requiresConfirmation, true);
    const no = await post(boss, U(A, `/api/operations/${p.opId}/appliquer`), {}); assert.equal(no.status, 409); assert.equal(json(no).code, "confirm_required");
    assert.equal(one("SELECT COUNT(*) n FROM cms_customizer_drafts WHERE site_id = ?", A).n, 0, "rien n'est écrit sans confirmation");
    const ok = await post(boss, U(A, `/api/operations/${p.opId}/appliquer`), { confirm: true }); assert.equal(ok.status, 200, ok.text.slice(0, 300));
    assert.match(one("SELECT changes FROM cms_customizer_drafts WHERE site_id = ?", A).changes, /tokens\.colors\.secondary.*#c62828/);
    const un = await post(boss, U(A, "/api/annuler")); assert.equal(un.status, 200, un.text.slice(0, 300));
    assert.ok(!one("SELECT changes FROM cms_customizer_drafts WHERE site_id = ?", A) || !/secondary/.test(one("SELECT changes FROM cms_customizer_drafts WHERE site_id = ?", A).changes), "le design retrouve son état d'avant");
  });
  test("texte : une variante IA (faux serveur) est proposée avec avant/après ; le verrou posé côté serveur bloque l'application ; clarification si la demande est floue", async () => {
    const pr = await post(boss, U(A, "/api/demander"), { text: "Raccourcis ce texte", selection: { pageId: pageA, fieldKey: "secfeat1/intro" } }); assert.equal(pr.status, 200, pr.text.slice(0, 300));
    const p = json(pr); assert.equal(p.usage.aiCalls, 1); assert.deepEqual([p.preview.changes[0].before, p.preview.changes[0].after], ["Ce que nous faisons", "Nos activités."]);
    const lk = await post(boss, U(A, "/api/protections"), { kind: "section", ref: "secfeat1", state: "locked" }); assert.equal(lk.status, 200);
    const ap = await post(boss, U(A, `/api/operations/${p.opId}/appliquer`), {}); assert.equal(ap.status, 423); assert.equal(json(ap).code, "protected");
    assert.equal(sections(pageA)[1].intro, "Ce que nous faisons");
    await post(boss, U(A, "/api/protections"), { kind: "section", ref: "secfeat1", state: "none" });
    const ok = await post(boss, U(A, `/api/operations/${p.opId}/appliquer`), {}); assert.equal(ok.status, 200, ok.text.slice(0, 200)); assert.equal(sections(pageA)[1].intro, "Nos activités.");
    const fl = await post(boss, U(A, "/api/demander"), { text: "Réécris le texte" }); assert.equal(json(fl).status, "clarification");
    const pg = json(await boss.get(U(A, "/api/protections") + `?page=${pageA}`)); assert.equal(pg.elements.find((e) => e.ref === "secfeat1").fields.find((f) => f.ref === "secfeat1/intro").state, "ai");
  });
  test("droits et isolation : lecteur sans droit, administrateur d'un autre site, opération / version d'un autre site introuvables, aucun appel IA pour un refus", async () => {
    const opId = json(await boss.get(U(A, "/api/historique"))).items[0].id; const snapId = json(await boss.get(U(A, "/api/versions"))).items[0].id;
    const n = requests.length;
    const attempts = [["lecteur", await readerA.get(U(A, "/api/historique") + `?site=${A}`)], ["lecteur écrit", await post(readerA, U(A, "/api/demander") + `?site=${A}`, { text: "Raccourcis ce texte" })], ["adminB lit A", await adminB.get(U(A, `/api/operations/${opId}`) + `?site=${B}`)], ["adminB restaure A", await post(adminB, U(A, "/api/restaurer") + `?site=${B}`, { snapshotId: snapId })], ["adminB demande sur A", await post(adminB, U(A, "/api/demander") + `?site=${B}`, { text: "Raccourcis ce texte", selection: { pageId: pageA, fieldKey: "secfeat1/intro" } })]];
    for (const [who, r] of attempts) assert.ok([403, 404].includes(r.status), `${who} : ${r.status}`);
    assert.equal(requests.length, n);
    assert.equal((await boss.get(U(B, `/api/operations/${opId}`))).status, 404); assert.equal((await boss.get(U(B, `/api/versions/${snapId}`))).status, 404);
    assert.equal(json(await boss.get(U(B, "/api/historique"))).total, 0);
    const cross = await post(boss, U(B, "/api/demander"), { text: "Change uniquement le fond de cette section en sombre", selection: { pageId: pageA, sectionId: "sechero1" } }); assert.ok([404].includes(cross.status), "une page d'un autre site n'est pas accessible : " + cross.status);
    assert.equal(sections(pageB)[0].style.background, "primary");
    // l'éditeur de A peut travailler sur A (droits d'édition) mais pas sur B
    assert.ok([200, 403].includes((await post(editorA, U(A, "/api/demander") + `?site=${A}`, { text: "Change uniquement le fond de cette section en accent", selection: { pageId: pageA, sectionId: "sechero1" } })).status));
    assert.equal((await post(editorA, U(B, "/api/demander") + `?site=${A}`, { text: "x" })).status === 200, false);
  });
  test("aucune clé ni secret dans les réponses ; nettoyage des versions : simulation par défaut, réservé à la suppression d'historique", async () => {
    for (const r of [await boss.get(U(A)), await boss.get(U(A, "/api/historique")), await boss.get(U(A, "/api/versions"))]) assert.ok(!r.text.includes(KEY) && !/sk-ant|ANTHROPIC/.test(r.text));
    assert.ok(requests.every((q) => q.key === KEY));
    const pr = await post(boss, U(A, "/api/versions/nettoyer"), { jours: 30 }); assert.equal(pr.status, 200); assert.equal(json(pr).result.dryRun, true); assert.equal(json(pr).result.deleted, 0);
    assert.notEqual((await post(readerA, U(A, "/api/versions/nettoyer") + `?site=${A}`, {})).status, 200);
  });
});
