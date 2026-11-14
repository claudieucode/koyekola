// Extensions — registre central, manifeste et versions (sans serveur) : validation stricte, cohérence du registre du produit, compatibilité.
const fs = require("node:fs");
const path = require("node:path");
const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const semver = require("../src/extensions/semver");
const manifest = require("../src/extensions/manifest");
const registry = require("../src/extensions/registry");
const { ICONS } = require("../src/utils/icons");

const ROOT = path.join(__dirname, "..");
const base = (id = "demo", over = {}) => ({
  id, name: "Extension de démonstration", description: "Une extension de test complète et valide.", icon: "plug", version: "1.2.3", publisher: "Kolakisa", category: "outils", availability: "available", maintenance: "stable", scope: "optional",
  compatibility: { kolakisa: ">=1.0.0" }, dependencies: [], conflicts: [], permissions: [], migrations: [], entry: {}, adminRoutes: [], publicRoutes: [], menus: [], settings: [], events: [], hooks: [], tasks: [], resources: {}, docs: "docs/extensions/README.md", ...over,
});

describe("versions : comparaison et plages", () => {
  test("ordre, plages ^ ~ >= < =, versions invalides refusées", () => {
    assert.equal(semver.compare("1.2.3", "1.10.0"), -1); assert.equal(semver.compare("2.0.0", "1.99.99"), 1); assert.equal(semver.compare("1.0.0", "1.0.0"), 0);
    for (const [v, r, ok] of [["1.4.0", "^1.2.0", true], ["2.0.0", "^1.2.0", false], ["1.2.9", "~1.2.0", true], ["1.3.0", "~1.2.0", false], ["1.0.0", ">=1.0.0", true], ["0.9.0", ">=1.0.0", false],
      ["1.5.0", ">=1.0.0 <2.0.0", true], ["2.0.0", ">=1.0.0 <2.0.0", false], ["1.0.0", "1.0.0", true], ["1.0.1", "=1.0.0", false], ["3.0.0", "*", true]]) assert.equal(semver.satisfies(v, r), ok, `${v} ${r}`);
    for (const bad of ["1", "1.0", "v1.0.0", "1.0.0-beta", "a.b.c", ""]) assert.equal(semver.valid(bad), false, bad);
    for (const bad of ["", "latest", ">=1", "^x", "1.0.0 ||"]) assert.equal(semver.validRange(bad), false, bad);
    assert.equal(semver.satisfies("1.0.0", "n'importe quoi"), false);
  });
});

describe("manifeste : validation stricte", () => {
  test("un manifeste complet est valide", () => assert.deepEqual(manifest.problems(base()), []));
  test("chaque défaut est signalé (table de cas)", () => {
    const cases = [
      ["id majuscule", { id: "Demo" }], ["id trop court", { id: "d" }], ["id avec chiffre", { id: "demo2" }], ["id avec tiret", { id: "de-mo" }], ["nom vide", { name: "" }], ["description courte", { description: "court" }],
      ["version invalide", { version: "1.0" }], ["éditeur absent", { publisher: "" }], ["catégorie inconnue", { category: "autre" }], ["disponibilité inconnue", { availability: "oui" }], ["maintenance inconnue", { maintenance: "x" }],
      ["portée inconnue", { scope: "partout" }], ["compatibilité absente", { compatibility: {} }], ["compatibilité invalide", { compatibility: { kolakisa: "beaucoup" } }], ["dépendances absentes", { dependencies: undefined }],
      ["dépendance invalide", { dependencies: [{ id: "Bad", range: "^1.0.0" }] }], ["auto-dépendance", { dependencies: [{ id: "demo", range: "^1.0.0" }] }], ["conflit avec soi", { conflicts: ["demo"] }],
      ["permission mal formée", { permissions: ["Shop"] }], ["migration mal nommée", { migrations: ["x.sql"] }], ["entrée invalide", { entry: { admin: "../../etc/passwd " } }], ["route invalide", { adminRoutes: ["("] }],
      ["menu incomplet", { menus: [{ key: "m", label: "M", icon: "plug", items: [{ key: "a" }] }] }], ["réglage sans type", { settings: [{ key: "a", label: "Réglage", default: 1 }] }],
      ["select sans options", { settings: [{ key: "a", type: "select", label: "Choix", default: "x" }] }], ["événement mal nommé", { events: ["Mauvais Nom"] }], ["ressource non publique", { resources: { css: ["css/a.css"] } }],
      ["documentation absente", { docs: "" }], ["champ inconnu", { nouveau: 1 }], ["icône majuscule", { icon: "Plug" }],
    ];
    for (const [label, over] of cases) assert.notDeepEqual(manifest.problems(base("demo", over)), [], label);
    assert.throws(() => manifest.validate(base("demo", { version: "x" })), (e) => e.code === "invalid_manifest" && e.problems.length >= 1 && /demo/.test(e.message));
    assert.notDeepEqual(manifest.problems(null), []); assert.notDeepEqual(manifest.problems([]), []);
  });
  test("compatibilité avec la version de Kolakisa : exigée par l'extension", () => {
    assert.deepEqual(manifest.problems(base("demo", { compatibility: { kolakisa: ">=1.0.0" } }), { kolakisaVersion: "1.4.0" }), []);
    assert.match(manifest.problems(base("demo", { compatibility: { kolakisa: ">=2.0.0" } }), { kolakisaVersion: "1.4.0" }).join(), /incompatible/);
  });
});

describe("registre : cohérence globale", () => {
  test("doublon, dépendance absente, version de dépendance non satisfaite, conflit inconnu, cycle, permission inconnue : refusés au démarrage", () => {
    assert.throws(() => registry.createRegistry([base("aa"), base("aa")]), /double/);
    assert.throws(() => registry.createRegistry([base("aa", { dependencies: [{ id: "bb", range: "^1.0.0" }] })]), /absente/);
    assert.throws(() => registry.createRegistry([base("aa", { dependencies: [{ id: "bb", range: "^2.0.0" }] }), base("bb")]), /exige/);
    assert.throws(() => registry.createRegistry([base("aa", { conflicts: ["zz"] })]), /conflit/);
    assert.throws(() => registry.createRegistry([base("aa", { dependencies: [{ id: "bb", range: "^1.0.0" }] }), base("bb", { dependencies: [{ id: "aa", range: "^1.0.0" }] })]), /circulaires/);
    assert.throws(() => registry.createRegistry([base("aa", { permissions: ["x.y"] })], { knownPermissions: new Set(["shop.read"]) }), /permissions inconnues/);
    assert.throws(() => registry.createRegistry([base("aa", { compatibility: { kolakisa: ">=9.0.0" } })]), /incompatible/);
  });
  test("le registre est figé : un manifeste ne peut pas être modifié à l'exécution", () => {
    const r = registry.createRegistry([base("aa")]);
    assert.throws(() => { "use strict"; r.get("aa").name = "autre"; }, TypeError);
    assert.equal(r.get("zz"), null); assert.equal(r.get(undefined), null); assert.equal(r.has("__proto__"), false);
  });
  test("registre du produit : six extensions historiques, identifiants stables, noms, fichiers, migrations, icônes et permissions réels", () => {
    const r = registry.load();
    assert.deepEqual([...r.ids].sort(), ["ai", "commerce", "lms", "scoring", "sms", "social"]);
    assert.equal(r.get("commerce").name, "Kolakisa Commerce"); assert.equal(r.get("lms").name, "Kolakisa LMS");
    const migDir = path.join(ROOT, "src", "marketing", "migrations");
    for (const m of r.list()) {
      assert.ok(Object.hasOwn(ICONS, m.icon), `${m.id} : icône ${m.icon} inexistante`);
      assert.ok(fs.existsSync(path.join(ROOT, m.docs)), `${m.id} : documentation ${m.docs} introuvable`);
      for (const f of m.migrations) if (f !== "core") assert.ok(fs.existsSync(path.join(migDir, f)), `${m.id} : migration ${f} introuvable`);
      for (const [k, f] of Object.entries(m.entry)) assert.ok(fs.existsSync(path.join(ROOT, f)), `${m.id} : entry.${k} ${f} introuvable`);
      for (const g of m.menus) for (const it of g.items) assert.ok(Object.hasOwn(ICONS, g.icon), `${m.id} : icône de menu`);
    }
  });
  test("tous les chemins d'administration et publics appartiennent à UNE seule extension", () => {
    const r = registry.load();
    const samples = ["/sms/x", "/contacts/12/sms", "/reseaux", "/score/regles", "/ia/site", "/revenus", "/boutique/commandes", "/site-web/boutique", "/formateur/cours/1", "/catalogue", "/cours/x", "/apprendre/x", "/panier", "/commande", "/certificat/x"];
    for (const p of samples) { const hits = r.list().filter((m) => [...m.adminRoutes, ...m.publicRoutes].some((re) => new RegExp(re).test(p))).map((m) => m.id); assert.ok(hits.length <= 1, `${p} appartient à ${hits}`); }
    assert.equal(r.ownerOfPath("admin", "/pages"), null); assert.equal(r.ownerOfPath("public", "/"), null); assert.equal(r.ownerOfPath("public", "/blog/x"), null);
  });
  test("ajouter une extension = ajouter un fichier manifeste : le noyau n'est pas modifié (le registre lit le dossier)", () => {
    const src = fs.readFileSync(path.join(ROOT, "src", "extensions", "registry.js"), "utf8");
    assert.match(src, /readdirSync\(dir\)/);
    const files = fs.readdirSync(path.join(ROOT, "src", "extensions", "manifests"));
    assert.deepEqual(files.map((f) => f.replace(/\.js$/, "")).sort(), [...registry.load().ids].sort(), "un fichier par extension, nommé comme son identifiant");
  });
});
