// Apparence → Menus (service, sans serveur) : registres d'emplacements et de sources d'extensions, validation des classes CSS, enregistrement tout-ou-rien, versions,
// emplacements par site, recherche de menus. Le service lit la base de l'application : dossier de données JETABLE créé ici (jamais data/ du projet).
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const SCRATCH = fs.mkdtempSync(path.join(os.tmpdir(), "koyekola-menus-"));
process.env.DATA_DIR = path.join(SCRATCH, "data"); process.env.UPLOADS_DIR = path.join(SCRATCH, "uploads");
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { migrate } = require("../src/marketing/db/migrate");
const { MIGRATIONS, quiet } = require("./marketing-helpers");
after(() => fs.rmSync(SCRATCH, { recursive: true, force: true }));

describe("menus : service", () => {
  let db, nav, S1, S2, org;
  const code = (fn) => { try { fn(); } catch (e) { return `${e.status || ""} ${e.message}`.trim(); } return null; };
  const cu = (label, url, extra = {}) => ({ type: "custom", label, url, ...extra });
  before(() => {
    db = require("../src/config/database"); migrate(db, { dir: MIGRATIONS, dbPath: ":memory:", log: quiet });
    nav = require("../src/services/navigation");
    org = Number(db.prepare("INSERT INTO mk_organizations (name, slug) VALUES ('Org', 'org-menus')").run().lastInsertRowid);
    const site = (n) => Number(db.prepare("INSERT INTO mk_sites (organization_id, name, slug, tokens) VALUES (?, ?, ?, '{}')").run(org, n, n.toLowerCase()).lastInsertRowid);
    S1 = site("Un"); S2 = site("Deux");
  });

  test("la migration 098 ajoute les trois colonnes avec des valeurs par défaut ; les menus existants gardent la version 1", () => {
    const cols = (t) => db.prepare(`PRAGMA table_info(${t})`).all().reduce((o, c) => ({ ...o, [c.name]: c.dflt_value }), {});
    assert.equal(cols("nav_menus").revision, "1"); assert.equal(cols("nav_items").css_class, "''"); assert.equal(cols("nav_items").title_attr, "''");
    assert.equal(nav.create({ name: "Neuf" }).revision, 1);
  });
  test("classes CSS : jetons valides acceptés, doublons fusionnés ; invalides ou plus de cinq refusés", () => {
    assert.equal(nav.cleanClasses("  a  b a _c d-e "), "a b _c d-e"); assert.equal(nav.cleanClasses(""), "");
    for (const bad of ["9a", "a<b", 'x"y', "a;b", "a b c d e f", "é", "x".repeat(41)]) assert.match(code(() => nav.cleanClasses(bad)), /Classe CSS|Cinq classes/, bad);
  });
  test("emplacements : le registre central est extensible ; un emplacement inconnu est refusé ; un menu étranger aussi", () => {
    nav.registerLocation({ key: "compte", label: "Menu du compte", hint: "…" });
    try {
      const m = nav.create({ name: "Compte", siteId: S1 });
      nav.assign("compte", m.id, { siteId: S1 }); assert.equal(nav.assignments({ siteId: S1 }).compte, m.id);
      assert.equal(nav.assignments({ siteId: S2 }).compte, undefined, "affectation propre au site");
      assert.match(code(() => nav.assign("compte", m.id, { siteId: S2 })), /autre site/);
      assert.match(code(() => nav.assign("inexistant", m.id, { siteId: S1 })), /Emplacement inconnu/);
    } finally { delete nav.LOCATIONS.compte; }
    const m2 = nav.listMenus({ siteId: S1 }).find((m) => m.name === "Compte");
    assert.ok(m2, "le menu est conservé quand l'emplacement disparaît du registre"); assert.deepEqual(m2.locations, ["compte"]);
    assert.equal(nav.forLocation("compte", { siteId: S1 }), null, "un emplacement retiré n'affiche plus rien");
  });
  test("sources d'extensions : disponibilité par site, adresses dangereuses écartées, jamais d'erreur si le module plante, retrait sans effet sur les menus", () => {
    assert.deepEqual(nav.sourcesFor(S1), []);
    nav.registerSource("boutique", { label: "Boutique", available: (id) => id === S1, search: (t) => [{ id: "a", title: "Boutique", url: "/boutique" }, { id: "b", title: "Piège", url: "javascript:alert(1)" }, { id: "c", title: "Mon <compte>", url: "/compte" }].filter((r) => r.title.toLowerCase().includes(t.toLowerCase())) });
    nav.registerSource("casse", { label: "Cassée", search: () => { throw new Error("module en panne"); } });
    nav.registerSource("indispo", { label: "Indisponible", available: () => { throw new Error("boom"); }, search: () => [] });
    try {
      assert.deepEqual(nav.sourcesFor(S1).map((s) => s.key), ["boutique", "casse"]);
      assert.deepEqual(nav.sourcesFor(S2).map((s) => s.key), ["casse"]);
      assert.deepEqual(nav.searchSource("boutique", "", 20, { siteId: S1 }).map((r) => r.url), ["/boutique", "/compte"]);
      assert.deepEqual(nav.searchSource("boutique", "", 20, { siteId: S2 }), [], "indisponible pour S2");
      assert.deepEqual(nav.searchSource("casse", "", 20, { siteId: S1 }), [], "un module en panne ne casse pas l'éditeur");
      assert.deepEqual(nav.searchSource("inconnue", "", 20, { siteId: S1 }), []);
    } finally { for (const k of ["boutique", "casse", "indispo"]) nav.unregisterSource(k); }
    assert.deepEqual(nav.sourcesFor(S1), []);
    for (const key of ["Mauvais Nom", "a", "x y"]) assert.throws(() => nav.registerSource(key, { label: "x", search: () => [] }), /invalide/);
    assert.throws(() => nav.registerSource("ok-nom", { label: "x" }), /invalide/);
  });
  test("saveMenu : tout ou rien — une erreur au milieu de la liste n'écrit RIEN, même les éléments valides qui précèdent", () => {
    const m = nav.create({ name: "Atomique", siteId: S1 });
    nav.saveMenu(m.id, { revision: 1, items: [cu("Premier", "/un")] });
    const before = JSON.stringify([db.prepare("SELECT * FROM nav_items WHERE menu_id = ?").all(m.id), nav.menuRow(m.id)]);
    assert.match(code(() => nav.saveMenu(m.id, { revision: 2, name: "Renommé", items: [cu("Valide", "/v"), cu("Piège", "javascript:x"), cu("Après", "/a")] })), /Seules les adresses|Adresse invalide/);
    assert.equal(JSON.stringify([db.prepare("SELECT * FROM nav_items WHERE menu_id = ?").all(m.id), nav.menuRow(m.id)]), before);
  });
  test("saveMenu : version périmée → 409 ; version absente → 400 ; menu inconnu → 404 ; chaque enregistrement valide incrémente la version d'un seul pas, emplacements compris", () => {
    const m = nav.create({ name: "Versions", siteId: S2 });
    assert.match(code(() => nav.saveMenu(m.id, { revision: 5, items: [] })), /^409 /);
    assert.match(code(() => nav.saveMenu(m.id, { items: [] })), /^400 /);
    assert.match(code(() => nav.saveMenu(999999, { revision: 1, items: [] })), /^404 /);
    assert.equal(nav.saveMenu(m.id, { revision: 1, items: [], locations: { header: true, footer: true, mobile: true } }, { canPublish: true }).menu.revision, 2);
    assert.deepEqual(Object.keys(nav.assignments({ siteId: S2 })).sort(), ["footer", "header", "mobile"]);
    assert.equal(nav.menuRow(m.id).revision, 2);
    assert.match(code(() => nav.saveMenu(m.id, { revision: 2, items: [], locations: { header: false } }, { canPublish: false })), /^403 /);
    assert.equal(nav.saveMenu(m.id, { revision: 2, items: [], locations: { header: false } }, { canPublish: true }).menu.revision, 3);
  });
  test("un élément existant garde son type : l'envoyer sous un autre type n'a aucun effet ; son identifiant doit être celui du menu", () => {
    const m = nav.create({ name: "Types", siteId: S1 }), o = nav.create({ name: "Autre", siteId: S1 });
    nav.saveMenu(m.id, { revision: 1, items: [cu("Lien", "/lien")] });
    const it = db.prepare("SELECT * FROM nav_items WHERE menu_id = ?").get(m.id);
    nav.saveMenu(m.id, { revision: 2, items: [{ id: it.id, type: "home", label: "Lien", url: "/lien" }] });
    assert.equal(db.prepare("SELECT type FROM nav_items WHERE id = ?").get(it.id).type, "custom");
    assert.match(code(() => nav.saveMenu(o.id, { revision: 1, items: [{ id: it.id, type: "custom", label: "Vol", url: "/vol" }] })), /inconnu dans ce menu/);
    assert.equal(db.prepare("SELECT menu_id FROM nav_items WHERE id = ?").get(it.id).menu_id, m.id);
  });
  test("liste des menus : recherche (nom, description, jokers neutralisés), tris, version et dernière modification", () => {
    for (const n of ["Alpha", "bravo", "Charlie"]) nav.create({ name: `Tri ${n}`, description: n === "bravo" ? "secret_x%" : "", siteId: S1 });
    const names = (o) => nav.listMenus({ siteId: S1, ...o }).filter((m) => m.name.startsWith("Tri ")).map((m) => m.name);
    assert.deepEqual(names({}), ["Tri Alpha", "Tri bravo", "Tri Charlie"], "nom, sans tenir compte de la casse");
    assert.deepEqual(names({ q: "charl" }), ["Tri Charlie"]); assert.deepEqual(names({ q: "secret_x%" }), ["Tri bravo"]); assert.deepEqual(names({ q: "%" }), ["Tri bravo"], "« % » est littéral");
    db.prepare("UPDATE nav_menus SET updated_at = '2031-01-01 00:00:00' WHERE name = 'Tri Charlie'").run();
    assert.equal(names({ sort: "recent" })[0], "Tri Charlie"); assert.deepEqual(names({ sort: "inconnu" }), names({}), "tri inconnu : par nom");
    assert.deepEqual(Object.keys(nav.MENU_SORTS), ["nom", "recent", "elements"]);
  });
});
