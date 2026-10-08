// Action de scénario « Attendre une date ou une heure » (wait_until) et unité « semaines » : validation, calcul réel dans un
// fuseau horaire (celui du contact ou de l'organisation, changement d'heure compris), échéance passée, champ date du contact,
// heures ouvrables, attente au-delà d'un an, exécution de bout en bout par le moteur.
const { test, describe, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const { freshMarketing, T0, quiet } = require("./marketing-helpers");
const audience = require("../src/marketing/audience");
const auto = require("../src/marketing/automations");
const registry = require("../src/marketing/automations/actions");
const { createProvider } = require("../src/marketing/sending/providers");

const H = 3600000, DAY = 86400000;
const iso = (s) => Date.parse(s);
let m, A, provider;
const code = (fn) => { try { fn(); } catch (e) { return e.code; } return null; };
const contact = (email, tz) => { const c = audience.upsertContact(A, { email }).contact; if (tz) m.db.prepare("UPDATE mk_contacts SET timezone = ? WHERE id = ?").run(tz, c.id); return c; };
const make = (steps) => auto.createAutomation(A, { name: `S${Math.random()}`, kind: "marketing", triggerEvent: "lms.user_registered", steps });
const act = registry.getAction("wait_until");
const exec = (c, step, now) => act.execute({ ctx: A, step, contact: c, now: iso(now) });
const S = (over) => ({ type: "wait_until", mode: "time", zone: "organization", time: "09:00", ...over });

beforeEach(() => { m = freshMarketing(); A = m.A; provider = createProvider({ provider: "console" }, { log: quiet }); });

describe("validation", () => {
  test("chaque mode est normalisé : seuls ses champs sont conservés", () => {
    audience.defineProperty(A, { key: "rentree", label: "Rentrée", type: "date" });
    const a = make([
      { type: "wait_until", mode: "time", time: "09:00", junk: 1, date: "2026-01-01" },
      { type: "wait_until", mode: "weekday", zone: "organization", weekday: 1, time: "08:30" },
      { type: "wait_until", mode: "date", date: "2026-11-15", time: "10:00" },
      { type: "wait_until", mode: "property", property: "rentree", offsetDays: -3, time: "09:00", onMissing: "exit" },
      { type: "wait_until", mode: "business_hours", days: [5, 1, 1, 3], from: "09:00", to: "18:00" },
    ]);
    assert.deepEqual(a.steps, [
      { type: "wait_until", mode: "time", zone: "contact", time: "09:00" },
      { type: "wait_until", mode: "weekday", zone: "organization", weekday: 1, time: "08:30" },
      { type: "wait_until", mode: "date", zone: "contact", date: "2026-11-15", time: "10:00" },
      { type: "wait_until", mode: "property", zone: "contact", property: "rentree", offsetDays: -3, time: "09:00", onMissing: "exit" },
      { type: "wait_until", mode: "business_hours", zone: "contact", days: [1, 3, 5], from: "09:00", to: "18:00" },
    ]);
  });

  test("refus : mode, fuseau, heure, jour, date inexistante, propriété absente ou non date, décalage, plage", () => {
    audience.defineProperty(A, { key: "rentree", label: "Rentrée", type: "date" });
    audience.defineProperty(A, { key: "ville", label: "Ville", type: "text" });
    const bad = (over) => code(() => make([{ type: "wait_until", mode: "time", time: "09:00", ...over }]));
    assert.equal(bad({ mode: "jamais" }), "invalid_automation");
    assert.equal(bad({ zone: "mars" }), "invalid_automation");
    assert.equal(bad({ time: "9:00" }), "invalid_automation");
    assert.equal(bad({ time: "24:00" }), "invalid_automation");
    assert.equal(bad({ mode: "weekday", weekday: 8, time: "09:00" }), "invalid_automation");
    assert.equal(bad({ mode: "date", date: "2026-02-30" }), "invalid_automation", "le 30 février n'existe pas");
    assert.equal(bad({ mode: "date", date: "1999-12-31" }), "invalid_automation");
    assert.equal(bad({ mode: "property", property: "absente" }), "invalid_automation");
    assert.equal(bad({ mode: "property", property: "ville" }), "invalid_automation", "une propriété texte n'est pas une date");
    assert.equal(bad({ mode: "property", property: "rentree", offsetDays: 400 }), "invalid_automation");
    assert.equal(bad({ mode: "property", property: "rentree", onMissing: "pleurer" }), "invalid_automation");
    assert.equal(bad({ mode: "business_hours", days: [], from: "09:00", to: "18:00" }), "invalid_automation");
    assert.equal(bad({ mode: "business_hours", days: [1, 9], from: "09:00", to: "18:00" }), "invalid_automation");
    assert.equal(bad({ mode: "business_hours", days: [1], from: "18:00", to: "09:00" }), "invalid_automation", "fermeture avant ouverture");
    assert.equal(bad({ mode: "business_hours", days: [1], from: "09:00", to: "09:00" }), "invalid_automation");
  });

  test("unité « semaines » acceptée pour une attente ordinaire ; unité inconnue toujours refusée", () => {
    assert.deepEqual(make([{ type: "wait", amount: 2, unit: "weeks" }]).steps, [{ type: "wait", amount: 2, unit: "weeks" }]);
    assert.equal(code(() => make([{ type: "wait", amount: 2, unit: "mois" }])), "invalid_automation");
    assert.equal(code(() => make([{ type: "wait", amount: 60, unit: "weeks" }])), "invalid_automation", "plus d'un an");
  });
});

describe("heure et jour : calcul dans le fuseau du contact ou de l'organisation", () => {
  // jeudi 2026-10-08 06:00 UTC = 08:00 à Paris (heure d'été) = 02:00 à New York
  const NOW = "2026-10-08T06:00:00Z";
  test("une heure précise : aujourd'hui si elle n'est pas passée, sinon demain, tout de suite si c'est maintenant", () => {
    const c = contact("a@ex.fr");
    assert.equal(exec(c, S({ time: "09:00" }), NOW).wait, 1 * H);
    assert.equal(exec(c, S({ time: "07:00" }), NOW).wait, 23 * H, "07:00 est passée : demain");
    assert.equal(exec(c, S({ time: "08:00" }), NOW).next, true, "exactement maintenant : le contact continue");
  });

  test("fuseau du contact : New York et Paris ne donnent pas la même attente ; sans fuseau, repli sur l'organisation", () => {
    const ny = contact("ny@ex.fr", "America/New_York"), paris = contact("p@ex.fr");
    assert.equal(exec(ny, S({ zone: "contact", time: "09:00" }), NOW).wait, 7 * H, "02:00 à New York → 09:00 : 7 h");
    assert.equal(exec(paris, S({ zone: "contact", time: "09:00" }), NOW).wait, 1 * H, "pas de fuseau : celui de l'organisation (Paris)");
    assert.equal(exec(ny, S({ zone: "organization", time: "09:00" }), NOW).wait, 1 * H, "fuseau de l'organisation demandé : celui du contact est ignoré");
    assert.match(exec(ny, S({ zone: "contact", time: "09:00" }), NOW).log[1], /America\/New_York/);
  });

  test("jour de la semaine : le prochain, ou aujourd'hui si l'heure n'est pas passée", () => {
    const c = contact("w@ex.fr");
    assert.equal(exec(c, S({ mode: "weekday", weekday: 1, time: "09:00" }), NOW).wait, 4 * DAY + 1 * H, "lundi 12 à 09:00 Paris");
    assert.equal(exec(c, S({ mode: "weekday", weekday: 4, time: "09:00" }), NOW).wait, 1 * H, "jeudi (aujourd'hui) 09:00 : dans 1 h");
    assert.equal(exec(c, S({ mode: "weekday", weekday: 4, time: "07:00" }), NOW).wait, 7 * DAY - 1 * H, "jeudi 07:00 est passé : jeudi prochain");
  });

  test("changement d'heure : l'attente suit l'heure LOCALE (heure d'été ↔ hiver)", () => {
    const c = contact("dst@ex.fr");
    // samedi 28 mars 2026 14:00 Paris (CET) → dimanche 29 à 09:00 (CEST, UTC+2) = 07:00 UTC : 19 h
    assert.equal(exec(c, S({ time: "09:00" }), "2026-03-28T12:00:00Z").wait, 19 * H);
    // samedi 24 octobre 2026 14:00 Paris (CEST) → dimanche 25 à 09:00 (CET, UTC+1) = 08:00 UTC : 20 h
    assert.equal(exec(c, S({ time: "09:00" }), "2026-10-24T12:00:00Z").wait, 20 * H);
  });
});

describe("date précise, champ date du contact", () => {
  const NOW = "2026-10-08T06:00:00Z";
  test("date future : attente jusqu'à cette date ; date passée : le contact continue", () => {
    const c = contact("d@ex.fr");
    assert.equal(exec(c, S({ mode: "date", date: "2026-10-20", time: "09:00" }), NOW).wait, iso("2026-10-20T07:00:00Z") - iso(NOW));
    const past = exec(c, S({ mode: "date", date: "2026-01-01", time: "09:00" }), NOW);
    assert.equal(past.next, true); assert.match(past.log[1], /échéance atteinte/);
  });

  test("champ date : décalage avant / après, champ vide (continuer ou sortir), date passée, au-delà d'un an", () => {
    audience.defineProperty(A, { key: "rentree", label: "Rentrée", type: "date" });
    const c = contact("p@ex.fr");
    const step = (over) => S({ mode: "property", property: "rentree", offsetDays: 0, onMissing: "continue", ...over });
    // champ vide
    const vide = exec(c, step({}), NOW);
    assert.equal(vide.next, true); assert.match(vide.log[1], /sans date : étape passée/);
    const sortie = exec(c, step({ onMissing: "exit" }), NOW);
    assert.equal(sortie.exit, "date_missing");
    audience.setContactProperties(A, c.id, { rentree: "2026-10-20" });
    assert.equal(exec(c, step({ offsetDays: -3 }), NOW).wait, iso("2026-10-17T07:00:00Z") - iso(NOW), "trois jours avant, 09:00 Paris");
    assert.equal(exec(c, step({ offsetDays: 2, time: "18:30" }), NOW).wait, iso("2026-10-22T16:30:00Z") - iso(NOW), "deux jours après, 18:30 Paris");
    assert.equal(exec(c, step({ offsetDays: -30 }), NOW).next, true, "date déjà passée : on continue");
    audience.setContactProperties(A, c.id, { rentree: "2030-01-15" });
    const loin = exec(c, step({}), NOW);
    assert.equal(loin.retry, 365 * DAY, "à plus d'un an : réévaluée dans un an, jamais une attente indéfinie ni une échéance raccourcie");
    assert.ok(loin.wait === undefined && !loin.next);
  });
});

describe("heures ouvrables", () => {
  const BH = (over) => S({ mode: "business_hours", days: [1, 2, 3, 4, 5], from: "09:00", to: "18:00", ...over });
  test("dans la plage : on continue ; avant : ouverture du jour ; après ou week-end : prochaine ouverture", () => {
    const c = contact("b@ex.fr");
    assert.equal(exec(c, BH({}), "2026-10-08T06:00:00Z").wait, 1 * H, "jeudi 08:00 Paris : ouverture à 09:00");
    assert.equal(exec(c, BH({}), "2026-10-08T10:00:00Z").next, true, "jeudi 12:00 Paris : ouvert");
    assert.equal(exec(c, BH({}), "2026-10-08T16:00:00Z").wait, 15 * H, "jeudi 18:00 Paris (fermé) → vendredi 09:00 : 15 h");
    assert.equal(exec(c, BH({}), "2026-10-10T10:00:00Z").wait, iso("2026-10-12T07:00:00Z") - iso("2026-10-10T10:00:00Z"), "samedi midi → lundi 09:00");
    assert.equal(exec(c, BH({ days: [6] }), "2026-10-08T10:00:00Z").wait, iso("2026-10-10T07:00:00Z") - iso("2026-10-08T10:00:00Z"), "seulement le samedi");
  });
  test("fuseau du contact : New York est fermé quand Paris est ouvert", () => {
    const ny = contact("ny2@ex.fr", "America/New_York");
    // jeudi 12:00 Paris = 06:00 New York (fermé) : ouverture à 09:00 New York = 13:00 UTC
    assert.equal(exec(ny, BH({ zone: "contact" }), "2026-10-08T10:00:00Z").wait, 3 * H);
    assert.equal(exec(ny, BH({ zone: "organization" }), "2026-10-08T10:00:00Z").next, true);
  });
});

describe("exécution par le moteur", () => {
  const live = (steps) => { const a = make(steps); auto.activateAutomation(A, a.id, { workerOn: true, smtpAvailable: true }); return a; };
  const event = (c) => ({ id: Math.floor(Math.random() * 1e9), organizationId: 1, name: "lms.user_registered", contactId: c.id, email: c.email, metadata: {} });
  const runOf = (c) => m.db.prepare("SELECT * FROM mk_automation_runs WHERE contact_id = ?").get(c.id);
  const tagged = (c) => m.db.prepare("SELECT COUNT(*) n FROM mk_contact_tags WHERE contact_id = ?").get(c.id).n;

  test("l'attente est enregistrée avec sa date de réveil ; à l'échéance le contact continue (survit à un redémarrage : date en base)", async () => {
    live([S({ mode: "weekday", weekday: 1, time: "09:00" }), { type: "add_tag", tag: "lundi" }]);
    const c = contact("moteur@ex.fr");
    auto.onEvent(A, event(c));
    const r1 = await auto.runAutomation(A, runOf(c).id, { provider, now: T0 });
    assert.equal(r1.done, false);
    assert.ok(r1.waitMs > 0 && r1.waitMs <= 7 * DAY, `attente de ${r1.waitMs} ms`);
    assert.equal(runOf(c).wake_at, T0 + r1.waitMs, "date de réveil en base");
    assert.equal(tagged(c), 0, "rien avant l'échéance");
    assert.equal((await auto.runAutomation(A, runOf(c).id, { provider, now: T0 + 1000 })).waitMs, r1.waitMs - 1000, "réveil trop tôt : on attend le reste");
    const r2 = await auto.runAutomation(A, runOf(c).id, { provider, now: T0 + r1.waitMs });
    assert.equal(r2.done, true);
    assert.equal(tagged(c), 1);
    assert.deepEqual(m.db.prepare("SELECT action FROM mk_automation_log WHERE run_id = ? ORDER BY id").all(runOf(c).id).map((l) => l.action), ["wait_until", "add_tag", "completed"]);
  });

  test("une attente de deux semaines dure quatorze jours", async () => {
    live([{ type: "wait", amount: 2, unit: "weeks" }, { type: "add_tag", tag: "apres" }]);
    const c = contact("sem@ex.fr");
    auto.onEvent(A, event(c));
    assert.equal((await auto.runAutomation(A, runOf(c).id, { provider, now: T0 })).waitMs, 14 * DAY);
  });
});

describe("étapes non réglées : brouillon, jamais une erreur", () => {
  const graph = require("../src/marketing/automations/graph");
  const g = (type, data) => ({ nodes: [{ id: "trigger", type: "trigger", data: {} }, { id: "n1", type, data }], edges: [{ id: "e1", source: "trigger", target: "n1" }] });
  const todo = (type, data) => graph.incompleteNodes(g(type, data)).map((n) => n.id);
  test("« Attendre une date ou une heure » : incomplète sans date, sans champ, sans jour ouvrable ; complète sinon", () => {
    assert.deepEqual(todo("wait_until", { mode: "date", date: "", time: "09:00" }), ["n1"]);
    assert.deepEqual(todo("wait_until", { mode: "property", property: "", time: "09:00" }), ["n1"]);
    assert.deepEqual(todo("wait_until", { mode: "business_hours", days: [], from: "09:00", to: "18:00" }), ["n1"]);
    assert.deepEqual(todo("wait_until", { mode: "time", time: "09:00" }), []);
    assert.deepEqual(todo("wait_until", { mode: "weekday", weekday: 1, time: "09:00" }), []);
  });
  test("« Ajouter une note » et « Modifier le score » : incomplètes tant qu'elles ne sont pas réglées", () => {
    assert.deepEqual(todo("add_note", { body: "" }), ["n1"]);
    assert.deepEqual(todo("add_note", { body: "Bonjour" }), []);
    assert.deepEqual(todo("adjust_score", {}), ["n1"]);
    assert.deepEqual(todo("adjust_score", { mode: "add", points: 10 }), []);
  });
});
