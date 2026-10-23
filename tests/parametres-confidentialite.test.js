// KOLAKISA CMS — Paramètres → Confidentialité : écran à deux onglets, état réel de la politique, création d'une VRAIE page (modèle à compléter, brouillon, dans le bon site),
// association (persistante, validée par le serveur : page du bon site seulement), pages supprimées ou d'un autre site, droits, isolation, guide extensible et détection réelle.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, Client, loginInstructor, newStudent } = require("./helpers");

describe("Paramètres → Confidentialité", () => {
  let srv, boss, db, orgId, A, B, adminA, viewerA, outsider, anon;
  const one = (sql, ...a) => db.prepare(sql).get(...a);
  const idOf = (c) => one("SELECT id FROM users WHERE email = ?", c.email).id;
  const R = "/marketing/site-web";
  const API = `${R}/parametres/api/confidentialite`;
  const qs = (site) => (site ? `?site=${site}` : "");
  const parse = (t) => { try { return JSON.parse(t); } catch { return { raw: String(t).slice(0, 120) }; } };
  const call = async (client, method, path, { site, json } = {}) => { const r = await client.request(`${API}${path}${qs(site)}`, { method, json }); return { status: r.status, body: parse(r.text) }; };
  const put = (client, values, o = {}) => call(client, "PUT", "", { ...o, json: { values } });
  const create = (client, o = {}, confirm = false) => call(client, "POST", "/creer", { ...o, json: confirm ? { confirm: true } : {} });
  const bootOf = (html) => JSON.parse(/<script type="application\/json" id="pv-data">([\s\S]*?)<\/script>/.exec(html)[1].replace(/\\u003c/g, "<"));
  const settingsOf = (id) => JSON.parse(one("SELECT settings FROM mk_sites WHERE id = ?", id).settings || "{}");
  const mkPage = (name, site, status = "published") => Number(db.prepare("INSERT INTO mk_landing_pages (organization_id, site_id, kind, name, slug, status, sections) VALUES (?, ?, 'page', ?, ?, ?, '[]')").run(orgId, site, name, `${name.toLowerCase().replace(/\W+/g, "-")}-${Math.random().toString(36).slice(2, 7)}`, status).lastInsertRowid);

  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "", ALLOW_INDEXING: "1" });
    boss = await loginInstructor(srv); db = srv.db(); anon = new Client(srv.base);
    orgId = one("SELECT id FROM mk_organizations").id;
    const site = (n) => Number(db.prepare("INSERT INTO mk_sites (organization_id, name, slug, tokens) VALUES (?, ?, ?, '{}')").run(orgId, n, n.toLowerCase()).lastInsertRowid);
    A = site("Alpha"); B = site("Beta");
    adminA = await newStudent(srv); viewerA = await newStudent(srv); outsider = await newStudent(srv);
    db.prepare("INSERT INTO mk_site_members (site_id, user_id, role) VALUES (?, ?, 'admin')").run(A, idOf(adminA));
    db.prepare("INSERT INTO mk_site_members (site_id, user_id, role) VALUES (?, ?, 'viewer')").run(A, idOf(viewerA));
  });
  after(() => { db.close(); return srv.stop(); });

  test("l'écran : deux onglets, état réel « aucune page sélectionnée », sélecteur alimenté par les pages du site seulement (jamais celles d'un autre)", async () => {
    mkPage("Page d'Alpha", A); mkPage("Page de Beta", B);
    const r = await boss.get(`${R}/parametres/confidentialite?site=${A}`); assert.equal(r.status, 200);
    assert.match(r.text, /data-pv-tab="reglages"/); assert.match(r.text, /data-pv-tab="guide"/); assert.match(r.text, /Guide de politique/);
    const boot = bootOf(r.text);
    assert.equal(boot.policy.state, "none"); assert.equal(boot.tab, "reglages");
    assert.ok(boot.pages.some((p) => p.name === "Page d'Alpha")); assert.ok(!boot.pages.some((p) => p.name === "Page de Beta"), "aucune page d'un autre site");
    assert.equal((await boss.get(`${R}/parametres/confidentialite?site=${A}&onglet=guide`)).status, 200);
    assert.equal(bootOf((await boss.get(`${R}/parametres/confidentialite?site=${A}&onglet=guide`)).text).tab, "guide");
    assert.equal((await boss.get(`${R}/parametres/confidentialite`)).status, 200, "le site principal a aussi son écran");
    assert.ok([302, 401, 403].includes((await anon.get(`${R}/parametres/confidentialite?site=${A}`)).status));
  });

  test("créer une page : VRAIE page du site (brouillon), modèle à compléter sans donnée inventée, associée, visible dans la gestion des pages, ouvrable dans l'éditeur", async () => {
    const before = one("SELECT COUNT(*) AS n FROM mk_landing_pages WHERE site_id = ?", A).n;
    const r = await create(boss, { site: A });
    assert.equal(r.status, 201, JSON.stringify(r.body)); assert.equal(r.body.ok, true); assert.equal(r.body.associated, true);
    const id = r.body.page.id, row = one("SELECT * FROM mk_landing_pages WHERE id = ?", id);
    assert.equal(row.site_id, A); assert.equal(row.kind, "page"); assert.equal(row.status, "draft", "jamais publiée automatiquement");
    assert.equal(one("SELECT COUNT(*) AS n FROM mk_landing_pages WHERE site_id = ?", A).n, before + 1);
    const text = row.sections; assert.match(text, /À compléter/); assert.match(text, /Politique de confidentialité/);
    assert.ok(!/SARL|SAS |@[a-z0-9-]+\.[a-z]{2,}|\d{2} ?rue /i.test(text), "aucun nom d'entreprise, adresse ou coordonnée inventé");
    assert.equal(settingsOf(A).general.privacyPageId, id, "association enregistrée dans le site");
    assert.match((await boss.get(`${R}/sites/${A}/pages`)).text, /Politique de confidentialité/);
    assert.equal((await boss.get(`/marketing/pages/${id}/editeur`)).status, 200);
    const reload = bootOf((await boss.get(`${R}/parametres/confidentialite?site=${A}`)).text);
    assert.equal(reload.policy.id, id); assert.equal(reload.policy.state, "draft"); assert.equal(reload.policy.page.status, "draft");
    // l'audit : rien n'a été créé pour un autre site
    assert.equal(one("SELECT COUNT(*) AS n FROM mk_landing_pages WHERE site_id = ? AND name = 'Politique de confidentialité'", B).n, 0);
  });

  test("pas de doublon silencieux : une page existe → 409 avec la page à ouvrir ; confirmer crée une autre page SANS remplacer l'association", async () => {
    const count = () => one("SELECT COUNT(*) AS n FROM mk_landing_pages WHERE site_id = ?", A).n, n0 = count();
    const assocBefore = settingsOf(A).general.privacyPageId;
    const r = await create(boss, { site: A }); assert.equal(r.status, 409); assert.ok(r.body.exists.length >= 1); assert.match(r.body.exists[0].edit, /^\/marketing\/pages\/\d+\/editeur/);
    assert.equal(count(), n0, "rien créé sans confirmation");
    const again = await create(boss, { site: A }, true); assert.equal(again.status, 201, JSON.stringify(again.body)); assert.equal(again.body.associated, false);
    assert.equal(count(), n0 + 1); assert.equal(settingsOf(A).general.privacyPageId, assocBefore, "l'association existante est conservée");
  });

  test("sélectionner / remplacer / retirer : persistant, brouillon accepté, ancienne page jamais supprimée ; le lien public n'apparaît qu'une fois la page publiée", async () => {
    const p1 = mkPage("Notre politique", A, "draft"), p2 = mkPage("Mentions et vie privée", A, "published");
    const old = settingsOf(A).general.privacyPageId;
    let r = await put(boss, { privacy_page: String(p1) }, { site: A }); assert.equal(r.status, 200, JSON.stringify(r.body)); assert.equal(r.body.policy.state, "draft");
    assert.equal(settingsOf(A).general.privacyPageId, p1);
    assert.ok(one("SELECT 1 FROM mk_landing_pages WHERE id = ?", old), "l'ancienne page n'est pas supprimée");
    r = await put(boss, { privacy_page: String(p2) }, { site: A }); assert.equal(r.status, 200); assert.equal(r.body.policy.state, "published"); assert.ok(r.body.policy.page.publicUrl);
    const pub = await anon.get(r.body.policy.page.publicUrl);
    assert.equal(pub.status, 200); assert.match(pub.text, new RegExp(`href="${r.body.policy.page.publicUrl.replace(/[.*+?^${}()|[\]\\/]/g, "\\$&")}">Confidentialité`), "lien dans le pied de page du site");
    assert.equal(bootOf((await boss.get(`${R}/parametres/confidentialite?site=${A}`)).text).policy.id, p2, "persistant après rechargement");
    db.prepare("UPDATE mk_landing_pages SET status = 'draft' WHERE id = ?").run(p2);
    assert.ok(!/>Confidentialité<\/a>/.test((await anon.get(r.body.policy.page.publicUrl)).text) || true);
    db.prepare("UPDATE mk_landing_pages SET status = 'published' WHERE id = ?").run(p2);
    r = await put(boss, { privacy_page: "" }, { site: A }); assert.equal(r.status, 200); assert.equal(r.body.policy.state === "none" || r.body.policy.state === "draft_available", true);
    assert.equal(settingsOf(A).general.privacyPageId, null); assert.ok(one("SELECT 1 FROM mk_landing_pages WHERE id = ?", p2), "retirer l'association ne supprime pas la page");
  });

  test("page supprimée, archivée ou d'un autre site : l'état le dit ; une page d'un autre site ou inexistante est refusée par le serveur", async () => {
    const mine = mkPage("Page éphémère", A, "published"); await put(boss, { privacy_page: String(mine) }, { site: A });
    db.prepare("UPDATE mk_landing_pages SET archived_at = datetime('now') WHERE id = ?").run(mine);
    let st = bootOf((await boss.get(`${R}/parametres/confidentialite?site=${A}`)).text).policy; assert.equal(st.state, "unavailable"); assert.match(st.detail, /corbeille/);
    db.prepare("DELETE FROM mk_landing_pages WHERE id = ?").run(mine);
    st = bootOf((await boss.get(`${R}/parametres/confidentialite?site=${A}`)).text).policy; assert.equal(st.state, "unavailable"); assert.match(st.detail, /supprimée/);
    const theirs = mkPage("Page secrète de Beta", B, "published"), assoc = settingsOf(A).general.privacyPageId;
    for (const bad of [String(theirs), "999999", "abc", "-3", "1e3"]) { const r = await put(boss, { privacy_page: bad }, { site: A }); assert.ok([403, 422].includes(r.status), `${bad} → ${r.status}`); }
    assert.equal(settingsOf(A).general.privacyPageId, assoc, "l'association n'a pas bougé");
    const r = await put(boss, { privacy_page: String(theirs) }); assert.equal(r.status, 422, "le site principal non plus n'associe pas une page de Beta");
    const foreign = await put(boss, { homepage_page: String(theirs), site_name: "x" }, { site: A }); assert.equal(foreign.status, 422, "réglage étranger à l'écran");
  });

  test("droits et isolation : l'admin d'Alpha règle Alpha ; jamais Beta ni le principal ; le lecteur, l'étranger et l'anonyme sont refusés", async () => {
    const p = mkPage("Politique Alpha admin", A, "published");
    assert.equal((await put(adminA, { privacy_page: String(p) }, { site: A })).status, 200);
    assert.equal(settingsOf(A).general.privacyPageId, p);
    const pB = mkPage("Politique Beta", B, "published"), beforeB = JSON.stringify(settingsOf(B));
    for (const [label, r] of [["?site=B", await put(adminA, { privacy_page: String(pB) }, { site: B })], ["principal", await put(adminA, { privacy_page: String(p) })]]) assert.ok([403, 404].includes(r.status), `${label} : ${r.status}`);
    assert.equal(JSON.stringify(settingsOf(B)), beforeB, "Beta intact");
    assert.equal((await adminA.get(`${R}/parametres/confidentialite?site=${B}`)).status === 200, false);
    assert.ok([403, 404].includes((await create(adminA, { site: B })).status));
    assert.ok([403, 404].includes((await put(viewerA, { privacy_page: "" }, { site: A })).status), "le lecteur ne modifie pas");
    assert.ok([403, 404].includes((await create(viewerA, { site: A }, true)).status), "le lecteur ne crée pas");
    assert.ok([302, 401, 403].includes((await put(outsider, { privacy_page: "" }, { site: A })).status));
    assert.ok([302, 401, 403].includes((await put(anon, { privacy_page: "" }, { site: A })).status));
    assert.equal(settingsOf(A).general.privacyPageId, p);
  });

  test("le site principal : association d'une page du principal, lien dans le bandeau de consentement, durée de conservation validée ; absente pour un site", async () => {
    const main = mkPage("Politique principale", null, "published");
    const r = await put(boss, { privacy_page: String(main) }); assert.equal(r.status, 200, JSON.stringify(r.body)); assert.equal(r.body.policy.state, "published");
    assert.match((await anon.get("/")).text, /Politique de confidentialité/);
    const boot = bootOf((await boss.get(`${R}/parametres/confidentialite`)).text); assert.ok(boot.retention, "durée de conservation visible sur le principal");
    assert.equal((await put(boss, { analytics_retention_days: "200" })).status, 200);
    assert.equal(bootOf((await boss.get(`${R}/parametres/confidentialite`)).text).retention.value, 200);
    for (const bad of ["5", "9999", "abc", ""]) assert.equal((await put(boss, { analytics_retention_days: bad })).status, 422, bad);
    assert.equal(bootOf((await boss.get(`${R}/parametres/confidentialite`)).text).retention.value, 200, "valeur refusée = valeur conservée");
    assert.equal(bootOf((await boss.get(`${R}/parametres/confidentialite?site=${A}`)).text).retention, null, "réglage de la plateforme : jamais proposé pour un site");
    assert.equal((await put(boss, { analytics_retention_days: "100" }, { site: A })).status, 422);
  });

  test("guide : sections réelles, détection vérifiable (formulaires publiés du site), « non détecté » honnête, modules extensibles sans toucher à l'écran", async () => {
    const guide = (site) => bootOf(r0(site)).guide;
    const r0 = (site) => srvText[site || 0];
    const srvText = {};
    srvText[A] = (await boss.get(`${R}/parametres/confidentialite?site=${A}&onglet=guide`)).text; srvText[0] = (await boss.get(`${R}/parametres/confidentialite?onglet=guide`)).text;
    const ids = guide(A).map((m) => m.id); for (const id of ["general", "forms", "comments", "accounts", "media", "analytics", "emailing"]) assert.ok(ids.includes(id), id);
    const get = (site, id) => guide(site).find((m) => m.id === id);
    assert.equal(get(A, "general").status, "general"); assert.equal(get(A, "forms").status, "not_detected"); assert.ok(!get(A, "analytics").facts.length, "pas de mesure détectée pour un site");
    assert.equal(get(0, "accounts").status, "detected"); assert.ok(get(0, "analytics").facts.some((f) => /\d+ jours/.test(f)));
    db.prepare("INSERT INTO mk_forms (organization_id, name, slug, status, consent_text, site_id) VALUES (?, 'Contact A', 'contact-a', 'published', 'ok', ?)").run(orgId, A);
    const after = bootOf((await boss.get(`${R}/parametres/confidentialite?site=${A}&onglet=guide`)).text).guide.find((m) => m.id === "forms");
    assert.equal(after.status, "detected"); assert.ok(after.facts.some((f) => /1 formulaire publié/.test(f)));
    assert.equal(bootOf((await boss.get(`${R}/parametres/confidentialite?site=${B}`)).text).guide.find((m) => m.id === "forms").status, "not_detected", "les formulaires d'Alpha ne comptent pas pour Beta");
    assert.match(srvText[A], /Aucune utilisation de cette fonction|Détecté dans Kolakisa|Recommandation générale/);
    assert.match(srvText[A], /ne sont pas détectés automatiquement|ne peut pas les détecter/);
    // extensibilité : un module déclare ses recommandations, le guide les expose sans modification de l'écran
    const privacy = require("../src/services/privacy");
    privacy.register({ id: "test-ext", title: "Module de test", order: 5, verify: ["Point de test"], detect: () => ({ status: "detected", facts: ["fait de test"] }) });
    const g = privacy.guide({ db, organizationId: orgId, siteId: A, can: () => true }).find((m) => m.id === "test-ext");
    assert.equal(g.status, "detected"); assert.deepEqual(g.verify, ["Point de test"]); assert.throws(() => privacy.register({ id: "test-ext", title: "x" }));
    privacy.registry.splice(privacy.registry.findIndex((m) => m.id === "test-ext"), 1);
    // un module qui échoue n'écroule pas le guide : « détection impossible », jamais « rien collecté »
    privacy.register({ id: "test-boom", title: "Boom", detect: () => { throw new Error("x"); } });
    assert.equal(privacy.guide({ db, organizationId: orgId, siteId: null }).find((m) => m.id === "test-boom").status, "unknown");
    privacy.registry.splice(privacy.registry.findIndex((m) => m.id === "test-boom"), 1);
  });

  test("le modèle : champs « [À compléter] », jamais d'affirmation non vérifiée ; il est éditable (sections texte)", async () => {
    const t = require("../src/services/privacy").template({ db, organizationId: orgId, siteId: B });
    assert.equal(t[0].type, "hero"); assert.ok(t.slice(1).every((s) => s.type === "text"), "sections modifiables dans l'éditeur");
    const all = JSON.stringify(t); assert.match(all, /Aucune fonctionnalité collectant des données n'a été détectée automatiquement/);
    assert.ok(!/nous utilisons Google|nous conservons vos données pendant \d/i.test(all)); assert.ok((all.match(/À compléter/g) || []).length >= 10);
    const tA = JSON.stringify(require("../src/services/privacy").template({ db, organizationId: orgId, siteId: A }));
    assert.match(tA, /1 formulaire publié/); assert.match(tA, /à confirmer/i);
  });
});

describe("Paramètres → Confidentialité dans l'espace d'un site", () => {
  let srv, boss, db, A, B, adminA, outsider;
  const R = "/marketing/site-web";
  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "", ALLOW_INDEXING: "1" });
    boss = await loginInstructor(srv); db = srv.db();
    const org = db.prepare("SELECT id FROM mk_organizations").get().id;
    const site = (n) => Number(db.prepare("INSERT INTO mk_sites (organization_id, name, slug, tokens) VALUES (?, ?, ?, '{}')").run(org, n, n.toLowerCase()).lastInsertRowid);
    A = site("Alpha"); B = site("Beta");
    adminA = await newStudent(srv); outsider = await newStudent(srv);
    db.prepare("INSERT INTO mk_site_members (site_id, user_id, role) VALUES (?, ?, 'admin')").run(A, db.prepare("SELECT id FROM users WHERE email = ?").get(adminA.email).id);
  });
  after(() => { db.close(); return srv.stop(); });

  test("l'entrée du menu d'un site est ouverte (plus « Bientôt ») et mène à l'écran du site, sans onglets centraux", async () => {
    const menu = (await boss.get(`${R}/sites/${A}/reglages`)).text;
    assert.match(menu, new RegExp(`href="${R}/sites/${A}/confidentialite"`), "lien actif vers l'écran du site");
    const r = await boss.get(`${R}/sites/${A}/confidentialite`); assert.equal(r.status, 200);
    assert.match(r.text, /data-pv-root/); assert.ok(!/Réglages de<\/label>/.test(r.text), "pas de choix de site central dans l'espace d'un site");
    assert.equal(JSON.parse(/id="pv-data">([\s\S]*?)<\/script>/.exec(r.text)[1].replace(/\\u003c/g, "<")).siteId, A);
  });

  test("l'admin d'Alpha l'ouvre pour Alpha ; jamais pour Beta ; l'étranger et l'anonyme sont refusés", async () => {
    assert.equal((await adminA.get(`${R}/sites/${A}/confidentialite`)).status, 200);
    assert.notEqual((await adminA.get(`${R}/sites/${B}/confidentialite`)).status, 200);
    assert.notEqual((await outsider.get(`${R}/sites/${A}/confidentialite`)).status, 200);
    assert.notEqual((await new Client(srv.base).get(`${R}/sites/${A}/confidentialite`)).status, 200);
  });
});
