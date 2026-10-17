// R7 (lot 6.2) — la transition « ai » (src/marketing/transitions.js) doit retenir EXACTEMENT les sites où une personne hors équipe obtient `forms.write`
// du code de production (cmsAccess.effectivePermissions), sur les droits réels (rôles du système et personnalisés, comptes suspendus, équipe).
// cmsAccess lit la base de l'application : dossier de données JETABLE créé par ce test (jamais data/ du projet) ; aucun serveur.
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const SCRATCH = fs.mkdtempSync(path.join(os.tmpdir(), "koyekola-r7ia-"));
process.env.DATA_DIR = path.join(SCRATCH, "data");
process.env.UPLOADS_DIR = path.join(SCRATCH, "uploads");
const { test, after } = require("node:test");
const assert = require("node:assert/strict");
const { migrate } = require("../src/marketing/db/migrate");
const { MIGRATIONS, quiet } = require("./marketing-helpers");
after(() => fs.rmSync(SCRATCH, { recursive: true, force: true }));

test("sites retenus par la transition = sites où le code de production accorde forms.write à une personne hors équipe", () => {
  const db = require("../src/config/database");
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "mig-r7ia-"));
  for (const f of fs.readdirSync(MIGRATIONS)) if (f < "086") fs.copyFileSync(path.join(MIGRATIONS, f), path.join(dir, f));
  migrate(db, { dir, dbPath: ":memory:", log: quiet });
  fs.rmSync(dir, { recursive: true, force: true });
  const access = require("../src/services/cmsAccess");
  const transitions = require("../src/marketing/transitions");
  for (let i = 1; i <= 9; i++) db.prepare("INSERT INTO users (username, email, password_hash) VALUES (?, ?, 'x')").run(`eq${i}`, `eq${i}@x.fr`);
  const uid = (n) => Number(db.prepare("SELECT id FROM users WHERE username = ?").get(`eq${n}`).id);
  db.exec(`UPDATE users SET status = 'suspended' WHERE id = ${uid(6)}`);
  const org = Number(db.prepare("INSERT INTO mk_organizations (name, slug) VALUES ('Eq', 'eq-r7ia')").run().lastInsertRowid);
  db.prepare("INSERT INTO mk_org_members (organization_id, user_id, role) VALUES (?, ?, 'editor')").run(org, uid(5));
  db.prepare("INSERT INTO mk_roles (organization_id, key, name, permissions) VALUES (?, 'redacteur', 'Rédacteur', ?), (?, 'lecteurplus', 'Lecteur plus', ?)").run(org, JSON.stringify(["forms.write"]), org, JSON.stringify(["forms.read"]));
  access.invalidate();
  const cas = [["editor", 1], ["admin", 2], ["viewer", 3], ["author", 4], ["contributor", 7], ["redacteur", 8], ["lecteurplus", 9], ["editor", 6], ["editor", 5]];
  const sites = cas.map(([role, n], i) => {
    const id = Number(db.prepare("INSERT INTO mk_sites (organization_id, name, slug, tokens) VALUES (?, ?, ?, '{}')").run(org, `S${i}`, `s${i}`).lastInsertRowid);
    db.prepare("INSERT INTO mk_site_members (site_id, user_id, role) VALUES (?, ?, ?)").run(id, uid(n), role);
    return { id, user: uid(n) };
  });
  const attendu = sites.filter(({ id, user }) => !db.prepare("SELECT 1 FROM mk_org_members WHERE organization_id = ? AND user_id = ?").get(org, user) && access.effectivePermissions(user, { organizationId: org, siteId: id }).has("forms.write")).map((s) => s.id);
  assert.ok(attendu.length >= 3, "le contrôle est significatif (éditeur, administrateur, rôle personnalisé)");
  assert.ok(attendu.length < sites.length - 3, "le contrôle exclut bien lecteurs, comptes suspendus et équipe");
  assert.deepEqual(transitions.aiEligibility(db).eligible.map((e) => e.siteId), attendu);
});
