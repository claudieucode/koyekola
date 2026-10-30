// Programme 21.6 — parcours HTTP réel (serveur spawné, faux serveur d'API local avec le vrai SDK) : routes /site-web/sites/:id/contenus, droits, module « ia » par site, isolation, secrets, persistance.
const http = require("node:http");
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, loginInstructor, newStudent } = require("./helpers");

const KEY = "sk-ant-test-factice";
describe("API du générateur de contenus (serveur réel)", () => {
  let srv, db, boss, api, requests = [], A, B, editorA, adminB, readerA, pageA, pageB;
  const one = (sql, ...a) => db.prepare(sql).get(...a);
  const idOf = (c) => one("SELECT id FROM users WHERE email = ?", c.email).id;
  const M = (site) => `/marketing/site-web/sites/${site}/modules`;
  const C = (site, p = "") => `/marketing/site-web/sites/${site}/contenus${p}`;
  const post = (c, path, body) => c.request(path, { method: "POST", json: body });
  const json = (r) => JSON.parse(r.text);
  before(async () => {
    api = http.createServer((req, res) => {
      let body = ""; req.on("data", (d) => (body += d));
      req.on("end", () => {
        const r = JSON.parse(body || "{}"); requests.push({ key: req.headers["x-api-key"], body: r });
        const keys = [...String(r.messages && r.messages[0] && r.messages[0].content).matchAll(/"key":"([^"]+)"/g)].map((m) => m[1]);
        const isRevise = /variante\(s\)/.test(String(r.messages && r.messages[0] && r.messages[0].content));
        const out = isRevise ? { variants: ["Titre plus court"] } : { fields: keys.map((key) => ({ key, value: key.endsWith("/title") ? "Un titre clair" : "Un texte utile." })), seo: { title: "Un titre SEO", description: "Une description SEO assez longue pour informer le lecteur sur le contenu de la page.", focusKeyword: "titre", slug: "titre" }, questions: [] };
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ id: "msg_t", type: "message", role: "assistant", model: r.model, content: [{ type: "text", text: JSON.stringify(out) }], stop_reason: "end_turn", stop_sequence: null, usage: { input_tokens: 10, output_tokens: 20 } }));
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
    await boss.post("/marketing/pages", { name: "Page Alpha", site_id: A, kind: "page" }); await boss.post("/marketing/pages", { name: "Page Bravo", site_id: B, kind: "page" });
    const prep = (name) => { const p = one("SELECT id, draft, revision FROM mk_landing_pages WHERE name = ?", name); const d = p.draft ? JSON.parse(p.draft) : {}; d.sections = [{ id: "sechero1", type: "hero", title: "[Titre]", subtitle: "[Sous-titre]", image: "", imageAlt: "", buttonLabel: "", buttonUrl: "", style: { padding: "xl" } }, { id: "sectext1", type: "text", markdown: "[Texte]" }]; db.prepare("UPDATE mk_landing_pages SET draft = ?, revision = revision + 1 WHERE id = ?").run(JSON.stringify(d), p.id); return p.id; };
    pageA = prep("Page Alpha"); pageB = prep("Page Bravo");
  });
  after(async () => { db.close(); await srv.stop(); api.close(); });

  test("équipe : voix → génération → révision → application en brouillon ; la page contient réellement le texte, rien n'est publié", async () => {
    assert.equal((await post(boss, C(A, "/voix"), { voice: { orientations: ["premium"], address: "vous" } })).status, 200);
    assert.deepEqual(json(await boss.get(C(A, "/voix"))).voice.orientations, ["premium"]);
    const g = await post(boss, C(A, "/generer"), { pageId: pageA, context: { company: { name: "Alpha" }, language: "fr" }, pageType: "accueil" });
    assert.equal(g.status, 200, g.text.slice(0, 400)); const set = json(g).set;
    assert.equal(set.status, "proposed"); assert.equal(set.fields["sechero1/title"].value, "Un titre clair");
    assert.equal(JSON.parse(one("SELECT draft FROM mk_landing_pages WHERE id = ?", pageA).draft).sections[0].title, "[Titre]", "la proposition n'écrit rien");
    const rev = await post(boss, C(A, `/ensembles/${set.id}/reviser`), { field: "sechero1/title", op: "shorten" });
    assert.equal(rev.status, 200, rev.text.slice(0, 300)); assert.equal(json(rev).before, "Un titre clair");
    const ap = await post(boss, C(A, `/ensembles/${set.id}/appliquer`), {});
    assert.equal(ap.status, 200, ap.text.slice(0, 300));
    const d = JSON.parse(one("SELECT draft, status FROM mk_landing_pages WHERE id = ?", pageA).draft);
    assert.equal(d.sections[0].title, "Un titre clair"); assert.deepEqual(d.sections[0].style, { padding: "xl" }); assert.equal(d.seo.title, "Un titre SEO");
    assert.notEqual(one("SELECT status FROM mk_landing_pages WHERE id = ?", pageA).status, "published");
    const back = json(await boss.get(C(A, `/ensembles/${set.id}`))); assert.equal(back.set.status, "applied"); assert.ok(back.history.length >= 3);
    assert.equal((await post(boss, C(A, `/ensembles/${set.id}/annuler-application`), {})).status, 200);
    assert.equal(JSON.parse(one("SELECT draft FROM mk_landing_pages WHERE id = ?", pageA).draft).sections[0].title, "[Titre]");
  });
  test("membre de A : génère pour A ; refus pour le lecteur sans droit, pour l'administrateur de B, pour une page d'un autre site, pour un site dont le module est coupé ; aucun appel fournisseur pour un refus", async () => {
    const ok = await post(editorA, C(A, "/generer") + `?site=${A}`, { pageId: pageA, context: { company: { name: "Alpha" } }, force: true });
    assert.equal(ok.status, 200, ok.text.slice(0, 300)); const id = json(ok).set.id;
    assert.equal(one("SELECT action, site_id FROM mk_ai_requests ORDER BY id DESC LIMIT 1").site_id, A);
    const n = requests.length;
    for (const [who, r] of [["lecteur", await post(readerA, C(A, "/generer") + `?site=${A}`, { pageId: pageA })], ["adminB sur A", await post(adminB, C(A, "/generer") + `?site=${B}`, { pageId: pageA })], ["adminB lit A", await adminB.get(C(A, `/ensembles/${id}`) + `?site=${B}`)], ["page de B via A", await post(editorA, C(A, "/generer") + `?site=${A}`, { pageId: pageB })], ["adminB (module coupé)", await post(adminB, C(B, "/generer") + `?site=${B}`, { pageId: pageB, context: {} })], ["éditeur A sur B", await post(editorA, C(B, "/generer") + `?site=${A}`, { pageId: pageB })]])
      assert.ok([403, 404].includes(r.status), `${who} : ${r.status}`);
    assert.equal(requests.length, n);
    assert.equal((await boss.get(C(B, `/ensembles/${id}`))).status, 404, "l'ensemble de A est introuvable depuis B");
    await boss.post(`${M(A)}/ai`, { etat: "desactiver" });
    const off = await post(editorA, C(A, "/generer") + `?site=${A}`, { pageId: pageA, force: true });
    assert.ok([400, 403].includes(off.status), `module coupé : ${off.status}`); assert.equal(requests.length, n);
  });
  test("aucune clé ni secret dans aucune réponse ; une seule clé (celle du serveur)", async () => {
    const r = [await boss.get(C(A, "/ensembles")), await boss.get(C(A, "/voix"))];
    for (const x of r) assert.ok(!x.text.includes(KEY) && !/ANTHROPIC/.test(x.text));
    assert.ok(requests.every((q) => q.key === KEY));
  });
});
