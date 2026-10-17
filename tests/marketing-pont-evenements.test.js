// Marketing M4a — pont LMS → événements : lecture idempotente par curseurs, sans modifier le LMS, sans rejouer l'historique.
const { test, describe, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const { freshMarketing, addLmsSchema, T0, quiet } = require("./marketing-helpers");
const audience = require("../src/marketing/audience");
const bridge = require("../src/marketing/bridge/events");
const { createWorker } = require("../src/marketing/queue/worker");
const templates = require("../src/marketing/templates");

let m, A, B, ids;
const run = (sql, ...a) => Number(m.db.prepare(sql).run(...a).lastInsertRowid);
const events = (name) => m.db.prepare(`SELECT * FROM mk_events${name ? " WHERE name = ?" : ""} ORDER BY id`).all(...(name ? [name] : [])).map((e) => ({ ...e, metadata: JSON.parse(e.metadata) }));
const sync = (ctx = A, opts) => bridge.syncLmsEvents(ctx, opts);
const user = (name, role = "etudiant") => run("INSERT INTO users (username, email, role) VALUES (?, ?, ?)", name, `${name}@ex.fr`, role);

beforeEach(() => {
  m = freshMarketing(); A = m.A; B = m.B;
  addLmsSchema(m.db);
  const course = run("INSERT INTO courses (title, slug) VALUES ('Final Cut Pro', 'final-cut-pro')");
  const sec = run("INSERT INTO sections (course_id) VALUES (?)", course);
  const l1 = run("INSERT INTO lessons (section_id, title) VALUES (?, 'Interface')", sec);
  const l2 = run("INSERT INTO lessons (section_id, title) VALUES (?, 'Montage')", sec);
  ids = { course, l1, l2 };
});

describe("initialisation : l'historique ne déclenche rien", () => {
  test("la première lecture pose les curseurs et n'émet AUCUN événement, même avec des données existantes", () => {
    const u = user("ancien");
    run("INSERT INTO orders (user_id, total_cents) VALUES (?, 2900)", u);
    run("INSERT INTO enrollments (user_id, course_id) VALUES (?, ?)", u, ids.course);
    const r = sync();
    assert.deepEqual(r.initialized.sort(), ["enrollments", "favorites", "lesson_progress", "order_refunds", "orders", "reviews", "users"]);
    assert.equal(events().length, 0);
    assert.equal(m.db.prepare("SELECT COUNT(*) n FROM mk_bridge_cursors").get().n, 7);
  });
  test("ensuite, seul ce qui arrive APRÈS compte", () => {
    user("ancien");
    sync();
    const u = user("nouvelle");
    const r = sync();
    assert.equal(r.emitted.users, 1);
    assert.deepEqual(events().map((e) => e.name), ["lms.user_registered"]);
  });
  test("curseur en avance sur la table (base réinitialisée par « npm run seed ») : recalé, sans blocage", () => {
    user("a"); user("b");
    sync();
    m.db.exec("DELETE FROM users; DELETE FROM sqlite_sequence WHERE name = 'users'");
    const u = user("apres-seed");
    sync();
    const u2 = user("suivant");
    assert.equal(sync().emitted.users, 1, "les nouveaux utilisateurs sont vus à nouveau");
    assert.ok(u && u2);
  });
});

describe("événements émis", () => {
  beforeEach(() => sync()); // initialise
  test("inscription : événement avec contact ; les comptes formateur sont ignorés ; e-mail invalide ignoré sans bloquer", () => {
    const s = user("eleve");
    user("prof", "formateur");
    run("INSERT INTO users (username, email, role) VALUES ('casse', 'pas-un-email', 'etudiant')");
    const after = user("apres");
    sync();
    const ev = events("lms.user_registered");
    assert.deepEqual(ev.map((e) => e.email), ["eleve@ex.fr", "apres@ex.fr"]);
    assert.equal(ev[0].contact_id, audience.findByEmail(A, "eleve@ex.fr").id);
    assert.deepEqual([ev[0].source, ev[0].metadata.userId], ["lms", s]);
    assert.ok(after);
    assert.equal(sync().emitted.users ?? 0, 0, "curseur avancé : rien à relire");
  });
  test("commande : montant, formations, numéro ; une inscription par formation", () => {
    const u = user("acheteuse"); sync();
    const o = run("INSERT INTO orders (user_id, total_cents) VALUES (?, 4900)", u);
    run("INSERT INTO order_items (order_id, course_id, price_cents) VALUES (?, ?, 4900)", o, ids.course);
    run("INSERT INTO enrollments (user_id, course_id) VALUES (?, ?)", u, ids.course);
    sync();
    const [ev] = events("lms.order_completed");
    assert.deepEqual([ev.metadata.orderId, ev.metadata.totalCents], [o, 4900]);
    assert.deepEqual(ev.metadata.items, [{ courseId: ids.course, title: "Final Cut Pro", priceCents: 4900 }]);
    assert.equal(ev.metadata.courseTitle, "Final Cut Pro");
    const [en] = events("lms.course_enrolled");
    assert.deepEqual([en.metadata.courseId, en.metadata.title, en.metadata.slug], [ids.course, "Final Cut Pro", "final-cut-pro"]);
  });
  test("commande de plusieurs formations : titre résumé", () => {
    const u = user("multi"); sync();
    const c2 = run("INSERT INTO courses (title, slug) VALUES ('Motion', 'motion')");
    const o = run("INSERT INTO orders (user_id, total_cents) VALUES (?, 9000)", u);
    run("INSERT INTO order_items (order_id, course_id, price_cents) VALUES (?, ?, 4500), (?, ?, 4500)", o, ids.course, o, c2);
    sync();
    assert.equal(events("lms.order_completed")[0].metadata.courseTitle, "2 formations");
  });
  test("leçon terminée ; formation terminée UNE seule fois, quand la dernière leçon est faite", () => {
    const u = user("eleve2"); sync();
    run("INSERT INTO lesson_progress (user_id, lesson_id) VALUES (?, ?)", u, ids.l1);
    sync();
    assert.equal(events("lms.lesson_completed").length, 1);
    assert.equal(events("lms.course_completed").length, 0);
    run("INSERT INTO lesson_progress (user_id, lesson_id) VALUES (?, ?)", u, ids.l2);
    sync(); sync();
    assert.equal(events("lms.lesson_completed").length, 2);
    const done = events("lms.course_completed");
    assert.equal(done.length, 1);
    assert.deepEqual([done[0].metadata.courseId, done[0].metadata.title], [ids.course, "Final Cut Pro"]);
  });
  test("avis et favori", () => {
    const u = user("critique"); sync();
    run("INSERT INTO reviews (course_id, user_id, rating) VALUES (?, ?, 5)", ids.course, u);
    run("INSERT INTO favorites (user_id, course_id) VALUES (?, ?)", u, ids.course);
    sync();
    assert.equal(events("lms.review_posted")[0].metadata.rating, 5);
    assert.equal(events("lms.favorite_added")[0].metadata.courseId, ids.course);
  });
  test("aucun événement pour un utilisateur sans contact (adresse invalide), mais le curseur avance", () => {
    const bad = run("INSERT INTO users (username, email, role) VALUES ('sans', 'pas-un-email', 'etudiant')");
    sync();
    run("INSERT INTO enrollments (user_id, course_id) VALUES (?, ?)", bad, ids.course);
    const r = sync();
    assert.equal(events("lms.course_enrolled").length, 0);
    assert.equal(r.skipped.enrollments, 1);
    assert.equal(sync().skipped.enrollments ?? 0, 0);
  });
});

describe("robustesse", () => {
  test("idempotence : relire après un « plantage » (curseur remis en arrière) ne crée aucun doublon", () => {
    user("a"); sync();
    const u = user("b");
    run("INSERT INTO enrollments (user_id, course_id) VALUES (?, ?)", u, ids.course);
    sync();
    const before = events().length;
    // plantage simulé : les événements sont émis mais les curseurs n'ont pas été enregistrés (ils reculent d'un cran)
    m.db.prepare("UPDATE mk_bridge_cursors SET last_id = last_id - 1 WHERE source IN ('users', 'enrollments')").run();
    sync();
    assert.equal(events().length, before);
  });
  test("lecture par lots : plusieurs passages jusqu'à épuisement", () => {
    user("base"); sync();
    for (let i = 0; i < 25; i++) user(`u${i}`);
    assert.equal(sync(A, { limit: 10 }).emitted.users, 10);
    assert.equal(sync(A, { limit: 10 }).emitted.users, 10);
    assert.equal(sync(A, { limit: 10 }).emitted.users, 5);
    assert.equal(events("lms.user_registered").length, 25);
  });
  test("isolation : les curseurs et les contacts sont propres à chaque organisation", () => {
    user("x"); sync(A); sync(B);
    const u = user("y");
    sync(A);
    assert.equal(events("lms.user_registered").filter((e) => e.organization_id === 1).length, 1);
    assert.equal(events("lms.user_registered").filter((e) => e.organization_id === 2).length, 0);
    assert.ok(u);
  });
  test("les événements sont distribués par la file (jamais dans la requête d'origine)", () => {
    user("x"); sync(); user("y"); sync();
    assert.ok(m.db.prepare("SELECT COUNT(*) n FROM mk_jobs WHERE type = 'event.dispatch'").get().n >= 1);
  });
});

describe("tâche récurrente du pont", () => {
  test("le travail se relance de lui-même ; démarrer plusieurs fois ne multiplie pas les chaînes", async () => {
    user("x"); 
    const handlers = bridge.jobHandlers({ db: m.db, bus: m.bus, now: () => T0, log: quiet });
    bridge.startBridge(m.db, 1, { now: () => T0 });
    bridge.startBridge(m.db, 1, { now: () => T0 });
    assert.equal(m.db.prepare("SELECT COUNT(*) n FROM mk_jobs WHERE type = 'bridge.sync'").get().n, 1);
    const worker = createWorker({ db: m.db, handlers, workerId: "t", log: quiet, now: () => T0 });
    await worker.drain();
    const next = m.db.prepare("SELECT run_at, state FROM mk_jobs WHERE type = 'bridge.sync' AND state = 'pending'").all();
    assert.equal(next.length, 1);
    assert.ok(next[0].run_at > T0);
    assert.equal(m.db.prepare("SELECT COUNT(*) n FROM mk_bridge_cursors").get().n, 7, "la première exécution a initialisé les curseurs");
  });
});

describe("variables « événement » dans les modèles", () => {
  test("catalogue : titre, lien et montant, numéro ; les liens sont des variables système (utilisables dans un bouton)", () => {
    const cat = templates.variableCatalog(A);
    for (const p of ["event.course_title", "event.course_url", "event.learn_url", "event.order_total", "event.order_id", "event.lesson_title"]) assert.ok(cat.some((v) => v.path === p), p);
    assert.deepEqual(cat.filter((v) => v.system).map((v) => v.path).sort(), ["event.course_url", "event.learn_url", "preferences_url", "unsubscribe_url", "view_url"]);
  });
  test("contexte : valeurs de l'événement échappées ; adresses non https refusées ; absentes = vides", () => {
    const { contact } = audience.upsertContact(A, { email: "a@ex.fr" });
    const ctx = templates.buildContext(A, contact, { event: { course_title: "<b>FCP</b>", course_url: "javascript:alert(1)", learn_url: "https://k.test/mes-cours", order_total: "49,00 €", order_id: 12 } });
    assert.deepEqual([ctx.event.course_title, ctx.event.course_url, ctx.event.learn_url, ctx.event.order_total, ctx.event.order_id, ctx.event.lesson_title], ["<b>FCP</b>", "", "https://k.test/mes-cours", "49,00 €", "12", ""]);
    assert.deepEqual(Object.keys(templates.buildContext(A, contact, {}).event).sort(), ["course_title", "course_url", "funnel_name", "funnel_step", "learn_url", "lesson_title", "order_id", "order_total", "refund_amount"]);
  });
  test("un modèle peut afficher ces variables et un bouton vers le lien de la formation", () => {
    const t = templates.createTemplate(A, { name: "Bienvenue formation", kind: "transactional", subject: "Bienvenue dans {{event.course_title | default:\"votre formation\"}}", blocks: [{ type: "text", markdown: "Commande {{event.order_id}} : {{event.order_total}}" }, { type: "button", label: "Commencer", url: "{{event.course_url}}" }, { type: "text", markdown: "[Mes cours]({{event.learn_url}})" }] });
    const { contact } = audience.upsertContact(A, { email: "b@ex.fr" });
    const r = templates.renderTemplate(A, t.id, contact, { event: { course_title: "FCP", course_url: "https://k.test/cours/fcp", learn_url: "https://k.test/mes-cours", order_total: "49,00 €", order_id: 7 } });
    assert.equal(r.subject, "Bienvenue dans FCP");
    assert.match(r.html, /href="https:\/\/k\.test\/cours\/fcp"/);
    assert.match(r.html, /href="https:\/\/k\.test\/mes-cours"/);
    assert.match(r.html, /Commande 7 : 49,00 €/);
  });
  test("les variables d'événement ne s'ouvrent pas dans l'adresse d'un lien sauf les deux liens système", () => {
    const bad = () => templates.createTemplate(A, { name: "Mauvais", subject: "S", blocks: [{ type: "button", label: "x", url: "{{event.course_title}}" }] });
    assert.throws(bad, (e) => e.code === "invalid_template");
  });
});
