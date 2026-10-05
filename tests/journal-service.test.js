// Service du journal d'activité : masquage des secrets, robustesse (ne lève jamais), validation du format des actions.
const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const dir = fs.mkdtempSync(path.join(os.tmpdir(), "koyekola-audit-"));
process.env.DATA_DIR = path.join(dir, "data");
process.env.UPLOADS_DIR = path.join(dir, "uploads");
process.env.NODE_ENV = "test";
const db = require("../src/config/database");
const audit = require("../src/services/auditLog");

after(() => { db.close(); fs.rmSync(dir, { recursive: true, force: true }); });
const last = () => { const r = db.prepare("SELECT * FROM audit_log ORDER BY id DESC LIMIT 1").get(); return { ...r, details: JSON.parse(r.details) }; };

test("les valeurs sensibles sont masquées, à tout niveau d'imbrication", () => {
  audit.record({ id: 1, username: "Prof" }, { action: "course.updated", resourceType: "course", summary: "test", details: { title: "ok", password: "hunter2", nested: { api_key: "sk_live_x", list: [{ token: "t" }] }, Authorization: "Bearer x" } });
  const d = last().details;
  assert.equal(d.title, "ok");
  assert.equal(d.password, "[masqué]");
  assert.equal(d.nested.api_key, "[masqué]");
  assert.equal(d.nested.list[0].token, "[masqué]");
  assert.equal(d.Authorization, "[masqué]");
  assert.doesNotMatch(JSON.stringify(last()), /hunter2|sk_live_x/);
});

test("des détails trop volumineux sont tronqués (l'entrée est quand même écrite)", () => {
  audit.record({ id: 1, username: "Prof" }, { action: "course.updated", resourceType: "course", summary: "gros", details: { texte: "x".repeat(10000) } });
  assert.equal(last().details._tronque, true);
});

test("ne lève jamais d'erreur : action invalide, détails circulaires, acteur absent", () => {
  const before = db.prepare("SELECT COUNT(*) n FROM audit_log").get().n;
  assert.equal(audit.record(null, { action: "n'importe quoi", resourceType: "x", summary: "s" }), null, "format d'action invalide : refusé");
  assert.equal(audit.record(null, { action: "course.updated", resourceType: "", summary: "s" }), null);
  assert.equal(db.prepare("SELECT COUNT(*) n FROM audit_log").get().n, before);
  const circular = {}; circular.self = circular;
  assert.doesNotThrow(() => audit.record(null, { action: "course.updated", resourceType: "course", summary: "circulaire", details: circular }));
  assert.equal(last().actor_name, "", "acteur absent : « Système »");
  assert.doesNotThrow(() => audit.record(undefined, undefined));
});

test("résultat : seules les valeurs ok / refused / error sont acceptées", () => {
  audit.record(null, { action: "course.deleted", resourceType: "course", summary: "refus", result: "refused" });
  assert.equal(last().result, "refused");
  audit.record(null, { action: "course.deleted", resourceType: "course", summary: "bizarre", result: "n'importe quoi" });
  assert.equal(last().result, "ok");
});

test("recherche : les caractères % et _ sont cherchés tels quels", () => {
  audit.record(null, { action: "course.updated", resourceType: "course", summary: "remise de 100% offerte" });
  assert.equal(audit.list({ q: "100%" }).total, 1);
  assert.equal(audit.list({ q: "%" }).total, 1, "« % » ne correspond pas à tout");
  assert.equal(audit.list({ type: "inexistant!!" }).total, audit.list({}).total, "type invalide ignoré");
});
