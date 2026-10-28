// Index de performance (TITAN XXXI) : les requêtes lancées à chaque page d'administration ne parcourent pas toute une table qui grossit.
const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const ROOT = path.join(__dirname, "..");
const inFreshDb = (script) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "perf-idx-"));
  const r = spawnSync(process.execPath, ["-e", script], { cwd: ROOT, encoding: "utf8", env: { ...process.env, DATA_DIR: dir, NODE_ENV: "test", ENCRYPTION_KEY: "0".repeat(64) } });
  fs.rmSync(dir, { recursive: true, force: true });
  assert.equal(r.status, 0, r.stderr);
  return JSON.parse(r.stdout.trim().split("\n").pop());
};

test("comptes élèves et messages de contact récents : retrouvés par index, sans parcourir toute la table", () => {
  const plans = inFreshDb(`const db = require("./src/config/database");
    const plan = (sql) => db.prepare("EXPLAIN QUERY PLAN " + sql).all().map((r) => r.detail).join(" | ");
    console.log(JSON.stringify({
      users: plan("SELECT u.id FROM users u WHERE u.role = 'etudiant' AND u.created_at > ?"),
      messages: plan("SELECT m.id FROM contact_messages m WHERE m.created_at > ?"),
      index: db.prepare("SELECT name FROM sqlite_master WHERE type = 'index' AND name IN ('idx_users_role_created', 'idx_contact_messages_created') ORDER BY name").all().map((r) => r.name),
    }))`);
  assert.deepEqual(plans.index, ["idx_contact_messages_created", "idx_users_role_created"]);
  assert.match(plans.users, /SEARCH .* USING (COVERING )?INDEX idx_users_role_created/);
  assert.match(plans.messages, /SEARCH .* USING (COVERING )?INDEX idx_contact_messages_created/);
});

test("le compteur de notifications reste rapide avec beaucoup de comptes (garde-fou large : 30 000 comptes < 12 ms par appel)", () => {
  const r = inFreshDb(`const db = require("./src/config/database");
    db.exec("BEGIN"); db.prepare("INSERT INTO users(username,email,password_hash,role) VALUES ('prof','p@x.t','h','formateur')").run();
    const U = db.prepare("INSERT INTO users(username,email,password_hash,role,created_at) VALUES (?,?,?,?,datetime('now',?))");
    for (let i = 0; i < 30000; i++) U.run("u" + i, "u" + i + "@x.t", "h", "etudiant", "-" + (i % 900) + " days"); db.exec("COMMIT");
    const act = require("./src/services/gestion/activity"); const me = db.prepare("SELECT id FROM users WHERE role='formateur'").get().id;
    act.unreadCount(me, null); const t = process.hrtime.bigint(); for (let i = 0; i < 30; i++) act.unreadCount(me, null);
    console.log(JSON.stringify({ ms: Number(process.hrtime.bigint() - t) / 1e6 / 30 }))`);
  assert.ok(r.ms < 12, `${r.ms.toFixed(1)} ms par appel`);
});
