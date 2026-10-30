// Programme 21.11 — audit de sécurité et d'isolation multisite de TOUS les moteurs du programme 21, par les adresses réelles (vrai serveur).
// Deux sites (A, B) ; un administrateur du site A tente d'atteindre ou de modifier les objets IA du site B (plan, proposition de pages, direction artistique, contenus, besoins et tâches de médias),
// par l'adresse de B, par l'adresse de A avec l'identifiant de B, et par les API transverses. Attendu : refus (403/404) et AUCUNE modification. Aucun appel IA, aucun coût.
const { describe, test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { startServer, Client, loginInstructor, newStudent } = require("./helpers");
const pages = require("../src/marketing/pages");
const gen = require("../src/pageGen");
const designGen = require("../src/designGen");
const content = require("../src/contentGen");

describe("isolation multisite des moteurs du programme 21", () => {
  let srv, boss, db, A, B, adminA, viewerA, adminB, ctxB, ids;
  const idOf = (c) => db.prepare("SELECT id FROM users WHERE email = ?").get(c.email).id;
  const snapshot = () => JSON.stringify({
    plans: db.prepare("SELECT id, status, revision, plan_json FROM mk_ai_plans ORDER BY id").all(),
    runs: db.prepare("SELECT id, status, applied FROM mk_pagegen_runs ORDER BY id").all(), design: db.prepare("SELECT id, status, applied FROM mk_design_runs ORDER BY id").all(),
    sets: db.prepare("SELECT id, status, revision, fields FROM mk_content_sets ORDER BY id").all(), tasks: db.prepare("SELECT id, status FROM mk_aimedia_tasks ORDER BY id").all(), needs: db.prepare("SELECT id, status, media_id FROM mk_aimedia_needs ORDER BY id").all(),
    pages: db.prepare("SELECT id, status, revision, sections, draft FROM mk_landing_pages ORDER BY id").all(), meta: db.prepare("SELECT media_id, tags, license FROM mk_aimedia_meta ORDER BY media_id").all(), tokens: db.prepare("SELECT id, tokens FROM mk_sites ORDER BY id").all(),
    drafts: db.prepare("SELECT site_id, changes FROM cms_customizer_drafts ORDER BY site_id").all(),
  });
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const retry = async (fn) => { for (let i = 0; i < 40; i += 1) { try { return await fn(); } catch (e) { if (!/locked|busy/i.test(String(e.message))) throw e; await sleep(400); } } return fn(); };
  before(async () => {
    srv = await startServer({ SITE_URL: "https://kolakisa.test" });
    boss = await loginInstructor(srv); db = srv.db(); db.exec("PRAGMA busy_timeout = 30000");
    const mk = async (n) => { await boss.post("/marketing/site-web/sites", { name: n }); return db.prepare("SELECT id FROM mk_sites WHERE name = ?").get(n).id; };
    A = await mk("Sécu A"); B = await mk("Sécu B");
    const member = async (site, role) => { const c = await newStudent(srv); db.prepare("INSERT INTO mk_site_members (site_id, user_id, role) VALUES (?, ?, ?)").run(site, idOf(c), role); return c; };
    adminA = await member(A, "admin"); viewerA = await member(A, "viewer"); adminB = await member(B, "admin");
    require("../src/aiMedia/store").ensureSchema(db); require("../src/pageGen").ensureSchema(db); require("../src/designGen").ensureSchema(db);
    ctxB = { db, organizationId: 1, userId: 1, settings: { get: (o, k, d) => d, set() {} } };
    // objets du site B, fabriqués par les vrais moteurs sur la vraie base du serveur
    const pg = await retry(() => pages.createPage(ctxB, { name: "Page secrète B", siteId: B, kind: "page", blank: true })); const cur = pages.requirePage(ctxB, pg.id);
    await retry(() => pages.saveDraft(ctxB, pg.id, { ...cur.working, sections: [{ type: "hero", title: "[Titre]", subtitle: "", image: "", imageAlt: "", buttonLabel: "", buttonUrl: "" }] }, { revision: cur.revision }));
    const planId = await retry(async () => Number(db.prepare("INSERT INTO mk_ai_plans (organization_id, site_id, user_id, status, brief_text, analysis_json, created_at, updated_at) VALUES (1, ?, 1, 'draft', 'brief secret B', '{}', 1, 1)").run(B).lastInsertRowid));
    const run = await retry(() => gen.generate(ctxB, B, { version: 1, site: { name: "B" }, pages: [{ name: "Autre page B", type: "autre", sections: [{ kind: "hero", title: "x" }] }] }));
    const drun = await retry(() => designGen.generate(ctxB, B, { text: "style secret", category: "entreprise" }));
    const set = await retry(() => content.generatePage(ctxB, B, { pageId: pg.id, context: { language: "fr" }, call: async () => ({ fields: content.pageFields(pages.requirePage(ctxB, pg.id), { scope: "empty" }).eligible.map((f) => ({ key: f.key, value: "Texte secret du site B" })), seo: { title: "t", description: "d", focusKeyword: "" }, questions: [] }) }));
    const media = await retry(async () => require("../src/marketing/media").saveUpload({ ...ctxB, siteFilter: B }, { buffer: require("../src/aiMedia/png").placeholder(32, 32, "b"), originalName: "secret.png", declaredType: "image/png", allow: ["image"], siteId: B }));
    await retry(async () => db.prepare("INSERT INTO mk_aimedia_needs (organization_id, site_id, need_key, page_id, page_name, section_id, widget, slot) VALUES (1, ?, ?, ?, 'Page secrète B', 'x', 'hero', 'image')").run(B, `${pg.id}:x:image`, pg.id));
    const taskId = await retry(async () => Number(db.prepare("INSERT INTO mk_aimedia_tasks (organization_id, site_id, need_key, provider, model, ratio, prompt, status, idempotency_key) VALUES (1, ?, ?, 'demo', 'placeholder-1', '3:2', 'consigne secrète de B', 'queued', 'k-b')").run(B, `${pg.id}:x:image`).lastInsertRowid));
    ids = { pageB: pg.id, planB: planId, runB: run.id, designB: drun.id, setB: set.id, mediaB: media.id, taskB: taskId, needB: `${pg.id}:x:image` };
  });
  after(() => { db.close(); return srv.stop(); });

  const get = async (c, url) => c.get(url);
  test("lecture : aucune route du programme 21 ne révèle un objet du site B à un administrateur du site A", async () => {
    const S = (rest) => `/marketing/site-web/sites/${A}${rest}`, T = (rest) => `/marketing/site-web/sites/${B}${rest}`;
    const urls = [
      `/marketing/ia/site/plans/${ids.planB}`, `/marketing/ia/studio/${ids.planB}`, `/marketing/ia/studio/${ids.planB}/etat.json`, `/marketing/ia/studio/${ids.planB}/media/bibliotheque`,
      S(`/generateur/${ids.runB}`), S(`/generateur/${ids.runB}/apercu?page=autre-page-b`), T(`/generateur/${ids.runB}`), S(`/direction-artistique/${ids.designB}`), T(`/direction-artistique/${ids.designB}`),
      S(`/contenus/ensembles/${ids.setB}`), T(`/contenus/ensembles/${ids.setB}`), S(`/medias-ia/medias/${ids.mediaB}.json`), T(`/medias-ia/medias/${ids.mediaB}.json`), T("/medias-ia"), T("/medias-ia/taches.json"), T("/generateur"), T("/direction-artistique"),
    ];
    for (const u of urls) { const r = await get(adminA, u); assert.ok([403, 404, 302].includes(r.status), `${u} → ${r.status}`); assert.ok(!/secrète|secret du site B|brief secret|consigne secrète/.test(r.text), `fuite sur ${u}`); }
    const list = await get(adminA, "/marketing/ia/studio/projets.json"); assert.ok(!list.text.includes("brief secret B"), "la liste des projets ne montre que ceux du site");
    const plans = await get(adminA, "/marketing/ia/site/plans"); assert.ok(!plans.text.includes("brief secret B"));
  });
  test("écriture : aucune action sur les objets du site B n'aboutit depuis A (ni par l'adresse de A, ni par celle de B) ; base strictement inchangée", async () => {
    const before = snapshot();
    const S = (rest) => `/marketing/site-web/sites/${A}${rest}`, T = (rest) => `/marketing/site-web/sites/${B}${rest}`;
    const posts = [
      [`/marketing/ia/site/plans/${ids.planB}/valider`, { revision: 1 }], [`/marketing/ia/site/plans/${ids.planB}/modifier`, { operation: { op: "rename_site", name: "piraté" }, revision: 1 }],
      [`/marketing/ia/studio/${ids.planB}/annuler`, {}], [`/marketing/ia/studio/${ids.planB}/assistant`, { message: "Ajoute une page Piratée" }], [`/marketing/ia/studio/${ids.planB}/publier`, {}],
      [S(`/generateur/${ids.runB}/appliquer`), { "strategie_autre-page-b": "create" }], [T(`/generateur/${ids.runB}/appliquer`), { "strategie_autre-page-b": "create" }], [S(`/generateur/${ids.runB}/annuler`), {}],
      [S(`/direction-artistique/${ids.designB}/appliquer`), { variante: "a" }], [T(`/direction-artistique/${ids.designB}/appliquer`), { variante: "a" }], [S(`/direction-artistique/${ids.designB}/annuler`), {}],
      [S(`/contenus/ensembles/${ids.setB}/modifier`), { field: "x", text: "piraté" }], [T(`/contenus/ensembles/${ids.setB}/appliquer`), {}], [S(`/contenus/ensembles/${ids.setB}/accepter`), {}],
      [S(`/medias-ia/taches/${ids.taskB}/annuler`), {}], [T(`/medias-ia/taches/${ids.taskB}/annuler`), {}], [S("/medias-ia/affecter"), { besoin: ids.needB, media: String(ids.mediaB) }], [T("/medias-ia/affecter"), { besoin: ids.needB, media: String(ids.mediaB) }],
      [S(`/medias-ia/medias/${ids.mediaB}/metadonnees`), { tags: "piraté", licence: "libre" }], [T("/medias-ia/planifier"), {}], [T("/medias-ia/generer"), { besoins: ids.needB, fournisseur: "demo" }], [T("/generateur/generer"), { plan: "{}" }], [T("/direction-artistique/generer"), { brief: "piraté" }],
    ];
    for (const [u, body] of posts) { const r = await adminA.post(u, body); assert.ok([302, 400, 401, 403, 404, 409, 422].includes(r.status), `${u} → ${r.status}`); }
    assert.equal(snapshot(), before, "aucune donnée du programme 21 n'a changé");
  });
  test("lecteur du site A : aucune écriture dans les moteurs de son propre site ; anonyme : renvoyé à la connexion", async () => {
    const before = snapshot();
    for (const u of [`/marketing/site-web/sites/${A}/generateur/generer`, `/marketing/site-web/sites/${A}/direction-artistique/generer`, `/marketing/site-web/sites/${A}/medias-ia/planifier`, `/marketing/site-web/sites/${A}/medias-ia/generer`, `/marketing/site-web/sites/${A}/contenus/generer`]) {
      const r = await viewerA.post(u, { plan: "{}", brief: "x", besoins: "1:a:image", pageId: "1" }); assert.ok([302, 401, 403, 404, 422].includes(r.status), `${u} → ${r.status}`);
    }
    assert.equal(snapshot(), before);
    for (const u of [`/marketing/ia/studio`, `/marketing/site-web/sites/${A}/medias-ia`, `/marketing/site-web/sites/${A}/generateur`]) { const r = await new Client(srv.base).get(u); assert.equal(r.status, 302, u); assert.match(r.location, /connexion/); }
  });
  test("médias : un fichier du site B n'est pas servi par l'interface de A ; clés et secrets absents des réponses des moteurs", async () => {
    const lib = await get(adminA, `/marketing/site-web/sites/${A}/medias-ia/medias.json`); assert.ok(!lib.text.includes("secret.png"));
    for (const u of [`/marketing/site-web/sites/${A}/medias-ia`, `/marketing/site-web/sites/${A}/direction-artistique`, `/marketing/site-web/sites/${A}/generateur`]) { const r = await get(adminA, u); assert.ok(!/sk-[A-Za-z0-9]{10,}|api[_-]?key["':= ]+[A-Za-z0-9]{12,}/i.test(r.text), `secret visible sur ${u}`); }
  });
});
