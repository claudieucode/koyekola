// Extensions — moteur d'activation par site (base synthétique réelle, migrations réelles) : atomicité, dépendances, conflits, confirmation, isolation, cache, journal, paramètres, conservation des données.
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { test, describe, before, after, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const { DatabaseSync } = require("node:sqlite");
const { migrate } = require("../src/marketing/db/migrate");
const { freshMarketing, MIGRATIONS, quiet } = require("./marketing-helpers");
const registry = require("../src/extensions/registry");
const state = require("../src/extensions/state");
const activation = require("../src/extensions/activation");

const mf = (id, over = {}) => ({
  id, name: `Extension ${id}`, description: "Extension de test complète et valide.", icon: "plug", version: "1.0.0", publisher: "Test", category: "outils", availability: "available", maintenance: "stable", scope: "optional",
  compatibility: { kolakisa: ">=1.0.0" }, dependencies: [], conflicts: [], permissions: [], migrations: [], entry: {}, adminRoutes: [], publicRoutes: [], menus: [], settings: [], events: [], hooks: [], tasks: [], resources: {}, docs: "docs/extensions/README.md", ...over,
});
const FIXTURES = () => registry.createRegistry([
  mf("demo_base"),
  mf("demo_dep", { dependencies: [{ id: "demo_base", range: "^1.0.0" }] }),
  mf("demo_conflit", { conflicts: ["demo_base"] }),
  mf("demo_ok", { entry: { lifecycle: "tests/fixtures/extension-lifecycle-ok.js" } }),
  mf("demo_echec", { entry: { lifecycle: "tests/fixtures/extension-lifecycle-fail.js" } }),
  mf("demo_maint", { maintenance: "maintenance" }),
  mf("demo_absente", { availability: "unavailable" }),
  mf("demo_obsolete", { maintenance: "deprecated" }),
  mf("demo_reglages", { settings: [{ key: "devise", type: "select", label: "Devise", default: "eur", options: ["eur", "usd"] }, { key: "seuil", type: "number", label: "Seuil", default: 3 }, { key: "actif", type: "boolean", label: "Actif", default: false }, { key: "note", type: "string", label: "Note", default: "" }] }),
]);

let restore;
before(() => { restore = registry.override(FIXTURES()); });
after(() => restore());

const world = () => {
  const m = freshMarketing();
  m.db.exec("INSERT INTO users (id, username, email) VALUES (7, 'admin', 'admin@x.fr')");
  m.db.exec("INSERT INTO mk_sites (organization_id, name, slug, tokens) VALUES (1, 'S1', 's1', '{}'), (1, 'S2', 's2', '{}'), (2, 'Autre', 'autre', '{}')");
  return { ...m, S1: { ...m.A, siteScope: 1 }, S2: { ...m.A, siteScope: 2 } };
};
const on = (w, site, id) => state.isEnabled(w.db, 1, site, id);
const events = (w, where = "1 = 1") => w.db.prepare(`SELECT site_id, extension, action FROM mk_extension_events WHERE ${where} ORDER BY id`).all().map((r) => ({ ...r }));
const code = (fn) => { try { fn(); return null; } catch (e) { return e.code; } };

describe("migration 153 : journal en lecture seule, paramètres, organisation cohérente", () => {
  test("tables vides et additives ; journal non modifiable ni supprimable ; organisation du site vérifiée ; rejouée : rien", () => {
    const w = world();
    assert.equal(w.db.prepare("SELECT COUNT(*) n FROM mk_extension_events").get().n, 0);
    assert.equal(w.db.prepare("SELECT COUNT(*) n FROM mk_extension_settings").get().n, 0);
    w.db.prepare("INSERT INTO mk_extension_events (organization_id, site_id, extension, action) VALUES (1, 1, 'demo_base', 'enable')").run();
    assert.throws(() => w.db.prepare("UPDATE mk_extension_events SET action = 'disable'").run(), /lecture seule/);
    assert.throws(() => w.db.prepare("DELETE FROM mk_extension_events").run(), /lecture seule/);
    assert.throws(() => w.db.prepare("INSERT INTO mk_extension_events (organization_id, site_id, extension, action) VALUES (1, 3, 'demo_base', 'enable')").run(), /même organisation/);
    assert.throws(() => w.db.prepare("INSERT INTO mk_extension_events (organization_id, site_id, extension, action) VALUES (1, 1, 'Demo', 'enable')").run(), /CHECK|constraint/i);
    assert.throws(() => w.db.prepare("INSERT INTO mk_extension_events (organization_id, site_id, extension, action) VALUES (1, 1, 'demo_base', 'inconnue')").run(), /CHECK|constraint/i);
    assert.deepEqual(migrate(w.db, { dir: MIGRATIONS, dbPath: ":memory:", log: quiet }).applied, []);
    assert.equal(w.db.prepare("PRAGMA foreign_key_check").all().length, 0);
  });
});

describe("activation : règles, atomicité, journal", () => {
  let w; beforeEach(() => { w = world(); });

  test("désactivé par défaut ; activation puis désactivation (confirmée) ; idempotent ; chaque opération est journalisée avec la version", () => {
    assert.equal(on(w, 1, "demo_base"), false);
    assert.deepEqual(activation.enable(w.A, 1, "demo_base"), { changed: true, enabled: true });
    assert.equal(on(w, 1, "demo_base"), true);
    assert.deepEqual(activation.enable(w.A, 1, "demo_base"), { changed: false, enabled: true }, "idempotent : aucun nouvel événement");
    assert.equal(code(() => activation.disable(w.A, 1, "demo_base")), "confirm_required", "la désactivation exige une confirmation");
    assert.equal(on(w, 1, "demo_base"), true, "refusée : rien n'a changé");
    assert.deepEqual(activation.disable(w.A, 1, "demo_base", { confirm: true }), { changed: true, enabled: false });
    assert.equal(on(w, 1, "demo_base"), false);
    assert.deepEqual(events(w, "action IN ('enable','disable')"), [{ site_id: 1, extension: "demo_base", action: "enable" }, { site_id: 1, extension: "demo_base", action: "disable" }]);
    assert.equal(w.db.prepare("SELECT version FROM mk_extension_events WHERE action = 'enable'").get().version, "1.0.0");
    assert.equal(w.db.prepare("SELECT COUNT(*) n FROM mk_audit_logs WHERE action IN ('site_module.enabled','site_module.disabled')").get().n, 2, "journal d'audit du CMS aussi");
  });
  test("dépendance : activer l'extension dépendante est refusé tant que la base n'est pas active ; désactiver la base est refusé tant que l'autre est active", () => {
    assert.equal(code(() => activation.enable(w.A, 1, "demo_dep")), "dependency_missing");
    assert.equal(on(w, 1, "demo_dep"), false);
    activation.enable(w.A, 1, "demo_base"); activation.enable(w.A, 1, "demo_dep");
    assert.equal(on(w, 1, "demo_dep"), true);
    assert.equal(code(() => activation.disable(w.A, 1, "demo_base", { confirm: true })), "dependents_active");
    assert.equal(on(w, 1, "demo_base"), true);
    activation.disable(w.A, 1, "demo_dep", { confirm: true }); activation.disable(w.A, 1, "demo_base", { confirm: true });
    assert.equal(on(w, 1, "demo_base"), false);
    assert.ok(events(w, "action = 'refused'").length >= 2, "les refus sont journalisés");
  });
  test("conflit, extension indisponible, en maintenance : refus ; obsolète : confirmation exigée", () => {
    activation.enable(w.A, 1, "demo_base");
    assert.equal(code(() => activation.enable(w.A, 1, "demo_conflit")), "conflict");
    assert.equal(code(() => activation.enable(w.A, 1, "demo_absente")), "unavailable");
    assert.equal(code(() => activation.enable(w.A, 1, "demo_maint")), "maintenance");
    assert.equal(code(() => activation.enable(w.A, 1, "demo_obsolete")), "confirm_required");
    assert.deepEqual(activation.enable(w.A, 1, "demo_obsolete", { confirm: true }), { changed: true, enabled: true });
    assert.equal(on(w, 2, "demo_conflit"), false);
  });
  test("plan : dit ce qui se passerait sans rien écrire", () => {
    const before = w.db.prepare("SELECT COUNT(*) n FROM mk_site_modules").get().n;
    const p = activation.plan(w.A, 1, "demo_dep", true);
    assert.equal(p.blockers[0].code, "dependency_missing"); assert.equal(p.enabledNow, false);
    assert.match(activation.plan(w.A, 1, "demo_base", false).effects.join(" "), /Aucune donnée n'est supprimée/);
    assert.equal(w.db.prepare("SELECT COUNT(*) n FROM mk_site_modules").get().n, before);
  });
  test("ATOMIQUE : si l'étape propre à l'extension échoue, l'état revient exactement à ce qu'il était, l'échec est journalisé, rien d'autre n'est écrit", () => {
    const snap = () => JSON.stringify([w.db.prepare("SELECT * FROM mk_site_modules").all(), w.db.prepare("SELECT * FROM mk_extension_settings").all()]);
    const before = snap();
    assert.equal(code(() => activation.enable(w.A, 1, "demo_echec")), "activation_failed");
    assert.equal(snap(), before, "aucune ligne d'état, aucun effet de bord");
    assert.equal(on(w, 1, "demo_echec"), false, "le cache ne garde pas un état fantôme");
    assert.deepEqual(events(w, "extension = 'demo_echec'"), [{ site_id: 1, extension: "demo_echec", action: "failed" }]);
    // désactivation qui échoue : l'extension reste active
    const r2 = registry.override(registry.createRegistry([mf("demo_echec", { entry: { lifecycle: "tests/fixtures/extension-lifecycle-ok.js" } })]));
    activation.enable(w.A, 1, "demo_echec"); r2();
    const r3 = registry.override(registry.createRegistry([mf("demo_echec", { entry: { lifecycle: "tests/fixtures/extension-lifecycle-fail.js" } })]));
    assert.equal(code(() => activation.disable(w.A, 1, "demo_echec", { confirm: true })), "activation_failed");
    assert.equal(state.isEnabled(w.db, 1, 1, "demo_echec"), true, "toujours active : la désactivation annulée n'a rien changé"); r3();
  });
  test("l'étape de l'extension s'exécute DANS la transaction (preuve : la ligne qu'elle écrit existe après l'activation)", () => {
    activation.enable(w.A, 1, "demo_ok");
    assert.equal(w.db.prepare("SELECT value FROM mk_extension_settings WHERE site_id = 1 AND extension = 'demo_ok' AND key = 'initialise'").get().value, "1");
  });
  test("accès : jamais une personne limitée à un site ; permission sites.modules exigée si le contexte la porte ; site inconnu, supprimé, d'une autre organisation, principal : introuvable ; extension inconnue refusée", () => {
    assert.equal(code(() => activation.enable(w.S1, 1, "demo_base")), "forbidden");
    assert.equal(code(() => activation.enable(w.S1, 2, "demo_base")), "forbidden");
    assert.equal(code(() => activation.enable({ ...w.A, can: () => false }, 1, "demo_base")), "forbidden");
    assert.doesNotThrow(() => activation.enable({ ...w.A, can: (p) => p === "sites.modules" }, 1, "demo_base"));
    assert.equal(code(() => activation.enable(w.A, 3, "demo_base")), "not_found", "site d'une autre organisation");
    assert.equal(code(() => activation.enable(w.A, 999, "demo_base")), "not_found");
    assert.equal(code(() => activation.enable(w.A, 1, "inconnue")), "invalid_field");
    w.db.exec("UPDATE mk_sites SET deleted_at = datetime('now') WHERE id = 2");
    assert.equal(code(() => activation.enable(w.A, 2, "demo_base")), "not_found", "site supprimé");
    assert.equal(w.db.prepare("SELECT COUNT(*) n FROM mk_site_modules WHERE site_id IN (2, 3)").get().n, 0);
  });
});

describe("isolation entre sites, cache, conservation des données", () => {
  test("trois sites, trois configurations simultanées et indépendantes ; l'organisation B ne voit rien", () => {
    const w = world();
    activation.enable(w.A, 1, "demo_base"); activation.enable(w.A, 1, "demo_ok"); activation.enable(w.A, 2, "demo_reglages");
    assert.deepEqual([...state.enabledIds(w.db, 1, 1)].sort(), ["demo_base", "demo_ok"]);
    assert.deepEqual([...state.enabledIds(w.db, 1, 2)], ["demo_reglages"]);
    assert.deepEqual(state.enabledIds(w.db, 2, 3), []);
    assert.equal(state.isEnabled(w.db, 2, 1, "demo_base"), false, "mauvaise organisation pour ce site : jamais activée");
    activation.disable(w.A, 1, "demo_base", { confirm: true });
    assert.equal(on(w, 1, "demo_base"), false); assert.equal(on(w, 1, "demo_ok"), true); assert.equal(on(w, 2, "demo_reglages"), true, "désactiver sur S1 ne touche pas S2");
    assert.equal(state.isEnabled(w.db, 1, null, "demo_base"), false, "extension « optional » : le principal n'est pas toujours actif");
    assert.equal(state.isEnabled(w.db, 1, 0, "demo_base"), false); assert.equal(state.isEnabled(w.db, 1, "1", "demo_ok"), false); assert.equal(state.isEnabled(w.db, 1, 1, "__proto__"), false);
  });
  test("site principal : toujours actif pour une extension « always_on_primary », inchangé pour les six historiques", () => {
    const w = world();
    const r = registry.override(registry.createRegistry([mf("demo_hist", { scope: "always_on_primary" })]));
    assert.equal(state.isEnabled(w.db, 1, null, "demo_hist"), true); assert.equal(state.isEnabled(w.db, 1, undefined, "demo_hist"), true); assert.equal(state.isEnabled(w.db, 1, 1, "demo_hist"), false); r();
    const real = registry.override(null); // registre du produit
    try { for (const id of ["sms", "ai", "social", "scoring", "commerce", "lms"]) { assert.equal(state.isEnabled(w.db, 1, null, id), true, id); assert.equal(state.isEnabled(w.db, 1, 1, id), false, `${id} : désactivé par défaut pour un site`); } } finally { real(); }
  });
  test("cache : invalidé à chaque activation / désactivation de cette connexion", () => {
    const w = world();
    assert.equal(on(w, 1, "demo_base"), false);
    const hits = state.stats.hits;
    assert.equal(on(w, 1, "demo_base"), false); assert.ok(state.stats.hits > hits, "la deuxième lecture vient du cache");
    activation.enable(w.A, 1, "demo_base"); assert.equal(on(w, 1, "demo_base"), true, "visible immédiatement");
    activation.disable(w.A, 1, "demo_base", { confirm: true }); assert.equal(on(w, 1, "demo_base"), false);
  });
  test("cache : une écriture faite par UN AUTRE processus (autre connexion) est vue au contrôle suivant", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "ext-cache-"));
    const file = path.join(dir, "t.db");
    try {
      const a = new DatabaseSync(file); a.exec("PRAGMA foreign_keys = ON; PRAGMA journal_mode = WAL");
      a.exec("CREATE TABLE users (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT, email TEXT, password_hash TEXT DEFAULT 'x', role TEXT NOT NULL DEFAULT 'etudiant', created_at TEXT DEFAULT (datetime('now')))");
      migrate(a, { dir: MIGRATIONS, dbPath: file, log: quiet });
      a.exec("INSERT INTO mk_organizations (name, slug) VALUES ('A', 'a')"); a.exec("INSERT INTO mk_sites (organization_id, name, slug, tokens) VALUES (1, 'S1', 's1', '{}')");
      assert.equal(state.isEnabled(a, 1, 1, "demo_base"), false);
      const b = new DatabaseSync(file);
      b.prepare("INSERT INTO mk_site_modules (site_id, organization_id, module, enabled) VALUES (1, 1, 'demo_base', 1)").run(); b.close();
      assert.equal(state.isEnabled(a, 1, 1, "demo_base"), true, "pas de valeur périmée");
      a.close();
    } finally { fs.rmSync(dir, { recursive: true, force: true }); }
  });
  test("désactiver ne supprime AUCUNE donnée : les lignes de l'extension survivent, et la réactivation les retrouve", () => {
    const w = world();
    activation.enable(w.A, 1, "demo_reglages");
    activation.setSetting(w.A, 1, "demo_reglages", "devise", "usd");
    w.db.exec("INSERT INTO mk_shop_categories (organization_id, site_id, name, slug) VALUES (1, 1, 'Cat S1', 'cat-s1'), (1, 2, 'Cat S2', 'cat-s2')");
    const rows = () => JSON.stringify(w.db.prepare("SELECT * FROM mk_shop_categories ORDER BY id").all());
    const dataBefore = rows();
    activation.disable(w.A, 1, "demo_reglages", { confirm: true });
    assert.equal(rows(), dataBefore, "données métier intactes");
    assert.equal(w.db.prepare("SELECT value FROM mk_extension_settings WHERE site_id = 1 AND key = 'devise'").get().value, "usd", "paramètres conservés");
    activation.enable(w.A, 1, "demo_reglages");
    assert.equal(activation.getSettings(w.A, 1, "demo_reglages").find((s) => s.key === "devise").value, "usd", "réactivation : paramètres retrouvés");
  });
});

describe("paramètres par site et historique", () => {
  test("validés par le manifeste ; refusés si l'extension est désactivée ; isolés par site ; journalisés", () => {
    const w = world();
    assert.equal(code(() => activation.setSetting(w.A, 1, "demo_reglages", "devise", "usd")), "module_disabled");
    activation.enable(w.A, 1, "demo_reglages"); activation.enable(w.A, 2, "demo_reglages");
    activation.setSetting(w.A, 1, "demo_reglages", "devise", "usd"); activation.setSetting(w.A, 1, "demo_reglages", "seuil", "7"); activation.setSetting(w.A, 1, "demo_reglages", "actif", "1");
    const get = (site) => Object.fromEntries(activation.getSettings(w.A, site, "demo_reglages").map((s) => [s.key, s.value]));
    assert.deepEqual(get(1), { devise: "usd", seuil: 7, actif: true, note: "" });
    assert.deepEqual(get(2), { devise: "eur", seuil: 3, actif: false, note: "" }, "le site 2 garde ses valeurs par défaut");
    assert.equal(code(() => activation.setSetting(w.A, 1, "demo_reglages", "devise", "yen")), "invalid_field");
    assert.equal(code(() => activation.setSetting(w.A, 1, "demo_reglages", "seuil", "beaucoup")), "invalid_field");
    assert.equal(code(() => activation.setSetting(w.A, 1, "demo_reglages", "inconnu", "x")), "invalid_field");
    assert.equal(code(() => activation.setSetting(w.S1, 1, "demo_reglages", "devise", "eur")), "forbidden");
    assert.equal(code(() => activation.getSettings(w.S2, 1, "demo_reglages")), "forbidden", "un accès limité au site 2 ne lit pas les paramètres du site 1");
    assert.ok(events(w, "action = 'settings'").length >= 3);
  });
  test("historique : récent d'abord, filtré par site et par extension ; un accès limité ne voit que SON site ; l'autre organisation, rien", () => {
    const w = world();
    activation.enable(w.A, 1, "demo_base"); activation.enable(w.A, 2, "demo_ok"); activation.enable(w.A, 2, "demo_base");
    const all = activation.history(w.A);
    assert.equal(all.length, 3); assert.equal(all[0].extension, "demo_base"); assert.equal(all[0].site_id, 2);
    assert.deepEqual(activation.history(w.A, { siteId: 1 }).map((e) => e.extension), ["demo_base"]);
    assert.deepEqual(activation.history(w.A, { extension: "demo_ok" }).map((e) => e.site_id), [2]);
    assert.deepEqual(activation.history(w.S1).map((e) => e.site_id), [1], "limité au site 1 : jamais les événements du site 2");
    assert.deepEqual(activation.history(w.B), [], "autre organisation : rien");
    assert.ok(activation.history(w.A, { limit: 1 }).length === 1 && activation.history(w.A, { limit: 99999 }).length === 3);
  });
});
