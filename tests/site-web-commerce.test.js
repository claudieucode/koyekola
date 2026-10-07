// Phase 11 — LMS et e-commerce : progression 10 / 50 / 90 % (100 % = formation terminée), fiche formation consultée,
// ajout au panier, page de commande ouverte (contacts connus, mesure acceptée) ; ventes réelles attribuées aux tunnels.
// Tous ces événements alimentent les automatisations, les webhooks et les segments.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { freshMarketing, addLmsSchema, TEST_KEY } = require("./marketing-helpers");
const audience = require("../src/marketing/audience");
const bridge = require("../src/marketing/bridge/events");
const auto = require("../src/marketing/automations");
const segments = require("../src/marketing/segments");
const { emitCommerceEvents } = require("../src/marketing/visitors/triggers");
const { EVENTS } = require("../src/marketing/webhooks/catalog");
const { startServer, loginInstructor, newStudent, createCourse } = require("./helpers");

const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) Chrome/120";

describe("progression dans une formation (pont du LMS)", () => {
  test("paliers 10 / 50 / 90 % une seule fois chacun ; un saut émet les paliers franchis ; 100 % = formation terminée", () => {
    const m = freshMarketing();
    addLmsSchema(m.db);
    const run = (sql, ...a) => Number(m.db.prepare(sql).run(...a).lastInsertRowid);
    const course = run("INSERT INTO courses (title, slug) VALUES ('Blender', 'blender')");
    const sec = run("INSERT INTO sections (course_id) VALUES (?)", course);
    const lessons = Array.from({ length: 10 }, (_, i) => run("INSERT INTO lessons (section_id, title) VALUES (?, ?)", sec, `L${i + 1}`));
    bridge.syncLmsEvents(m.A);
    const u = run("INSERT INTO users (username, email, role) VALUES ('eleve', 'eleve@ex.fr', 'etudiant')");
    bridge.syncLmsEvents(m.A);
    const names = () => m.db.prepare("SELECT name FROM mk_events WHERE name LIKE 'lms.course_%' ORDER BY id").all().map((e) => e.name);
    run("INSERT INTO lesson_progress (user_id, lesson_id) VALUES (?, ?)", u, lessons[0]);
    bridge.syncLmsEvents(m.A);
    assert.deepEqual(names(), ["lms.course_progress_10"]);
    for (let i = 1; i < 6; i++) run("INSERT INTO lesson_progress (user_id, lesson_id) VALUES (?, ?)", u, lessons[i]);
    bridge.syncLmsEvents(m.A); bridge.syncLmsEvents(m.A);
    assert.deepEqual(names(), ["lms.course_progress_10", "lms.course_progress_50"], "60 % : 50 % une fois, 10 % pas répété");
    for (let i = 6; i < 10; i++) run("INSERT INTO lesson_progress (user_id, lesson_id) VALUES (?, ?)", u, lessons[i]);
    bridge.syncLmsEvents(m.A);
    assert.deepEqual(names(), ["lms.course_progress_10", "lms.course_progress_50", "lms.course_progress_90", "lms.course_completed"]);
    const meta = JSON.parse(m.db.prepare("SELECT metadata FROM mk_events WHERE name = 'lms.course_progress_90'").get().metadata);
    assert.deepEqual([meta.courseId, meta.title, meta.percent], [course, "Blender", 90]);
  });

  test("catalogues : déclencheurs (avec la liste des formations), webhooks et segments", () => {
    for (const e of ["lms.course_progress_10", "lms.course_progress_50", "lms.course_progress_90", "lms.course_viewed", "lms.cart_added", "lms.checkout_started"]) {
      assert.ok(auto.TRIGGERS[e], e);
      assert.ok(EVENTS[e], e);
    }
    assert.deepEqual(auto.TRIGGERS["lms.cart_added"].filters[0], ["courseId", "Formation", "courses"]);
    const { A } = freshMarketing();
    for (const field of ["event:lms.cart_added", "event:lms.course_progress_50", "event:lms.checkout_started", "event:funnel.completed", "event:page.visited"]) {
      assert.doesNotThrow(() => segments.validateDefinition(A, { op: "and", rules: [{ field, cmp: "happened" }] }), field);
      assert.equal(segments.countSegment(A, { op: "and", rules: [{ field, cmp: "happened" }] }), 0);
    }
  });
});

describe("e-commerce depuis le suivi des visiteurs", () => {
  test("fiche consultée, ajout au panier, commande ouverte : une fois par visite ; formation inconnue ignorée", () => {
    const m = freshMarketing();
    addLmsSchema(m.db);
    m.db.exec("ALTER TABLE courses ADD COLUMN subtitle TEXT; ALTER TABLE courses ADD COLUMN price_cents INTEGER DEFAULT 0; ALTER TABLE courses ADD COLUMN thumbnail_path TEXT;");
    const course = Number(m.db.prepare("INSERT INTO courses (title, slug) VALUES ('Photoshop', 'photoshop')").run().lastInsertRowid);
    const { contact } = audience.upsertContact(m.A, { email: "achat@ex.fr" });
    const signals = [{ kind: "course", key: "photoshop" }, { kind: "cart", key: String(course) }, { kind: "checkout", key: "commande" }, { kind: "course", key: "inexistante" }];
    assert.equal(emitCommerceEvents(m.A, { contactId: contact.id, sessionId: "sessionAAAA", signals }), 3);
    emitCommerceEvents(m.A, { contactId: contact.id, sessionId: "sessionAAAA", signals });
    const rows = m.db.prepare("SELECT name, metadata FROM mk_events WHERE contact_id = ? AND name LIKE 'lms.%' ORDER BY id").all(contact.id);
    assert.deepEqual(rows.map((r) => r.name), ["lms.course_viewed", "lms.cart_added", "lms.checkout_started"]);
    assert.equal(JSON.parse(rows[1].metadata).courseId, course);
  });
});

describe("vrai serveur", () => {
  let srv, boss, db;
  before(async () => { srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "", PAIEMENT_SIMULE: "1" }); boss = await loginInstructor(srv); db = srv.db(); });
  after(() => srv.stop());
  const beacon = (vid, events, cookies = "") => fetch(`${srv.base}/w/e`, { method: "POST", headers: { "Content-Type": "application/json", cookie: `kw_consent=1; kw_vid=${vid}${cookies}`, "User-Agent": UA, Origin: srv.base }, body: JSON.stringify({ s: "sessionsession", e: events }) });

  test("bouton « Ajouter au panier » repérable ; visite → événements ; ventes réelles attribuées à l'étape « Formation » du tunnel", async () => {
    const course = await createCourse(boss, srv, { title: "Lightroom", price: 49 });
    const slug = db.prepare("SELECT slug FROM courses WHERE id = ?").get(course.id).slug;
    const student = await newStudent(srv);
    const page = (await student.get(`/cours/${slug}`)).text;
    assert.match(page, new RegExp(`data-kw-event="add_to_cart:${course.id}"`));
    // Tunnel : page de vente → formation
    const fid = Number((await boss.post("/marketing/tunnels", { name: "Vente Lightroom", template: "vente-formation" })).location.match(/(\d+)$/)[1]);
    const steps = db.prepare("SELECT * FROM mk_funnel_steps WHERE funnel_id = ? ORDER BY position").all(fid);
    db.prepare("UPDATE mk_funnel_steps SET course_id = ? WHERE id = ?").run(course.id, steps[1].id);
    db.prepare("UPDATE mk_landing_pages SET status = 'published' WHERE id = ?").run(steps[0].page_id);
    const salesSlug = db.prepare("SELECT slug FROM mk_landing_pages WHERE id = ?").get(steps[0].page_id).slug;
    // L'élève (connecté, mesure acceptée) passe par la page de vente, la fiche, le panier, la commande
    const vid = "f".repeat(32) + "." + String(Date.now() - 1000);
    const cookies = "; " + [...student.cookies].map(([k, v]) => `${k}=${v}`).join("; ");
    await beacon(vid, [{ t: "session_start", p: `/p/${salesSlug}` }, { t: "page_view", p: `/p/${salesSlug}` }], cookies);
    await beacon(vid, [{ t: "page_view", p: `/cours/${slug}` }, { t: "button_click", p: `/cours/${slug}`, x: `add_to_cart:${course.id}` }, { t: "page_view", p: "/commande" }], cookies);
    const contact = db.prepare("SELECT id FROM mk_contacts WHERE email = ?").get(student.email);
    const names = db.prepare("SELECT name FROM mk_events WHERE contact_id = ? AND name NOT IN ('contact.created', 'lms.user_registered') ORDER BY id").all(contact.id).map((e) => e.name);
    for (const n of ["page.visited", "lms.course_viewed", "lms.cart_added", "lms.checkout_started", "funnel.completed"]) assert.ok(names.includes(n), n);
    // Achat réel (paiement simulé du LMS) puis statistiques du tunnel
    await student.post(`/panier/ajouter/${course.id}`, {});
    const order = await student.post("/commande", {});
    assert.equal(order.status, 302, order.text);
    const funnelPage = (await boss.get(`/marketing/tunnels/${fid}`)).text;
    assert.match(funnelPage, /Inscriptions aux formations/);
    assert.match(funnelPage, /49,00 €/);
    assert.match(funnelPage, /1 acheteur/);
  });
});
