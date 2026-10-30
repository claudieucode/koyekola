// Programme 21.3 — parcours HTTP réel (serveur spawné, faux serveur d'API local avec le vrai SDK) : routes /marketing/ia/site/…, droits, module « ia » par site, isolation entre sites, secrets.
const http = require("node:http");
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, loginInstructor, newStudent } = require("./helpers");

const KEY = "sk-ant-test-factice";
const fact = (value = "", status = "unknown", evidence = "") => ({ value, status, evidence, confidence: 0.9 });
const ANALYSIS = { briefLanguage: "fr", name: fact(), siteType: fact("entreprise", "explicit", "entreprise de construction"), sector: fact("construction", "explicit", "entreprise de construction"), country: fact(), city: fact(), siteLanguage: fact(), audience: fact(), tone: fact(), formality: fact(), style: fact(), typography: fact(), colors: [], secondaryTypes: [], goals: [{ key: "devis", status: "explicit", confidence: 0.9, evidence: "demander un devis" }], features: [{ key: "formulaire_devis", status: "explicit", confidence: 0.9, evidence: "demander un devis", reason: "" }], pagesRequested: [], contradictions: [], missing: [], questions: [] };
const sec = (type, purpose) => ({ key: "", type, purpose, description: "", expectedContent: "", widgets: [], importance: "important", requiredData: [], dependsOn: [], origin: "ai" });
const pg = (key, name, sections, pageType, position) => ({ key, name, slug: key, purpose: name, description: "", pageType, priority: "essential", origin: "ai", menu: "main", position, parent: "", relatedTo: [], sections });
const PLAN = { site: { name: "Construction", description: "" }, pages: [pg("accueil", "Accueil", [sec("hero", "Accroche"), sec("cta", "Devis")], "accueil", 1), pg("contact", "Contact", [sec("form", "Formulaire")], "contact", 2)], navigation: { main: ["accueil", "contact"], secondary: [], footer: [] }, features: [], conversions: [], recommendations: [] };
const BRIEF = "Je veux un site pour mon entreprise de construction, pour permettre aux clients de demander un devis.";

describe("API du Brief Analyzer et du Site Planner (serveur réel)", () => {
  let srv, db, boss, api, requests = [], A, B, editorA, adminB, readerA;
  const one = (sql, ...a) => db.prepare(sql).get(...a);
  const idOf = (c) => one("SELECT id FROM users WHERE email = ?", c.email).id;
  const M = (site) => `/marketing/site-web/sites/${site}/modules`;
  before(async () => {
    api = http.createServer((req, res) => {
      let body = ""; req.on("data", (d) => (body += d));
      req.on("end", () => {
        const r = JSON.parse(body || "{}"); requests.push({ key: req.headers["x-api-key"], body: r });
        const text = JSON.stringify(/analyste de projets/.test(String(r.system)) ? ANALYSIS : PLAN);
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ id: "msg_t", type: "message", role: "assistant", model: r.model, content: [{ type: "text", text }], stop_reason: "end_turn", stop_sequence: null, usage: { input_tokens: 10, output_tokens: 20 } }));
      });
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
  });
  after(async () => { db.close(); await srv.stop(); api.close(); });
  const post = (c, path, body) => c.request(path, { method: "POST", json: body });
  const json = (r) => JSON.parse(r.text);

  test("équipe : analyser → planifier → modifier → valider ; le plan validé existe en base, aucune page n'a été créée", async () => {
    const pagesBefore = one("SELECT COUNT(*) n FROM mk_landing_pages").n;
    const a = await post(boss, "/marketing/ia/site/analyser", { brief: BRIEF });
    assert.equal(a.status, 200, a.text.slice(0, 300));
    const id = json(a).plan.id; assert.equal(json(a).plan.status, "draft");
    const p = await post(boss, `/marketing/ia/site/plans/${id}/planifier`, {});
    assert.equal(p.status, 200, p.text.slice(0, 300)); const plan = json(p).plan; assert.equal(plan.status, "pending");
    const e = await post(boss, `/marketing/ia/site/plans/${id}/modifier`, { revision: plan.revision, operation: { op: "rename_site", name: "BâtiPlus" } });
    assert.equal(json(e).plan.status, "modified");
    const stale = await post(boss, `/marketing/ia/site/plans/${id}/modifier`, { revision: plan.revision, operation: { op: "rename_site", name: "Autre" } });
    assert.equal(stale.status, 409);
    const v = await post(boss, `/marketing/ia/site/plans/${id}/valider`, { revision: json(e).plan.revision });
    assert.equal(json(v).plan.status, "validated");
    const g = await boss.get(`/marketing/ia/site/plans/${id}`); assert.equal(g.status, 200); assert.ok(json(g).history.length >= 4);
    assert.equal(one("SELECT COUNT(*) n FROM mk_landing_pages").n, pagesBefore);
    assert.deepEqual(db.prepare("SELECT action, site_id FROM mk_ai_requests ORDER BY id").all().map((r) => ({ ...r })), [{ action: "brief", site_id: null }, { action: "plan", site_id: null }]);
  });
  test("brief invalide : refusé avant tout appel au fournisseur, message utile", async () => {
    const n = requests.length;
    const r = await post(boss, "/marketing/ia/site/analyser", { brief: "site" });
    assert.equal(r.status, 400); assert.equal(json(r).code, "brief_too_short"); assert.match(json(r).error, /Exemple/);
    assert.equal((await post(boss, "/marketing/ia/site/analyser", {})).status, 400);
    assert.equal(requests.length, n);
  });
  test("membre de A : crée un plan pour A (site imposé) ; refus pour le lecteur sans droit, pour l'administrateur de B, et pour un site dont le module est coupé", async () => {
    const r = await post(editorA, `/marketing/ia/site/analyser?site=${A}`, { brief: BRIEF, siteId: B });
    assert.equal(r.status, 200, r.text.slice(0, 300)); const id = json(r).plan.id;
    assert.equal(one("SELECT site_id FROM mk_ai_plans WHERE id = ?", id).site_id, A, "le site du corps est ignoré");
    assert.equal(one("SELECT site_id FROM mk_ai_requests ORDER BY id DESC LIMIT 1").site_id, A);
    const n = requests.length;
    for (const [who, res] of [["lecteur", await post(readerA, `/marketing/ia/site/analyser?site=${A}`, { brief: BRIEF })], ["adminB sur A", await post(adminB, `/marketing/ia/site/analyser?site=${A}`, { brief: BRIEF })], ["adminB lit un plan de A", await adminB.get(`/marketing/ia/site/plans/${id}?site=${B}`)], ["adminB modifie", await post(adminB, `/marketing/ia/site/plans/${id}/valider?site=${B}`, { revision: 1 })], ["adminB (module B coupé)", await post(adminB, `/marketing/ia/site/analyser?site=${B}`, { brief: BRIEF })]])
      assert.ok([403, 404].includes(res.status), `${who} : ${res.status}`);
    assert.equal(requests.length, n, "aucun appel au fournisseur pour les refus");
    const own = await editorA.get(`/marketing/ia/site/plans?site=${A}`); assert.equal(own.status, 200); assert.deepEqual(json(own).plans.map((x) => x.id), [id]);
    await boss.post(`${M(A)}/ai`, { etat: "desactiver" });
    assert.ok([400, 403].includes((await post(editorA, `/marketing/ia/site/analyser?site=${A}`, { brief: BRIEF })).status));
  });
  test("aucune clé ni secret dans aucune réponse ; une seule clé (celle du serveur) est utilisée", async () => {
    const all = [await boss.get("/marketing/ia/site/plans"), await post(boss, "/marketing/ia/site/analyser", { brief: BRIEF })];
    for (const r of all) assert.ok(!r.text.includes(KEY) && !/ANTHROPIC/.test(r.text));
    assert.ok(requests.every((r) => r.key === KEY));
  });
});
