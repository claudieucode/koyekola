// R3 (A-06) — plafond de droits par site : migration 073 (neutre pour l'existant), calcul des droits effectifs (cmsAccess.effectivePermissions),
// attribution et retrait du plafond (garde-fous anti-escalade, journal). Vraies migrations dans une base d'essai ; aucun serveur.
// Le module cmsAccess lit la base de l'application (DATA_DIR) : ce test crée lui-même un dossier de données jetable (jamais data/ du projet).
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
// Dossier de données JETABLE créé par ce test, AVANT toute lecture de la configuration : cmsAccess ouvre la base de l'application (DATA_DIR), jamais celle du projet.
const SCRATCH = fs.mkdtempSync(path.join(os.tmpdir(), "koyekola-r3-"));
process.env.DATA_DIR = path.join(SCRATCH, "data");
process.env.UPLOADS_DIR = path.join(SCRATCH, "uploads");
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { DatabaseSync } = require("node:sqlite");
const { migrate } = require("../src/marketing/db/migrate");
const { MIGRATIONS, quiet } = require("./marketing-helpers");
after(() => fs.rmSync(SCRATCH, { recursive: true, force: true }));
const skip = false;

describe("migration 073 : neutre pour l'existant", { skip }, () => {
  test("les affectations de site déjà en base reçoivent le mode « add » (comportement historique), sans autre changement", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "mig-r3-"));
    try {
      for (const f of fs.readdirSync(MIGRATIONS)) if (f < "073") fs.copyFileSync(path.join(MIGRATIONS, f), path.join(dir, f));
      const db = new DatabaseSync(":memory:");
      db.exec("PRAGMA foreign_keys = ON");
      db.exec("CREATE TABLE users (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT, email TEXT, password_hash TEXT DEFAULT 'x', role TEXT NOT NULL DEFAULT 'etudiant', status TEXT DEFAULT 'active', created_at TEXT DEFAULT (datetime('now')))");
      migrate(db, { dir, dbPath: ":memory:", log: quiet });
      db.exec("INSERT INTO mk_organizations (name, slug) VALUES ('A', 'a'); INSERT INTO users (username, email) VALUES ('u1','u1@ex.fr'), ('u2','u2@ex.fr')");
      db.exec("INSERT INTO mk_sites (organization_id, name, slug, tokens) VALUES (1, 'Alpha', 'alpha', '{}'), (1, 'Beta', 'beta', '{}')");
      db.exec("INSERT INTO mk_site_members (site_id, user_id, role) VALUES (1, 1, 'editor'), (2, 1, 'viewer'), (1, 2, 'admin')");
      assert.equal(db.prepare("SELECT COUNT(*) n FROM pragma_table_info('mk_site_members') WHERE name = 'mode'").get().n, 0); // base d'avant R3
      const before = db.prepare("SELECT site_id, user_id, role FROM mk_site_members ORDER BY site_id, user_id").all().map((r) => ({ ...r }));
      migrate(db, { dir: MIGRATIONS, dbPath: ":memory:", log: quiet });
      assert.ok(db.prepare("SELECT version FROM schema_migrations WHERE version = '073'").get());
      const after = db.prepare("SELECT site_id, user_id, role, mode FROM mk_site_members ORDER BY site_id, user_id").all();
      assert.deepEqual(after.map(({ mode, ...rest }) => ({ ...rest })), before);
      assert.ok(after.every((r) => r.mode === "add"));
      assert.throws(() => db.prepare("UPDATE mk_site_members SET mode = 'tout' WHERE site_id = 1").run(), /CHECK|constraint/i);
      db.close();
    } finally { fs.rmSync(dir, { recursive: true, force: true }); }
  });
});

describe("droits effectifs : le plafond ne peut que restreindre", { skip }, () => {
  let access, db, ORG, SITE_A, SITE_B;
  let seq = 0;
  const TEAM = ["owner", "admin", "editor", "author", "contributor", "viewer", null];
  const SITE = ["admin", "editor", "author", "contributor", "viewer"];
  const mkUser = (status = "active") => Number(db.prepare("INSERT INTO users (username, email, password_hash, status) VALUES (?, ?, 'x', ?)").run(`u${++seq}`, `u${seq}@ex.fr`, status).lastInsertRowid);
  // Ancienne formule, copiée de cmsAccess.effectivePermissions avant R3 : l'ORACLE du comportement historique
  const legacy = (userId, siteId) => {
    const user = db.prepare("SELECT status FROM users WHERE id = ?").get(userId);
    if (!user || (user.status && user.status !== "active")) return new Set();
    const out = new Set();
    const org = db.prepare("SELECT role FROM mk_org_members WHERE organization_id = ? AND user_id = ?").get(ORG, userId);
    if (org) access.permissionsOf(org.role).forEach((p) => out.add(p));
    const site = Number.isInteger(siteId) ? db.prepare("SELECT role FROM mk_site_members WHERE site_id = ? AND user_id = ?").get(siteId, userId) : null;
    if (site) access.permissionsOf(site.role).forEach((p) => out.add(p));
    return out;
  };
  const eff = (userId, siteId = null) => access.effectivePermissions(userId, { organizationId: ORG, siteId });
  const setup = (team, siteRole, mode, status) => {
    const id = mkUser(status);
    if (team) db.prepare("INSERT INTO mk_org_members (organization_id, user_id, role) VALUES (?, ?, ?)").run(ORG, id, team);
    if (siteRole) db.prepare("INSERT INTO mk_site_members (site_id, user_id, role, mode) VALUES (?, ?, ?, ?)").run(SITE_A, id, siteRole, mode);
    return id;
  };
  const isSubset = (a, b) => [...a].every((p) => b.has(p));
  const sameSet = (a, b) => a.size === b.size && isSubset(a, b);

  before(() => {
    db = require("../src/config/database");
    migrate(db, { dir: MIGRATIONS, dbPath: ":memory:", log: quiet });
    ORG = Number(db.prepare("INSERT INTO mk_organizations (name, slug) VALUES ('Org R3', 'org-r3')").run().lastInsertRowid);
    SITE_A = Number(db.prepare("INSERT INTO mk_sites (organization_id, name, slug, tokens) VALUES (?, 'Alpha', 'alpha', '{}')").run(ORG).lastInsertRowid);
    SITE_B = Number(db.prepare("INSERT INTO mk_sites (organization_id, name, slug, tokens) VALUES (?, 'Beta', 'beta', '{}')").run(ORG).lastInsertRowid);
    access = require("../src/services/cmsAccess");
  });

  test("mode « add » (valeur par défaut) : EXACTEMENT les droits d'avant R3, pour toutes les combinaisons rôle d'équipe × rôle de site", () => {
    let n = 0;
    for (const team of TEAM) for (const site of [null, ...SITE]) {
      const id = setup(team, site, "add");
      for (const siteId of [null, SITE_A, SITE_B]) { assert.ok(sameSet(eff(id, siteId), legacy(id, siteId)), `${team}/${site} sur ${siteId}`); n += 1; }
    }
    assert.ok(n >= 120);
  });
  test("une affectation créée sans mode a le mode « add »", () => {
    const id = mkUser();
    db.prepare("INSERT INTO mk_site_members (site_id, user_id, role) VALUES (?, ?, 'viewer')").run(SITE_A, id);
    assert.equal(db.prepare("SELECT mode FROM mk_site_members WHERE user_id = ?").get(id).mode, "add");
  });
  test("mode « limit » avec rôle d'équipe : intersection stricte — jamais un droit de plus que l'équipe, jamais un de plus que le rôle de site", () => {
    let narrower = 0, n = 0;
    for (const team of TEAM.filter(Boolean)) for (const site of SITE) {
      const id = setup(team, site, "limit");
      const got = eff(id, SITE_A);
      const t = access.permissionsOf(team), s = access.permissionsOf(site);
      assert.ok(isSubset(got, t) && isSubset(got, s), `${team}/${site} : dépasse un des deux rôles`);
      assert.ok(sameSet(got, new Set([...t].filter((p) => s.has(p)))), `${team}/${site} : n'est pas l'intersection`);
      assert.ok(isSubset(got, legacy(id, SITE_A)), "un plafond n'accorde jamais plus que l'union historique");
      if (got.size < legacy(id, SITE_A).size) narrower += 1;
      n += 1;
    }
    assert.ok(n >= 25 && narrower > 0, "le plafond restreint bien dans au moins un cas");
  });
  test("exemples parlants : équipe éditeur plafonnée par lecteur de site = lecteur ; équipe lecteur + éditeur de site plafonné = lecteur (pas d'élévation)", () => {
    const editorCappedByViewer = setup("editor", "viewer", "limit");
    assert.ok(eff(editorCappedByViewer, SITE_A).has("forms.read") && !eff(editorCappedByViewer, SITE_A).has("forms.write"));
    assert.ok(eff(editorCappedByViewer, SITE_B).has("forms.write"), "l'autre site n'est pas touché");
    assert.ok(eff(editorCappedByViewer, null).has("forms.write"), "l'organisation (sans site) n'est pas touchée");
    const viewerWithEditorLimited = setup("viewer", "editor", "limit");
    assert.ok(!eff(viewerWithEditorLimited, SITE_A).has("forms.write"), "un plafond ne peut pas élever");
    const viewerWithEditorAdd = setup("viewer", "editor", "add");
    assert.ok(eff(viewerWithEditorAdd, SITE_A).has("forms.write"), "témoin : en mode « add » l'union historique élève toujours");
  });
  test("accès limité à un site (sans rôle d'équipe) : le mode « limit » ne change rien (son plafond est son rôle de site) ; compte suspendu : aucun droit", () => {
    for (const site of SITE) {
      const a = setup(null, site, "add"), l = setup(null, site, "limit");
      assert.ok(sameSet(eff(a, SITE_A), eff(l, SITE_A)) && sameSet(eff(l, SITE_A), access.permissionsOf(site)));
    }
    assert.equal(eff(setup("editor", "viewer", "limit", "suspended"), SITE_A).size, 0);
  });
  test("un plafond sur le site A ne touche ni le site B, ni les écrans sans site, ni les autres personnes", () => {
    const capped = setup("admin", "viewer", "limit"), other = setup("admin", "viewer", "add");
    db.prepare("INSERT INTO mk_site_members (site_id, user_id, role, mode) VALUES (?, ?, 'editor', 'add')").run(SITE_B, capped);
    assert.ok(sameSet(eff(capped, SITE_B), legacy(capped, SITE_B)));
    assert.ok(sameSet(eff(capped, null), access.permissionsOf("admin")));
    assert.ok(sameSet(eff(other, SITE_A), legacy(other, SITE_A)));
  });

  describe("attribution et retrait du plafond", () => {
    const org = () => ORG;
    const actorOf = (id) => ({ id, perms: eff(id, null) });
    test("setSiteRole conserve le mode existant quand il n'est pas redemandé, et refuse un mode inconnu", () => {
      const owner = setup("owner", null, "add"), target = setup("editor", "viewer", "limit");
      access.setSiteRole(org(), actorOf(owner), target, SITE_A, "editor"); // changement de rôle sans mode
      assert.deepEqual({ ...db.prepare("SELECT role, mode FROM mk_site_members WHERE user_id = ? AND site_id = ?").get(target, SITE_A) }, { role: "editor", mode: "limit" });
      assert.throws(() => access.setSiteRole(org(), actorOf(owner), target, SITE_A, "editor", { mode: "tout" }), /Mode d'accès inconnu/);
    });
    test("un Super administrateur ne peut pas être plafonné", () => {
      const owner = setup("owner", null, "add"), boss2 = setup("owner", "viewer", "add");
      assert.throws(() => access.setSiteMode(org(), actorOf(owner), boss2, SITE_A, "limit"), /Super administrateur/);
      assert.throws(() => access.setSiteRole(org(), actorOf(owner), boss2, SITE_B, "viewer", { mode: "limit" }), /Super administrateur/);
    });
    test("setSiteMode : plafonner, journaliser, puis retirer le plafond ; pas sur soi-même ; pas sans affectation", () => {
      const owner = setup("owner", null, "add"), target = setup("editor", "viewer", "add");
      access.setSiteMode(org(), actorOf(owner), target, SITE_A, "limit");
      assert.ok(!eff(target, SITE_A).has("forms.write"));
      access.setSiteMode(org(), actorOf(owner), target, SITE_A, "add");
      assert.ok(eff(target, SITE_A).has("forms.write"));
      const logs = db.prepare("SELECT metadata FROM mk_audit_logs WHERE action = 'site_access.mode_changed' AND resource_id = ? ORDER BY id").all(String(target)).map((r) => JSON.parse(r.metadata));
      assert.deepEqual(logs.map((l) => [l.from, l.to]), [["add", "limit"], ["limit", "add"]]);
      assert.throws(() => access.setSiteMode(org(), actorOf(owner), owner, SITE_A, "limit"), /pas de|n'a pas d'accès|vous-même|votre/i);
      assert.throws(() => access.setSiteMode(org(), actorOf(owner), setup("editor", null, "add"), SITE_A, "limit"), /pas d'accès propre/);
    });
    test("retirer un plafond ÉLARGIT les droits : refusé à qui ne possède pas lui-même tous les droits du rôle de site (anti-escalade)", () => {
      const owner = setup("owner", null, "add");
      const lesser = setup("editor", null, "add"); // possède moins que « admin »
      const target = setup("viewer", "admin", "limit");
      assert.throws(() => access.setSiteMode(org(), actorOf(lesser), target, SITE_A, "add"), /droits que vous n'avez pas|vous ne pouvez pas/i);
      assert.equal(db.prepare("SELECT mode FROM mk_site_members WHERE user_id = ? AND site_id = ?").get(target, SITE_A).mode, "limit", "le plafond est resté");
      assert.doesNotThrow(() => access.setSiteMode(org(), actorOf(owner), target, SITE_A, "add"));
    });
  });
});
