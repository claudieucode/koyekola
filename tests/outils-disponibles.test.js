// OUTILS → OUTILS DISPONIBLES (OUTILS-DISPO-01) : catalogue généré par le registre ; permissions, sites, extensions, destinations réelles.
const os = require("node:os");
const fs = require("node:fs");
const path = require("node:path");
process.env.DATA_DIR = fs.mkdtempSync(path.join(os.tmpdir(), "outils-dispo-")); // le registre est aussi testé dans ce processus : base jetable, jamais celle du projet
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, Client, loginInstructor, newStudent } = require("./helpers");
const catalog = require("../src/services/toolsCatalog");

const O = "/marketing/site-web/outils";
let srv, boss, db, orgId, siteA, siteB;
const one = (sql, ...a) => db.prepare(sql).get(...a);
const qs = (id) => (id ? `?site=${id}` : "");
const cards = (html) => [...html.matchAll(/<li class="mk-tc-card mk-tc-(\w+)" data-tool="([a-z0-9-]+)"/g)].map((m) => ({ state: m[1], id: m[2] }));
const hrefOf = (html, id) => { const m = new RegExp(`data-tool="${id}"[\\s\\S]*?<h3><a href="([^"]+)"`).exec(html); return m ? m[1].replace(/&amp;/g, "&") : null; };
async function newSite(name) { const r = await boss.post("/marketing/site-web/sites", { name }); return Number(String(r.location).match(/sites\/(\d+)/)[1]); }
async function member(role) {
  const c = await newStudent(srv);
  db.prepare("INSERT INTO mk_org_members (organization_id, user_id, role) VALUES (?, ?, ?)").run(orgId, one("SELECT id FROM users WHERE email = ?", c.email).id, role);
  return c;
}
async function guestOf(siteId, role = "admin") {
  const c = await newStudent(srv);
  db.prepare("INSERT INTO mk_site_members (site_id, user_id, role) VALUES (?, ?, ?)").run(siteId, one("SELECT id FROM users WHERE email = ?", c.email).id, role);
  return c;
}

before(async () => {
  srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
  boss = await loginInstructor(srv);
  db = srv.db();
  orgId = one("SELECT id FROM mk_organizations").id;
  siteA = await newSite("Dispo Site A");
  siteB = await newSite("Dispo Site B");
});
after(() => srv.stop());

describe("catalogue (écran réel)", () => {
  test("le site principal affiche tous les outils réellement présents, regroupés, sans doublon ; les outils inexistants sont signalés sans lien", async () => {
    const r = await boss.get(`${O}/disponibles`);
    assert.equal(r.status, 200);
    assert.match(r.text, /<title>Outils disponibles/);
    const list = cards(r.text);
    const ids = list.map((c) => c.id);
    assert.equal(new Set(ids).size, ids.length, "aucun doublon");
    const expected = catalog.REGISTRY.filter((e) => e.state !== "planned").map((e) => e.id);
    assert.deepEqual(ids.filter((i) => !catalog.REGISTRY.find((e) => e.id === i && e.state === "planned")).sort(), expected.sort(), "les cartes = le registre");
    for (const g of ["Importation et exportation", "Diagnostic et maintenance", "Confidentialité", "Administration"]) assert.ok(r.text.includes(`>${g}<`), g);
    assert.ok(!r.text.includes(">Extensions<"), "aucune catégorie vide");
    for (const planned of ["convertisseur-taxonomies"]) {
      assert.equal(list.find((c) => c.id === planned).state, "planned");
      assert.equal(hrefOf(r.text, planned), null, `${planned} : aucun lien`);
    }
    assert.match(r.text, /Pas encore disponible/);
    assert.match(r.text, /Convertisseur de catégories et d(?:'|&#39;)étiquettes/);
  });
  test("chaque carte disponible ouvre une page réelle (200), au bon endroit ; aucune route cassée", async () => {
    const r = await boss.get(`${O}/disponibles`);
    const ids = cards(r.text).filter((c) => c.state === "available").map((c) => c.id);
    assert.ok(ids.length >= 12, `${ids.length} outils`);
    for (const id of ids) {
      const href = hrefOf(r.text, id);
      assert.ok(href && href.startsWith("/marketing/"), `${id} : ${href}`);
      const page = await boss.get(href);
      assert.equal(page.status, 200, `${id} → ${href} : ${page.status}`);
    }
  });
  test("dans un site : outils du site seulement (pas les fonctions centrales), destinations dans le cadre DU site, bon site conservé", async () => {
    const r = await boss.get(`${O}/disponibles${qs(siteA)}`);
    assert.equal(r.status, 200);
    const ids = cards(r.text).map((c) => c.id);
    for (const central of ["sauvegardes", "systeme", "logs"]) assert.ok(!ids.includes(central), `${central} absent d'un site`);
    for (const id of cards(r.text).filter((c) => c.state === "available").map((c) => c.id)) {
      const href = hrefOf(r.text, id);
      assert.ok(href.includes(`/sites/${siteA}/`) || href.includes(`site=${siteA}`), `${id} garde le site : ${href}`);
      assert.equal((await boss.get(href)).status, 200, `${id} : ${href}`);
    }
    const framed = await boss.get(`/marketing/site-web/sites/${siteA}/outils/disponibles`);
    assert.equal(framed.status, 200, "ouvert dans le cadre du site");
    assert.match(framed.text, /Outils disponibles/);
    assert.match(framed.text, new RegExp(`href="/marketing/site-web/sites/${siteA}/outils/notes"`));
  });
  test("menu : « Outils disponibles » est la première entrée d'Outils, active sur son écran ; les autres entrées sont inchangées", async () => {
    const html = (await boss.get(`${O}/disponibles`)).text;
    assert.match(html, /href="\/marketing\/site-web\/outils\/disponibles"[^>]*>[^<]*(<[^>]+>[^<]*)*Outils disponibles/);
    assert.match(html, /<a class="mk-tab" href="[^"]*\/outils\/disponibles"[^>]*aria-current="page"/);
    assert.match(html, /<li aria-current="page">Outils disponibles<\/li>/, "fil d'Ariane : la page courante est « Outils disponibles »");
    assert.match((await boss.get(`${O}/notes`)).text, /<li aria-current="page">Admin Notes<\/li>/, "idem pour Admin Notes");
    assert.match((await boss.get(`/marketing/site-web/sites/${siteA}/outils/disponibles`)).text, /<li aria-current="page">Outils disponibles<\/li>/, "idem dans le cadre d'un site");
    for (const p of ["", "/importer", "/exporter", "/diagnostic", "/maintenance", "/cache", "/contenu", "/notes", "/effacer-donnees"]) assert.equal((await boss.get(`${O}${p}`)).status, 200, p);
  });
});

describe("permissions", () => {
  test("lecteur : état vide explicite ; aucun outil, aucune carte ; ses accès directs aux outils restent refusés", async () => {
    const v = await member("viewer");
    const r = await v.get(`${O}/disponibles`);
    assert.equal(r.status, 200);
    assert.match(r.text, /Aucun outil n(?:'|&#39;)est actuellement disponible pour votre compte/);
    assert.deepEqual(cards(r.text), []);
    for (const p of ["", "/importer", "/exporter", "/notes", "/effacer-donnees"]) assert.equal((await v.get(`${O}${p}`)).status, 403, p);
  });
  test("éditeur : seulement ce que ses permissions autorisent (pas d'import, d'export, de notes, d'effacement) ; accès direct refusé", async () => {
    const e = await member("editor");
    const r = await e.get(`${O}/disponibles`);
    const ids = cards(r.text).filter((c) => c.state === "available").map((c) => c.id);
    for (const yes of ["sante", "diagnostic", "systeme", "sauvegardes", "logs"]) assert.ok(ids.includes(yes), `l'éditeur voit ${yes}`);
    for (const no of ["importer", "exporter", "maintenance", "cache", "contenu", "notes", "effacer-donnees", "sauvegarde-site"]) assert.ok(!ids.includes(no), `l'éditeur ne voit pas ${no}`);
    for (const p of ["/importer", "/exporter", "/notes", "/effacer-donnees"]) assert.equal((await e.get(`${O}${p}`)).status, 403, p);
  });
  test("administrateur : voit notes et effacement en plus ; rôle personnalisé « notes seulement » : une seule carte", async () => {
    const a = await member("admin");
    const ids = cards((await a.get(`${O}/disponibles`)).text).map((c) => c.id);
    for (const yes of ["importer", "exporter", "notes", "effacer-donnees", "maintenance"]) assert.ok(ids.includes(yes), yes);
    await boss.post("/marketing/site-web/utilisateurs/roles", { name: "Notes seules", description: "t", perm: "notes.view" });
    const role = one("SELECT key FROM mk_roles WHERE name = 'Notes seules'");
    const c = await newStudent(srv);
    db.prepare("INSERT INTO mk_org_members (organization_id, user_id, role) VALUES (?, ?, ?)").run(orgId, one("SELECT id FROM users WHERE email = ?", c.email).id, role.key);
    const only = cards((await c.get(`${O}/disponibles`)).text).filter((x) => x.state === "available").map((x) => x.id);
    assert.deepEqual(only, ["notes"]);
  });
  test("accès limité au site B : ses outils dans son site ; ni le site principal, ni le site A, ni les fonctions centrales", async () => {
    const g = await guestOf(siteB);
    const r = await g.get(`${O}/disponibles${qs(siteB)}`);
    assert.equal(r.status, 200);
    const ids = cards(r.text).map((c) => c.id);
    assert.ok(ids.includes("notes") && ids.includes("sante"));
    for (const central of ["sauvegardes", "systeme", "logs"]) assert.ok(!ids.includes(central), central);
    for (const p of [`${O}/disponibles${qs(siteA)}`, `${O}/disponibles`]) { const x = await g.get(p); assert.ok([302, 403, 404].includes(x.status) && !cards(x.text).length, `${p} → ${x.status}`); }
    assert.ok(!r.text.includes(`/sites/${siteA}/`), "aucun lien vers le site A");
  });
  test("anonyme : renvoyé vers la connexion", async () => {
    const x = await new Client(srv.base).get(`${O}/disponibles`);
    assert.equal(x.status, 302); assert.match(x.location, /connexion/);
  });
});

describe("registre (unitaire)", () => {
  const ctx = (extra = {}) => ({ can: () => true, siteId: null, organizationId: 1, siteOnly: false, ...extra });
  const added = [];
  const add = (e) => { catalog.register(e); added.push(e.id); };
  after(() => added.forEach((id) => catalog.unregister(id)));
  test("un identifiant déjà pris est refusé ; une entrée mal formée est refusée avec la raison", () => {
    assert.throws(() => catalog.register({ id: "notes", name: "x", description: "x", category: "administration", href: "/marketing/x", permission: "notes.view" }), /déjà enregistré/);
    assert.throws(() => catalog.register({ id: "Mauvais Id", name: "x" }), /refusé/);
    assert.throws(() => catalog.register({ id: "route-invalide", name: "x", description: "x", category: "administration", href: "https://evil.example/", permission: "tools.view" }), /adresse invalide/);
    assert.throws(() => catalog.register({ id: "sans-droit", name: "x", description: "x", category: "administration", href: "/marketing/x" }), /permission manquante/);
    assert.throws(() => catalog.register({ id: "cat-inconnue", name: "x", description: "x", category: "zzz", href: "/marketing/x", permission: "tools.view" }), /catégorie inconnue/);
    assert.throws(() => catalog.register({ id: "mod-inconnu", name: "x", description: "x", category: "extensions", href: "/marketing/x", permission: "tools.view", module: "nope" }), /module « nope » inconnu/);
  });
  test("outil d'extension : visible seulement sur le site où son module est activé ; retiré dès qu'il est désactivé ; état explicite sinon", () => {
    add({ id: "ext-sms-test", name: "Outil SMS de test", description: "Fourni par l'extension SMS.", category: "extensions", icon: "inbox", href: "/marketing/sms", permission: "tools.view", module: "sms", source: "extension:sms" });
    const on = (m) => m === "sms";
    const A = catalog.catalog(ctx({ siteId: 1, moduleEnabled: on }));
    const B = catalog.catalog(ctx({ siteId: 2, moduleEnabled: () => false }));
    const a = A.groups.find((g) => g.key === "extensions").tools.find((t) => t.id === "ext-sms-test");
    assert.equal(a.state, "available");
    assert.equal(a.href, "/marketing/sms?site=1");
    assert.equal(a.source, "extension:sms");
    const b = B.groups.find((g) => g.key === "extensions").tools.find((t) => t.id === "ext-sms-test");
    assert.equal(b.state, "disabled");
    assert.equal(b.href, null);
    assert.match(b.stateLabel, /désactivée sur ce site/);
    assert.ok(b.enable, "action réelle d'activation proposée à l'équipe");
    assert.equal(catalog.catalog(ctx({ siteId: 2, moduleEnabled: () => false, siteOnly: true, can: (p) => p !== "sites.modules" })).groups.find((g) => g.key === "extensions").tools.find((t) => t.id === "ext-sms-test").enable, null, "pas d'action sans le droit de gérer les modules");
    assert.equal(catalog.catalog(ctx({ siteId: null })).groups.find((g) => g.key === "extensions").tools.find((t) => t.id === "ext-sms-test").state, "available", "le site principal n'est pas soumis à l'activation");
    assert.ok(catalog.unregister("ext-sms-test"));
    added.splice(added.indexOf("ext-sms-test"), 1);
    assert.ok(!catalog.catalog(ctx({ siteId: 1, moduleEnabled: on })).groups.some((g) => g.key === "extensions"), "outil retiré : plus aucune carte");
  });
  test("une entrée qui échoue ne bloque pas les autres cartes ; sans aucun droit, le catalogue est vide", () => {
    const bad = { id: "boom-test", name: "Boom", description: "x", category: "administration", href: "/marketing/boom", permission: "tools.view", get order() { throw new Error("entrée cassée"); } };
    catalog.REGISTRY.push(bad); added.push("boom-test");
    const r = catalog.catalog(ctx());
    assert.ok(r.skipped.includes("boom-test"), "l'entrée cassée est écartée et signalée");
    assert.ok(r.groups.flatMap((g) => g.tools).length >= 10, "les autres cartes sont toujours là");
    catalog.unregister("boom-test"); added.splice(added.indexOf("boom-test"), 1);
    const none = catalog.catalog(ctx({ can: () => false }));
    assert.equal(none.empty, true);
    assert.deepEqual(none.groups, []);
  });
});
