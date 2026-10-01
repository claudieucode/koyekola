// Marketing — file de travaux, worker et bus d'événements : idempotence, reprises, bail, atomicité, absence de double traitement.
const { test, describe, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const { DatabaseSync } = require("node:sqlite");
const { migrate } = require("../src/marketing/db/migrate");
const jobs = require("../src/marketing/queue/jobs");
const { createWorker, UnrecoverableError } = require("../src/marketing/queue/worker");
const { createEventBus } = require("../src/marketing/events/bus");

const MIGRATIONS = path.join(__dirname, "..", "src", "marketing", "migrations");
const quiet = { log() {}, warn() {}, error() {} };
const T0 = 1_800_000_000_000; // instant de référence fixe : les tests ne dépendent pas de l'horloge

let db;
beforeEach(() => {
  db = new DatabaseSync(":memory:");
  db.exec("PRAGMA foreign_keys = ON");
  db.exec("CREATE TABLE users (id INTEGER PRIMARY KEY, username TEXT, email TEXT, role TEXT)");
  migrate(db, { dir: MIGRATIONS, dbPath: ":memory:", log: quiet });
  db.exec("INSERT INTO mk_organizations (name, slug) VALUES ('A', 'a'), ('B', 'b')");
});
const row = (id) => db.prepare("SELECT * FROM mk_jobs WHERE id = ?").get(id);
const enqueue = (over = {}) => jobs.enqueue(db, { type: "test.job", organizationId: 1, now: T0, ...over });

describe("file de travaux : création et idempotence", () => {
  test("crée un travail en attente avec ses valeurs par défaut", () => {
    const { id, duplicate } = enqueue({ payload: { a: 1 } });
    assert.equal(duplicate, false);
    const j = row(id);
    assert.equal(j.state, "pending");
    assert.equal(j.attempts, 0);
    assert.equal(j.max_attempts, 5);
    assert.equal(j.priority, 5);
    assert.equal(j.run_at, T0);
    assert.deepEqual(JSON.parse(j.payload), { a: 1 });
  });
  test("même clé d'idempotence : un seul travail, l'existant est renvoyé", () => {
    const a = enqueue({ idempotencyKey: "campagne:1:contact:2" });
    const b = enqueue({ idempotencyKey: "campagne:1:contact:2" });
    assert.equal(b.duplicate, true);
    assert.equal(b.id, a.id);
    assert.equal(db.prepare("SELECT COUNT(*) n FROM mk_jobs").get().n, 1);
  });
  test("la clé est propre à chaque organisation ; sans organisation (système), elle reste unique", () => {
    assert.equal(enqueue({ organizationId: 1, idempotencyKey: "k" }).duplicate, false);
    assert.equal(enqueue({ organizationId: 2, idempotencyKey: "k" }).duplicate, false);
    assert.equal(enqueue({ organizationId: null, idempotencyKey: "k" }).duplicate, false);
    assert.equal(enqueue({ organizationId: null, idempotencyKey: "k" }).duplicate, true);
  });
  test("un travail déjà terminé garde sa clé : il ne peut pas être recréé (pas de double envoi)", () => {
    const { id } = enqueue({ idempotencyKey: "envoi:1" });
    const [job] = jobs.claim(db, { workerId: "w1", now: T0 });
    jobs.complete(db, job, { workerId: "w1", now: T0 });
    assert.equal(row(id).state, "done");
    assert.equal(enqueue({ idempotencyKey: "envoi:1" }).duplicate, true);
  });
  test("validation des paramètres", () => {
    for (const bad of ["", "Majuscule", "a b", "x".repeat(80), 42]) assert.throws(() => enqueue({ type: bad }), /type/i);
    assert.throws(() => enqueue({ priority: 0 }), /priorit/i);
    assert.throws(() => enqueue({ priority: 10 }), /priorit/i);
    assert.throws(() => enqueue({ maxAttempts: 0 }), /tentatives/i);
    assert.throws(() => enqueue({ maxAttempts: 50 }), /tentatives/i);
    assert.throws(() => enqueue({ payload: { x: "y".repeat(70000) } }), /volumineu/i);
    assert.throws(() => enqueue({ payload: "texte" }), /payload|charge/i);
    assert.throws(() => enqueue({ idempotencyKey: "k".repeat(300) }), /idempotence/i);
    assert.throws(() => enqueue({ organizationId: 999 }));
  });
});

describe("file de travaux : réservation", () => {
  test("respecte l'heure d'exécution : un travail futur n'est pas pris", () => {
    enqueue({ runAt: T0 + 60_000 });
    assert.equal(jobs.claim(db, { workerId: "w1", now: T0 }).length, 0);
    assert.equal(jobs.claim(db, { workerId: "w1", now: T0 + 60_000 }).length, 1);
  });
  test("ordre : priorité (1 = urgent), puis heure prévue, puis ancienneté", () => {
    const low = enqueue({ priority: 8, payload: { n: "bas" } });
    const early = enqueue({ priority: 5, runAt: T0 - 1000, payload: { n: "tôt" } });
    const late = enqueue({ priority: 5, runAt: T0, payload: { n: "tard" } });
    const urgent = enqueue({ priority: 1, runAt: T0, payload: { n: "urgent" } });
    const order = jobs.claim(db, { workerId: "w1", now: T0, limit: 10 }).map((j) => j.payload.n);
    assert.deepEqual(order, ["urgent", "tôt", "tard", "bas"]);
    assert.ok(low.id && early.id && late.id && urgent.id);
  });
  test("réserve : état, propriétaire, bail, tentative comptée ; charge utile relue en objet", () => {
    enqueue({ payload: { x: 1 } });
    const [j] = jobs.claim(db, { workerId: "w1", leaseMs: 30_000, now: T0 });
    assert.equal(j.state, "running");
    assert.equal(j.locked_by, "w1");
    assert.equal(j.locked_until, T0 + 30_000);
    assert.equal(j.attempts, 1);
    assert.deepEqual(j.payload, { x: 1 });
  });
  test("limite de lot et filtre par type", () => {
    for (let i = 0; i < 5; i++) enqueue({ type: "a.job" });
    enqueue({ type: "b.job" });
    assert.equal(jobs.claim(db, { workerId: "w1", now: T0, limit: 3 }).length, 3);
    const b = jobs.claim(db, { workerId: "w1", now: T0, types: ["b.job"] });
    assert.deepEqual(b.map((j) => j.type), ["b.job"]);
    assert.throws(() => jobs.claim(db, { workerId: "w1", now: T0, limit: 5000 }), /limite/i);
  });
  test("deux workers ne prennent jamais le même travail : 300 travaux traités exactement une fois", () => {
    for (let i = 0; i < 300; i++) enqueue({ payload: { i } });
    const seen = new Map();
    let round = 0;
    while (true) {
      const worker = round++ % 2 ? "w2" : "w1";
      const batch = jobs.claim(db, { workerId: worker, now: T0, limit: 7 });
      if (!batch.length) break;
      for (const job of batch) {
        seen.set(job.payload.i, (seen.get(job.payload.i) || 0) + 1);
        assert.equal(jobs.complete(db, job, { workerId: worker, now: T0 }), true);
      }
    }
    assert.equal(seen.size, 300);
    assert.ok([...seen.values()].every((n) => n === 1), "aucun travail traité deux fois");
    assert.equal(jobs.stats(db).done, 300);
  });
});

describe("file de travaux : bail (plantage d'un worker)", () => {
  test("un travail dont le bail n'a pas expiré n'est pas repris ; après expiration, un autre worker le reprend", () => {
    const { id } = enqueue();
    jobs.claim(db, { workerId: "w1", leaseMs: 60_000, now: T0 });
    assert.equal(jobs.claim(db, { workerId: "w2", now: T0 + 59_000 }).length, 0);
    const [again] = jobs.claim(db, { workerId: "w2", now: T0 + 61_000 });
    assert.equal(again.id, id);
    assert.equal(again.locked_by, "w2");
    assert.equal(again.attempts, 2, "la reprise compte comme une tentative");
  });
  test("l'ancien worker ne peut plus terminer un travail qui lui a été retiré", () => {
    enqueue();
    const [first] = jobs.claim(db, { workerId: "w1", leaseMs: 1000, now: T0 });
    const [second] = jobs.claim(db, { workerId: "w2", now: T0 + 2000 });
    assert.equal(jobs.complete(db, first, { workerId: "w1", now: T0 + 2500 }), false);
    assert.equal(jobs.complete(db, second, { workerId: "w2", now: T0 + 2500 }), true);
  });
  test("un travail abandonné trop de fois est mis de côté (« dead ») au lieu de boucler à l'infini", () => {
    const { id } = enqueue({ maxAttempts: 2 });
    jobs.claim(db, { workerId: "w1", leaseMs: 1000, now: T0 });
    jobs.claim(db, { workerId: "w2", leaseMs: 1000, now: T0 + 2000 });
    assert.equal(jobs.claim(db, { workerId: "w3", now: T0 + 4000 }).length, 0);
    assert.equal(row(id).state, "dead");
    assert.match(row(id).last_error, /bail|tentatives/i);
  });
});

describe("file de travaux : échecs, reprises et délais", () => {
  test("échec repris plus tard avec un délai qui croît (exponentiel), plafonné", () => {
    const random = () => 0.5; // sans aléa : facteur exact
    assert.equal(jobs.backoffMs(1, { random }), 30_000);
    assert.equal(jobs.backoffMs(2, { random }), 60_000);
    assert.equal(jobs.backoffMs(3, { random }), 120_000);
    assert.equal(jobs.backoffMs(20, { random }), 3_600_000, "plafonné à 1 heure");
    for (let i = 0; i < 50; i++) {
      const d = jobs.backoffMs(2);
      assert.ok(d >= 60_000 * 0.8 && d <= 60_000 * 1.2, `aléa hors bornes : ${d}`);
    }
  });
  test("un échec remet le travail en attente, repoussé, avec le message d'erreur", () => {
    const { id } = enqueue();
    const [job] = jobs.claim(db, { workerId: "w1", now: T0 });
    const result = jobs.fail(db, job, new Error("fournisseur indisponible"), { workerId: "w1", now: T0, random: () => 0.5 });
    assert.equal(result.state, "pending");
    assert.equal(row(id).state, "pending");
    assert.equal(row(id).run_at, T0 + 30_000);
    assert.equal(row(id).last_error, "fournisseur indisponible");
    assert.equal(row(id).locked_by, null);
    assert.equal(jobs.claim(db, { workerId: "w1", now: T0 + 1000 }).length, 0, "pas repris trop tôt");
    assert.equal(jobs.claim(db, { workerId: "w1", now: T0 + 30_000 }).length, 1);
  });
  test("tentatives épuisées : « dead » avec la dernière erreur (visible pour le diagnostic)", () => {
    const { id } = enqueue({ maxAttempts: 2 });
    let now = T0;
    for (let i = 0; i < 2; i++) {
      const [job] = jobs.claim(db, { workerId: "w1", now });
      jobs.fail(db, job, new Error(`échec ${i + 1}`), { workerId: "w1", now, random: () => 0.5 });
      now += 3_600_000;
    }
    assert.equal(row(id).state, "dead");
    assert.equal(row(id).last_error, "échec 2");
    assert.ok(row(id).finished_at);
    assert.equal(jobs.claim(db, { workerId: "w1", now: now + 9e9 }).length, 0);
  });
  test("erreur non récupérable : « dead » tout de suite, sans nouvelle tentative", () => {
    const { id } = enqueue({ maxAttempts: 5 });
    const [job] = jobs.claim(db, { workerId: "w1", now: T0 });
    assert.equal(jobs.fail(db, job, new Error("adresse invalide"), { workerId: "w1", now: T0, retryable: false }).state, "dead");
    assert.equal(row(id).attempts, 1);
  });
  test("le message d'erreur stocké est borné", () => {
    const { id } = enqueue({ maxAttempts: 1 });
    const [job] = jobs.claim(db, { workerId: "w1", now: T0 });
    jobs.fail(db, job, new Error("x".repeat(5000)), { workerId: "w1", now: T0 });
    assert.ok(row(id).last_error.length <= 500);
  });
  test("rejouer un travail « dead » à la main, statistiques, purge des travaux terminés", () => {
    const dead = enqueue({ maxAttempts: 1 });
    const done = enqueue();
    const [a, b] = jobs.claim(db, { workerId: "w1", now: T0, limit: 2 });
    jobs.fail(db, a, new Error("boum"), { workerId: "w1", now: T0 });
    jobs.complete(db, b, { workerId: "w1", now: T0 });
    assert.deepEqual([jobs.stats(db, { organizationId: 1 }).dead, jobs.stats(db, { organizationId: 1 }).done], [1, 1]);
    assert.equal(jobs.retryDead(db, dead.id, { organizationId: 2, now: T0 }), false, "une autre organisation ne peut pas rejouer");
    assert.equal(jobs.retryDead(db, dead.id, { organizationId: 1, now: T0 }), true);
    assert.equal(row(dead.id).state, "pending");
    assert.equal(row(dead.id).attempts, 0);
    assert.equal(jobs.retryDead(db, done.id, { organizationId: 1, now: T0 }), false, "seul un travail « dead » peut être rejoué");
    assert.equal(jobs.purge(db, { olderThanMs: 1000, now: T0 + 5000 }), 1);
    assert.equal(row(done.id), undefined);
  });
  test("statistiques : retard du plus ancien travail en attente", () => {
    enqueue({ runAt: T0 - 90_000 });
    assert.equal(jobs.stats(db, { now: T0 }).oldestPendingMs, 90_000);
    assert.equal(jobs.stats(db, { organizationId: 2, now: T0 }).pending, 0);
  });
});

describe("worker", () => {
  const worker = (handlers, over = {}) => createWorker({ db, handlers, workerId: "w-test", log: quiet, now: () => clock.t, random: () => 0.5, ...over });
  let clock;
  beforeEach(() => {
    clock = { t: T0 };
  });

  test("exécute le gestionnaire du type, avec la charge utile, puis termine le travail", async () => {
    const received = [];
    enqueue({ payload: { to: "a@b.fr" } });
    const w = worker({ "test.job": async (payload) => received.push(payload) });
    const result = await w.tick();
    assert.deepEqual(received, [{ to: "a@b.fr" }]);
    assert.equal(result.processed, 1);
    assert.equal(jobs.stats(db).done, 1);
  });
  test("un gestionnaire qui échoue est rejoué plus tard, puis réussit ; le fournisseur en panne n'affecte pas les autres travaux", async () => {
    let calls = 0;
    enqueue({ payload: { n: 1 } });
    enqueue({ type: "autre.job", payload: { n: 2 } });
    const done = [];
    const w = worker({
      "test.job": async () => { if (++calls < 3) throw new Error("provider indisponible"); done.push("ok"); },
      "autre.job": async () => done.push("autre"),
    });
    await w.tick();
    assert.deepEqual(done, ["autre"]);
    clock.t += 31_000;
    await w.tick(); // 2e échec
    clock.t += 61_000;
    await w.tick(); // réussite
    assert.deepEqual(done, ["autre", "ok"]);
    assert.equal(calls, 3);
    assert.equal(jobs.stats(db).done, 2);
  });
  test("tentatives épuisées : le travail est mis de côté, l'erreur est conservée et journalisée", async () => {
    enqueue({ maxAttempts: 2 });
    const errors = [];
    const w = worker({ "test.job": async () => { throw new Error("toujours en panne"); } }, { log: { ...quiet, error: (...a) => errors.push(a.join(" ")) } });
    await w.tick();
    clock.t += 31_000;
    await w.tick();
    const job = db.prepare("SELECT * FROM mk_jobs").get();
    assert.equal(job.state, "dead");
    assert.equal(job.last_error, "toujours en panne");
    assert.ok(errors.some((e) => /toujours en panne/.test(e)), "l'erreur est journalisée, pas avalée");
  });
  test("type inconnu : mis de côté immédiatement (jamais de boucle)", async () => {
    enqueue({ type: "inconnu.job" });
    const w = worker({});
    await w.tick();
    const job = db.prepare("SELECT * FROM mk_jobs").get();
    assert.equal(job.state, "dead");
    assert.match(job.last_error, /inconnu/i);
  });
  test("UnrecoverableError : pas de nouvelle tentative", async () => {
    enqueue({ maxAttempts: 5 });
    const w = worker({ "test.job": async () => { throw new UnrecoverableError("contact désinscrit"); } });
    await w.tick();
    const job = db.prepare("SELECT * FROM mk_jobs").get();
    assert.equal(job.state, "dead");
    assert.equal(job.attempts, 1);
  });
  test("gestionnaire trop lent : délai dépassé, travail rejoué (jamais bloqué)", async () => {
    enqueue();
    const w = worker({ "test.job": () => new Promise(() => {}) }, { timeoutMs: 20, leaseMs: 1000 });
    const started = Date.now();
    await w.tick();
    assert.ok(Date.now() - started < 500);
    const job = db.prepare("SELECT * FROM mk_jobs").get();
    assert.equal(job.state, "pending");
    assert.match(job.last_error, /délai/i);
  });
  test("le délai maximal doit rester inférieur au bail (sinon deux workers pourraient traiter le même travail)", () => {
    assert.throws(() => worker({}, { timeoutMs: 60_000, leaseMs: 30_000 }), /bail|délai/i);
  });
  test("plantage en plein traitement : le travail est repris et exécuté après expiration du bail (au moins une fois)", async () => {
    enqueue({ payload: { n: 1 } });
    jobs.claim(db, { workerId: "worker-mort", leaseMs: 1000, now: clock.t }); // le worker « plante » sans terminer
    const seen = [];
    const w = worker({ "test.job": async (p) => seen.push(p.n) });
    await w.tick();
    assert.deepEqual(seen, [], "bail encore valide : pas repris");
    clock.t += 2000;
    await w.tick();
    assert.deepEqual(seen, [1]);
  });
  test("traite par lots (le site n'est jamais bloqué par un long envoi) et drain() vide la file", async () => {
    for (let i = 0; i < 60; i++) enqueue({ payload: { i } });
    const w = worker({ "test.job": async () => {} }, { batchSize: 25 });
    assert.equal((await w.tick()).processed, 25);
    await w.drain();
    assert.equal(jobs.stats(db).done, 60);
  });
  test("indicateurs pour la page de diagnostic", async () => {
    enqueue();
    enqueue({ type: "boum.job", maxAttempts: 1 });
    const w = worker({ "test.job": async () => {}, "boum.job": async () => { throw new Error("x"); } });
    await w.tick();
    const m = w.metrics();
    assert.equal(m.ticks, 1);
    assert.equal(m.processed, 1);
    assert.equal(m.failed, 1);
    assert.ok(m.lastTickAt && typeof m.lastTickMs === "number");
  });
  test("start/stop : une seule exécution à la fois, arrêt propre, ne retient pas le processus", async () => {
    let running = 0;
    let maxRunning = 0;
    for (let i = 0; i < 4; i++) enqueue({ payload: { i } });
    const w = worker({ "test.job": async () => { running++; maxRunning = Math.max(maxRunning, running); await new Promise((r) => setTimeout(r, 15)); running--; } }, { intervalMs: 5, batchSize: 2 });
    w.start();
    w.start(); // double démarrage sans effet
    await new Promise((r) => setTimeout(r, 200));
    await w.stop();
    assert.equal(maxRunning, 1);
    assert.equal(jobs.stats(db).done, 4);
    const after = jobs.stats(db).done;
    await new Promise((r) => setTimeout(r, 30));
    assert.equal(jobs.stats(db).done, after, "plus rien ne tourne après stop()");
  });
});

describe("bus d'événements", () => {
  let bus;
  beforeEach(() => {
    bus = createEventBus(db, { log: quiet, now: () => T0 });
  });
  const emit = (over = {}) => bus.emit({ organizationId: 1, name: "course_purchased", email: "Jean@Exemple.FR ", source: "koyekola", metadata: { course_id: "123" }, ...over });
  const ev = (id) => db.prepare("SELECT * FROM mk_events WHERE id = ?").get(id);

  test("enregistre l'événement (e-mail normalisé) et planifie sa distribution", () => {
    const { id, duplicate } = emit();
    assert.equal(duplicate, false);
    const e = ev(id);
    assert.equal(e.name, "course_purchased");
    assert.equal(e.email, "jean@exemple.fr");
    assert.deepEqual(JSON.parse(e.metadata), { course_id: "123" });
    assert.equal(e.occurred_at, T0);
    assert.equal(e.processed_at, null);
    const job = db.prepare("SELECT * FROM mk_jobs").get();
    assert.equal(job.type, "event.dispatch");
    assert.deepEqual(JSON.parse(job.payload), { eventId: id });
    assert.equal(job.organization_id, 1);
  });
  test("même clé d'idempotence : un seul événement et un seul travail (webhook reçu deux fois)", () => {
    const a = emit({ idempotencyKey: "order:77" });
    const b = emit({ idempotencyKey: "order:77" });
    assert.equal(b.duplicate, true);
    assert.equal(b.id, a.id);
    assert.equal(db.prepare("SELECT COUNT(*) n FROM mk_events").get().n, 1);
    assert.equal(db.prepare("SELECT COUNT(*) n FROM mk_jobs").get().n, 1);
    assert.equal(emit({ organizationId: 2, idempotencyKey: "order:77" }).duplicate, false, "la clé est propre à l'organisation");
  });
  test("validation : organisation, nom, e-mail, source, métadonnées", () => {
    assert.throws(() => emit({ organizationId: 0 }), /organisation/i);
    for (const bad of ["", "Course", "a b", "x".repeat(80), "1abc"]) assert.throws(() => emit({ name: bad }), /nom d'événement/i);
    for (const bad of ["pas-un-email", "a@b", "@x.fr", "x".repeat(300) + "@a.fr"]) assert.throws(() => emit({ email: bad }), /e-mail/i);
    assert.throws(() => emit({ source: "Source Invalide" }), /source/i);
    assert.throws(() => emit({ metadata: "texte" }), /métadonnées/i);
    assert.throws(() => emit({ metadata: [1, 2] }), /métadonnées/i);
    assert.throws(() => emit({ metadata: { x: "y".repeat(20000) } }), /métadonnées.*volumineu|volumineu/i);
    assert.doesNotThrow(() => emit({ email: undefined, name: "user_logged_in" }));
    assert.equal(db.prepare("SELECT COUNT(*) n FROM mk_events WHERE email IS NULL").get().n, 1);
  });
  test("atomique avec l'action métier : annulée → ni événement ni travail ; validée → les deux", () => {
    db.exec("BEGIN");
    emit({ idempotencyKey: "order:1" });
    db.exec("ROLLBACK");
    assert.equal(db.prepare("SELECT COUNT(*) n FROM mk_events").get().n, 0);
    assert.equal(db.prepare("SELECT COUNT(*) n FROM mk_jobs").get().n, 0);
    db.exec("BEGIN");
    emit({ idempotencyKey: "order:1" });
    db.exec("COMMIT");
    assert.equal(db.prepare("SELECT COUNT(*) n FROM mk_events").get().n, 1);
    assert.equal(db.prepare("SELECT COUNT(*) n FROM mk_jobs").get().n, 1);
  });
  test("hors transaction : événement et travail sont créés ensemble ou pas du tout", () => {
    db.exec("DROP TABLE mk_jobs"); // panne simulée de la file
    assert.throws(() => emit());
    assert.equal(db.prepare("SELECT COUNT(*) n FROM mk_events").get().n, 0, "pas d'événement orphelin");
  });

  describe("distribution aux gestionnaires", () => {
    const runWorker = async (over = {}) => {
      const t = { now: T0 };
      const w = createWorker({ db, handlers: bus.jobHandlers(), workerId: "w", log: quiet, now: () => t.now, random: () => 0.5, ...over });
      return { w, t };
    };
    test("appelle les gestionnaires du nom puis ceux de « * », avec l'événement complet, puis marque l'événement traité", async () => {
      const calls = [];
      bus.on("course_purchased", (e) => calls.push(["nom", e.email, e.metadata.course_id, e.organizationId]));
      bus.on("*", (e) => calls.push(["tous", e.name]));
      bus.on("autre_evenement", () => calls.push(["jamais"]));
      const { id } = emit();
      const { w } = await runWorker();
      await w.tick();
      assert.deepEqual(calls, [["nom", "jean@exemple.fr", "123", 1], ["tous", "course_purchased"]]);
      assert.equal(ev(id).processed_at, T0);
    });
    test("aucun gestionnaire : l'événement est traité sans erreur", async () => {
      const { id } = emit();
      const { w } = await runWorker();
      await w.tick();
      assert.equal(ev(id).processed_at, T0);
      assert.equal(jobs.stats(db).done, 1);
    });
    test("un gestionnaire en échec fait rejouer la distribution ; l'événement reste « non traité » jusqu'à la réussite", async () => {
      let attempts = 0;
      bus.on("course_purchased", () => { if (++attempts < 2) throw new Error("base occupée"); });
      const { id } = emit();
      const { w, t } = await runWorker();
      await w.tick();
      assert.equal(ev(id).processed_at, null);
      t.now += 31_000;
      await w.tick();
      assert.equal(attempts, 2);
      assert.ok(ev(id).processed_at);
    });
    test("un événement déjà traité n'est jamais redistribué (même si le travail est rejoué)", async () => {
      let calls = 0;
      bus.on("course_purchased", () => calls++);
      const { id } = emit();
      const { w } = await runWorker();
      await w.tick();
      db.prepare("UPDATE mk_jobs SET state = 'pending', run_at = 0").run(); // rejeu accidentel
      await w.tick();
      assert.equal(calls, 1);
      assert.ok(ev(id).processed_at);
    });
    test("événement introuvable : travail mis de côté immédiatement", async () => {
      const { id } = emit();
      db.exec("DELETE FROM mk_events");
      const { w } = await runWorker();
      await w.tick();
      assert.equal(db.prepare("SELECT state FROM mk_jobs").get().state, "dead");
      assert.ok(id);
    });
    test("rejouer un événement crée une nouvelle distribution", async () => {
      let calls = 0;
      bus.on("course_purchased", () => calls++);
      const { id } = emit();
      const { w } = await runWorker();
      await w.tick();
      assert.equal(bus.replay(id, { organizationId: 1 }), true);
      assert.equal(bus.replay(id, { organizationId: 2 }), false, "une autre organisation ne peut pas rejouer");
      await w.tick();
      assert.equal(calls, 2);
    });
    test("un gestionnaire ne peut pas être enregistré avec un nom invalide", () => {
      assert.throws(() => bus.on("Nom Invalide", () => {}), /nom d'événement/i);
      assert.throws(() => bus.on("ok_nom", "pas une fonction"), /fonction/i);
    });
  });
});
