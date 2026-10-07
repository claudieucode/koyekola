// Tunnels (phase 8) : des étapes qui sont de VRAIES pages du moteur commun (même éditeur que Site Web) ou de vraies
// formations ; une page dans un seul tunnel actif ; étape suivante après une inscription ou par un bouton
// /etape-suivante ; statistiques par étape (tous visiteurs, et parcours mesuré avec accord), conclusion seulement avec un
// échantillon suffisant.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { TEST_KEY, freshMarketing } = require("./marketing-helpers");
const funnels = require("../src/marketing/funnels");
const { funnelReport, recommendation } = require("../src/marketing/funnels/analytics");
const pages = require("../src/marketing/pages");
const { startServer, Client, loginInstructor, createCourse } = require("./helpers");

const DAY = 86400000;
const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) Chrome/120";
const addCourses = (db) => db.exec(`CREATE TABLE courses (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT NOT NULL, slug TEXT NOT NULL, subtitle TEXT, price_cents INTEGER DEFAULT 0, thumbnail_path TEXT, published INTEGER NOT NULL DEFAULT 1);
  INSERT INTO courses (title, slug) VALUES ('Photoshop de A à Z', 'photoshop');`);
const publishRaw = (db, id) => db.prepare("UPDATE mk_landing_pages SET status = 'published' WHERE id = ?").run(id);

describe("tunnels (sans serveur)", () => {
  test("modèle : vraies pages d'étape en brouillon ; inscription = le formulaire fait avancer ; bouton provisoire → étape suivante", () => {
    const { db, A } = freshMarketing();
    const f = funnels.createFunnel(A, { name: "Guide offert", template: "aimant" });
    assert.deepEqual(f.steps.map((s) => [s.position, s.type, s.name]), [[1, "optin", "Capture"], [2, "thankyou", "Remerciement"]]);
    for (const s of f.steps) {
      const p = pages.getPage(A, s.pageId);
      assert.equal(p.kind, "step");
      assert.equal(p.status, "draft");
      assert.match(p.name, /^Guide offert — /);
    }
    const capture = pages.getPage(A, f.steps[0].pageId).working.sections;
    assert.ok(capture.some((s) => s.type === "form"));
    assert.equal(capture[0].buttonUrl, "", "page d'inscription : pas de bouton qui contourne le formulaire");
    const g = funnels.createFunnel(A, { name: "Prospects", template: "leads" });
    const pres = pages.getPage(A, g.steps[0].pageId).working.sections;
    assert.deepEqual(pres.filter((s) => s.type === "button").map((s) => [s.label, s.url]), [["Continuer", "/etape-suivante"]], "page de présentation : un bouton vers l'étape suivante");
    const vente = pages.getPage(A, funnels.addStep(A, g.id, { type: "sales", newPage: true }).pageId).working.sections;
    assert.equal(vente.find((s) => s.type === "cta").buttonUrl, "/etape-suivante", "bouton provisoire du modèle → étape suivante");
    assert.ok(!vente.some((s) => s.type === "button"), "déjà un bouton vers l'étape suivante : pas de second");
    assert.ok(!pages.getPage(A, g.steps[2].pageId).working.sections.some((s) => s.type === "button"), "remerciement : pas de bouton ajouté");
    assert.throws(() => funnels.createFunnel(A, { name: "Vente", template: "vente-formation" }), /publiez d'abord une formation/);
    assert.throws(() => funnels.createFunnel(A, { name: "Guide offert" }), /déjà ce nom/);
    assert.throws(() => funnels.createFunnel(A, { name: "X", template: "inconnu" }), /Modèle de tunnel inconnu/);
    assert.equal(funnels.getFunnel(A, 999), null);
    assert.equal(db.prepare("SELECT COUNT(*) n FROM mk_funnels WHERE organization_id = 2").get().n, 0);
  });

  test("étapes : page existante (un seul tunnel actif), formation, ordre, retrait sans effacer la page", () => {
    const { db, A, B } = freshMarketing();
    addCourses(db);
    const page = pages.createPage(A, { name: "Accueil du site", kind: "page" });
    const f = funnels.createFunnel(A, { name: "Tunnel 1" });
    funnels.addStep(A, f.id, { type: "page", pageId: page.id });
    assert.throws(() => funnels.addStep(A, f.id, { type: "page", pageId: page.id }), /déjà une étape de ce tunnel/);
    const g = funnels.createFunnel(A, { name: "Tunnel 2" });
    assert.throws(() => funnels.addStep(A, g.id, { type: "page", pageId: page.id }), /déjà une étape du tunnel « Tunnel 1 »/);
    assert.throws(() => funnels.addStep(B, f.id, { type: "page", pageId: page.id }), /Tunnel introuvable/, "autre organisation");
    funnels.addStep(A, f.id, { type: "course", courseId: 1, name: "La formation" });
    assert.throws(() => funnels.addStep(A, f.id, { type: "course", courseId: 99 }), /formation publiée/);
    assert.throws(() => funnels.addStep(A, f.id, { type: "checkout", newPage: true }), /Type d'étape inconnu/, "étapes de paiement : pas avant qu'elles existent");
    const added = funnels.addStep(A, f.id, { type: "thankyou", newPage: true });
    let steps = funnels.getFunnel(A, f.id).steps;
    assert.deepEqual(steps.map((s) => s.name), ["Page du site", "La formation", "Remerciement"]);
    assert.equal(steps[1].path, "/cours/photoshop");
    assert.equal(steps[1].live, true);
    assert.match(steps[0].problem, /pas encore en ligne/);
    funnels.moveStep(A, f.id, added.id, -1);
    steps = funnels.getFunnel(A, f.id).steps;
    assert.deepEqual(steps.map((s) => [s.position, s.name]), [[1, "Page du site"], [2, "Remerciement"], [3, "La formation"]]);
    funnels.removeStep(A, f.id, steps[0].id);
    steps = funnels.getFunnel(A, f.id).steps;
    assert.deepEqual(steps.map((s) => s.position), [1, 2]);
    assert.ok(pages.getPage(A, page.id), "la page retirée n'est pas effacée");
    funnels.addStep(A, g.id, { type: "page", pageId: page.id });
    assert.equal(funnels.getFunnel(A, g.id).steps.length, 1, "page libérée : utilisable par un autre tunnel");
  });

  test("étape suivante : seulement une étape en ligne (les autres sont sautées) ; tunnel archivé = plus d'étape suivante", () => {
    const { db, A } = freshMarketing();
    addCourses(db);
    const f = funnels.createFunnel(A, { name: "Parcours", template: "leads" });
    const [p1, p2, p3] = f.steps.map((s) => s.pageId);
    const row = (id) => db.prepare("SELECT * FROM mk_landing_pages WHERE id = ?").get(id);
    publishRaw(db, p1);
    assert.equal(funnels.nextUrlForPage(db, row(p1)), null, "aucune étape suivante en ligne");
    publishRaw(db, p3);
    assert.equal(funnels.nextUrlForPage(db, row(p1)), `/p/${row(p3).slug}`, "étape 2 hors ligne : sautée");
    publishRaw(db, p2);
    assert.equal(funnels.nextUrlForPage(db, row(p1)), `/p/${row(p2).slug}`);
    funnels.addStep(A, f.id, { type: "course", courseId: 1 });
    assert.equal(funnels.nextUrlForPage(db, row(p3)), "/cours/photoshop");
    const site = pages.createPage(A, { name: "Page du site", kind: "page" });
    publishRaw(db, site.id);
    funnels.addStep(A, f.id, { type: "page", pageId: site.id });
    const r = funnels.archiveFunnel(A, f.id);
    assert.equal(r.offline, 3, "les 3 pages créées pour le tunnel passent hors ligne");
    assert.equal(row(site.id).status, "published", "la page du site reste en ligne");
    assert.equal(funnels.nextUrlForPage(db, row(site.id)), null);
  });

  test("dupliquer : nouvelles pages (copies en brouillon), même ordre", () => {
    const { A } = freshMarketing();
    const f = funnels.createFunnel(A, { name: "Webinaire mars", template: "webinaire" });
    const c = funnels.duplicateFunnel(A, f.id);
    assert.equal(c.name, "Webinaire mars (copie)");
    assert.deepEqual(c.steps.map((s) => s.name), ["Inscription", "Confirmation"]);
    assert.ok(c.steps.every((s, i) => s.pageId && s.pageId !== f.steps[i].pageId));
    assert.ok(c.steps.every((s) => pages.getPage(A, s.pageId).kind === "step"));
  });

  test("statistiques : parcours mesuré (passé par TOUTES les étapes précédentes), tous visiteurs, plus forte perte et piste", () => {
    const { db, A } = freshMarketing();
    const f = funnels.getFunnel(A, funnels.createFunnel(A, { name: "Lettre", template: "newsletter" }).id);
    const [s1, s2] = f.steps;
    const slug = (id) => db.prepare("SELECT slug FROM mk_landing_pages WHERE id = ?").get(id).slug;
    const now = Date.now();
    const vis = db.prepare("INSERT INTO mk_web_visitors (id, organization_id, first_seen, last_seen) VALUES (?, 1, ?, ?)");
    const ev = db.prepare("INSERT INTO mk_web_events (organization_id, visitor_id, session_id, type, path, occurred_at) VALUES (1, ?, 'sessionsession', 'page_view', ?, ?)");
    const anon = db.prepare("INSERT INTO mk_landing_events (organization_id, page_id, type, visitor, occurred_at) VALUES (1, ?, ?, ?, ?)");
    const ids = [];
    for (let i = 0; i < 45; i++) {
      const id = `${String(i).padStart(32, "f")}.${now - DAY}`;
      ids.push(id);
      vis.run(id, now - DAY, now);
      if (i < 40) ev.run(id, `/p/${slug(s1.pageId)}`, now - 1000);
      if (i < 15 || i >= 40) ev.run(id, `/p/${slug(s2.pageId)}`, now - 500); // 5 arrivés directement à l'étape 2 : hors parcours
    }
    for (let i = 0; i < 70; i++) anon.run(s1.pageId, "view", `a${i}`, now - 1000);
    for (let i = 0; i < 14; i++) anon.run(s1.pageId, "signup", `a${i}`, now - 900);
    for (let i = 0; i < 20; i++) anon.run(s2.pageId, "view", `a${i}`, now - 800);
    anon.run(s1.pageId, "view", "ancien", now - 40 * DAY);
    const r = funnelReport(A, f, { days: 30 });
    assert.deepEqual(r.steps.map((s) => [s.journey, s.anonVisitors, s.signups]), [[40, 70, 14], [15, 20, 0]]);
    assert.equal(r.steps[1].passage, 37.5);
    assert.equal(r.entrants, 70);
    assert.equal(r.leads, 14);
    assert.equal(r.conversion, 20);
    assert.deepEqual([r.worst.from, r.worst.to, r.worst.lost], ["Inscription", "Bienvenue", 25]);
    assert.match(recommendation(r, f), /^62,5 % des visiteurs mesurés s'arrêtent entre « Inscription » et « Bienvenue » \(25 visiteurs\)\. Piste : la page « Inscription » demande une inscription/);
    // Échantillon insuffisant : aucune conclusion
    const del = db.prepare("DELETE FROM mk_web_events WHERE visitor_id = ?");
    ids.slice(20).forEach((v) => del.run(v));
    const r2 = funnelReport(A, f, { days: 30 });
    assert.equal(r2.worst, null);
    assert.equal(recommendation(r2, f), null);
    assert.equal(r2.enough, false);
  });
});

describe("tunnels (vrai serveur)", () => {
  let srv, boss, db;
  before(async () => { srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" }); boss = await loginInstructor(srv); db = srv.db(); });
  after(() => srv.stop());
  const idOf = (r) => Number(r.location.match(/(\d+)(#.*)?$/)[1]);

  test("menu « Tunnels », liste, création depuis un modèle, page du tunnel, lien depuis la page", async () => {
    const home = (await boss.get("/marketing")).text;
    assert.match(home, /href="\/marketing\/tunnels"/);
    const list = (await boss.get("/marketing/tunnels")).text;
    assert.match(list, /Aucun tunnel/);
    assert.match(list, /name="template" value="aimant"/);
    assert.match(list, /value="vente-formation" disabled/, "sans formation publiée : modèle indisponible");
    const r = await boss.post("/marketing/tunnels", { name: "Guide Photoshop", template: "aimant" });
    const id = idOf(r);
    const page = (await boss.get(`/marketing/tunnels/${id}`)).text;
    assert.match(page, /Capture/);
    assert.match(page, /Remerciement/);
    assert.match(page, /Page pas encore en ligne/);
    assert.match(page, /Pas encore assez de données|Les résultats apparaîtront/);
    const stepPage = db.prepare("SELECT page_id FROM mk_funnel_steps WHERE funnel_id = ? ORDER BY position").get(id).page_id;
    assert.match((await boss.get(`/marketing/pages/${stepPage}`)).text, new RegExp(`Étape de tunnel : <a href="/marketing/tunnels/${id}#fn-steps">Guide Photoshop</a>`));
    assert.match((await boss.get("/marketing/tunnels")).text, /Guide Photoshop/);
  });

  test("mise en ligne : contrôles de publication de chaque page ; parcours public : inscription → étape suivante, bouton /etape-suivante", async () => {
    const id = idOf(await boss.post("/marketing/tunnels", { name: "Lettre hebdo", template: "newsletter" }));
    const [s1, s2] = db.prepare("SELECT page_id FROM mk_funnel_steps WHERE funnel_id = ? ORDER BY position").all(id).map((r) => r.page_id);
    await boss.post(`/marketing/tunnels/${id}/publier`, {});
    let shown = (await boss.get(`/marketing/tunnels/${id}`)).text;
    assert.match(shown, /Pas encore prêtes : « Inscription »/);
    assert.match(shown, /Mises en ligne : Bienvenue/);
    // Formulaire publié, relié à la page d'inscription
    const formId = idOf(await boss.post("/marketing/formulaires", { name: "Lettre hebdo", consentText: "Oui, je veux la lettre KOLAKISA." }));
    db.prepare("UPDATE mk_forms SET double_optin = 0 WHERE id = ?").run(formId);
    await boss.post(`/marketing/formulaires/${formId}/publier`, {});
    db.prepare("UPDATE mk_landing_pages SET form_id = ? WHERE id = ?").run(formId, s1);
    await boss.post(`/marketing/tunnels/${id}/publier`, {});
    shown = (await boss.get(`/marketing/tunnels/${id}`)).text;
    assert.match(shown, /Mises en ligne : Inscription/);
    const [slug1, slug2] = [s1, s2].map((p) => db.prepare("SELECT slug FROM mk_landing_pages WHERE id = ?").get(p).slug);
    const visitor = new Client(srv.base);
    const html = (await visitor.get(`/p/${slug1}`, { headers: { "User-Agent": UA } })).text;
    assert.match(html, /action="\/p\/[^"]+\/inscription"/);
    const res = await visitor.post(`/p/${slug1}/inscription`, { ft: srv.formToken(), email: "lettre@ex.fr", consent: "1" });
    assert.equal(res.status, 302);
    assert.equal(res.location, `/p/${slug2}?inscrit=1`, "conduit à l'étape suivante");
    const thanks = (await visitor.get(res.location, { headers: { "User-Agent": UA } })).text;
    assert.match(thanks, /class="lp-thanks" role="status">Merci, votre inscription est enregistrée\./);
    assert.equal(db.prepare("SELECT COUNT(*) n FROM mk_landing_events WHERE page_id = ? AND type = 'view'").get(s2).n, 1, "la page de remerciement compte une visite");
    // Bouton « étape suivante » sur la 1re page
    const sec = JSON.parse(db.prepare("SELECT sections FROM mk_landing_pages WHERE id = ?").get(s1).sections);
    sec.splice(1, 0, { id: "nextbtn00001", type: "button", label: "Continuer", url: "/etape-suivante", align: "center" });
    db.prepare("UPDATE mk_landing_pages SET sections = ? WHERE id = ?").run(JSON.stringify(sec), s1);
    const page1 = (await new Client(srv.base).get(`/p/${slug1}`, { headers: { "User-Agent": UA } })).text;
    const clic = page1.match(/href="(\/p\/[^"]+\/clic\/\d+)"[^>]*>Continuer/)[1];
    const go = await new Client(srv.base).get(clic, { headers: { "User-Agent": UA } });
    assert.equal(go.location, `/p/${slug2}`);
  });

  test("étapes à la main : page existante, formation, ordre, retrait ; archivage et restauration", async () => {
    const course = await createCourse(boss, srv, { title: "Lightroom pour débuter", price: 0 });
    const id = idOf(await boss.post("/marketing/tunnels", { name: "À la main" }));
    assert.match((await boss.get(`/marketing/tunnels/${id}`)).text, /n'a pas encore d'étape/);
    const pid = idOf(await boss.post("/marketing/pages", { name: "Présentation libre" }));
    await boss.post(`/marketing/tunnels/${id}/etapes`, { type: "landing", name: "Présentation", source: "existante", page_id: String(pid) });
    await boss.post(`/marketing/tunnels/${id}/etapes`, { type: "course", course_id: String(course.id), source: "nouvelle" });
    await boss.post(`/marketing/tunnels/${id}/etapes`, { type: "thankyou", name: "Merci", source: "nouvelle" });
    let steps = db.prepare("SELECT id, name, page_id, course_id FROM mk_funnel_steps WHERE funnel_id = ? ORDER BY position").all(id);
    assert.deepEqual(steps.map((s) => s.name), ["Présentation", "Formation (LMS)", "Merci"]);
    assert.equal(steps[0].page_id, pid);
    assert.equal(steps[1].course_id, course.id);
    await boss.post(`/marketing/tunnels/${id}/etapes/${steps[2].id}/monter`, {});
    await boss.post(`/marketing/tunnels/${id}/etapes/${steps[0].id}`, { name: "Découverte" });
    steps = db.prepare("SELECT id, name FROM mk_funnel_steps WHERE funnel_id = ? ORDER BY position").all(id);
    assert.deepEqual(steps.map((s) => s.name), ["Découverte", "Merci", "Formation (LMS)"]);
    // La même page dans un 2e tunnel : refusée avec un message clair
    const other = idOf(await boss.post("/marketing/tunnels", { name: "Autre" }));
    await boss.post(`/marketing/tunnels/${other}/etapes`, { type: "landing", source: "existante", page_id: String(pid) });
    assert.match((await boss.get(`/marketing/tunnels/${other}`)).text, /déjà une étape du tunnel « À la main »/);
    await boss.post(`/marketing/tunnels/${id}/etapes/${steps[0].id}/retirer`, {});
    assert.ok(db.prepare("SELECT 1 FROM mk_landing_pages WHERE id = ?").get(pid), "page conservée");
    await boss.post(`/marketing/tunnels/${id}/archiver`, {});
    assert.match((await boss.get("/marketing/tunnels?vue=archives")).text, /À la main/);
    await boss.post(`/marketing/tunnels/${id}/restaurer`, {});
    assert.equal(db.prepare("SELECT status FROM mk_funnels WHERE id = ?").get(id).status, "active");
  });
});
