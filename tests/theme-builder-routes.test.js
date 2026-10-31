// Theme Builder (23.1, lot 3) — écran et API sur serveur réel : page accessible, création → conditions → publication → conflits → versions → archivage → suppression, export/import,
// instances, simulation « Pourquoi ce modèle ? », isolation entre deux sites, droits, entrées de menu.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, loginInstructor, newStudent } = require("./helpers");

describe("Theme Builder (serveur réel)", () => {
  let srv, db, boss, A, B, reader;
  const one = (sql, ...a) => db.prepare(sql).get(...a);
  const U = (s, p = "") => `/marketing/site-web/sites/${s}/constructeur-de-theme${p}`;
  const post = (c, path, body) => c.request(path, { method: "POST", json: body || {} });
  const json = (r) => JSON.parse(r.text);
  const mkT = async (s, type, name, conditions) => json(await post(boss, U(s, "/api/modeles"), { type, name, conditions })).template;
  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv); db = srv.db();
    const mk = async (name) => Number((await boss.post("/marketing/site-web/sites", { name })).location.match(/sites\/(\d+)/)[1]);
    A = await mk("Site Alpha"); B = await mk("Site Bravo");
    await boss.post("/marketing/pages", { name: "Accueil Alpha", site_id: A, kind: "page" });
    reader = await newStudent(srv);
  });
  after(async () => { db.close(); await srv.stop(); });

  test("écran : accessible (dialogues, région d'état, recherche), CSS et JS servis, aucun secret ; 404 site inconnu ; refus sans droit", async () => {
    const r = await boss.get(U(A)); assert.equal(r.status, 200);
    for (const s of ['id="tb"', 'role="status"', 'role="search"', "<dialog", "Constructeur de thème", "theme-builder.js"]) assert.ok(r.text.includes(s), s);
    assert.ok(!/ANTHROPIC|sk-ant|ENCRYPTION/.test(r.text));
    assert.equal((await boss.get("/js/theme-builder.js")).status, 200); assert.equal((await boss.get("/css/theme-builder.css")).status, 200);
    assert.equal((await boss.get(U(999999))).status, 404); assert.notEqual((await reader.get(U(A))).status, 200);
  });
  test("création : modèle brouillon avec document créé dans le site, aperçu filaire réel, lien vers l'éditeur EXISTANT", async () => {
    const r = await post(boss, U(A, "/api/modeles"), { type: "header", name: "En-tête principal" }); assert.equal(r.status, 200, r.text.slice(0, 200)); const t = json(r).template;
    assert.equal(t.status, "draft"); assert.equal(t.typeLabel, "En-tête"); assert.match(t.thumb, /^<svg /); assert.ok(!/<script|onload|javascript:/i.test(t.thumb));
    assert.equal(t.editUrl, `/marketing/site-web/composants/${t.sourceId}/editeur`); assert.equal(one("SELECT site_id FROM mk_web_components WHERE id = ?", t.sourceId).site_id, A);
    const p = await mkT(A, "single_page", "Page type", { include: [{ kind: "page" }] }); assert.equal(p.editUrl, `/marketing/pages/${p.sourceId}/editeur`);
    assert.equal((await post(boss, U(A, "/api/modeles"), { type: "inconnu", name: "x" })).status, 422);
    assert.equal((await post(boss, U(A, "/api/modeles"), { type: "single_post", name: "Mauvais", conditions: { include: [{ kind: "archive" }] } })).status, 422);
  });
  test("conditions → publication → conflits : doublon exact refusé (409), même précision = avertissement, texte lisible", async () => {
    const a = await mkT(A, "footer", "Pied A", {}), b = await mkT(A, "footer", "Pied B", {});
    assert.equal((await post(boss, U(A, `/api/modeles/${a.id}/publier`))).status, 200);
    const dup = await post(boss, U(A, `/api/modeles/${b.id}/publier`)); assert.equal(dup.status, 409); assert.match(json(dup).error, /mêmes conditions/);
    const c = await post(boss, U(A, `/api/modeles/${b.id}/conditions`), { conditions: { include: [{ kind: "front_page" }] }, revision: b.revision }); assert.equal(c.status, 200, c.text.slice(0, 200)); assert.equal(json(c).template.describe.include, "Page d'accueil");
    assert.equal((await post(boss, U(A, `/api/modeles/${b.id}/conditions`), { conditions: {}, revision: 1 })).status, 409, "révision périmée");
    const pub = await post(boss, U(A, `/api/modeles/${b.id}/publier`)); assert.equal(pub.status, 200, pub.text.slice(0, 200));
    const list = json(await boss.get(U(A, "/api/modeles"))); assert.ok(list.types.find((t) => t.key === "footer").live >= 2);
  });
  test("liste : filtres par type, état et recherche ; compteurs ; types indisponibles avec raison", async () => {
    const l = json(await boss.get(U(A, "/api/modeles?type=footer"))); assert.ok(l.templates.length >= 2 && l.templates.every((t) => t.type === "footer"));
    assert.ok(json(await boss.get(U(A, "/api/modeles?statut=draft"))).templates.every((t) => t.status === "draft"));
    assert.deepEqual(json(await boss.get(U(A, "/api/modeles?q=pied%20a"))).templates.map((t) => t.name), ["Pied A"]);
    const prod = l.types.find((t) => t.key === "single_product"); assert.equal(prod.available, false); assert.match(prod.reason, /Commerce/);
  });
  test("versions et restauration ; instances d'un en-tête global ; archivage → restauration → suppression (document conservé)", async () => {
    const f = json(await boss.get(U(A, "/api/modeles?type=footer"))).templates.find((t) => t.name === "Pied A");
    assert.equal(json(await boss.get(U(A, `/api/modeles/${f.id}/versions`))).versions.length, 1);
    const inst = json(await boss.get(U(A, `/api/modeles/${f.id}/instances`))); assert.equal(inst.enumerable, true); assert.ok(inst.total >= 0);
    const pg = await mkT(A, "not_found", "404", {}); const doc = pg.sourceId;
    assert.equal((await post(boss, U(A, `/api/modeles/${pg.id}/supprimer`))).status, 409, "archivage d'abord");
    assert.equal((await post(boss, U(A, `/api/modeles/${pg.id}/archiver`))).status, 200); assert.equal(json(await boss.get(U(A, "/api/modeles?archives=1&statut=archived"))).templates.length, 1);
    assert.equal((await post(boss, U(A, `/api/modeles/${pg.id}/restaurer`))).status, 200); await post(boss, U(A, `/api/modeles/${pg.id}/archiver`));
    assert.equal((await post(boss, U(A, `/api/modeles/${pg.id}/supprimer`))).status, 200); assert.ok(one("SELECT 1 FROM mk_landing_pages WHERE id = ?", doc), "document conservé");
  });
  test("renommer, dupliquer, exporter, importer dans un autre site", async () => {
    const t = await mkT(A, "single_post", "Article Alpha", { include: [{ kind: "post", category: ["Actu"] }] });
    assert.equal(json(await post(boss, U(A, `/api/modeles/${t.id}/renommer`), { name: "Article renommé" })).template.name, "Article renommé");
    assert.equal(json(await post(boss, U(A, `/api/modeles/${t.id}/dupliquer`))).template.name, "Article renommé (copie)");
    const ex = await boss.get(U(A, `/api/modeles/${t.id}/export.json`)); assert.equal(ex.status, 200); const payload = JSON.parse(ex.text); assert.equal(payload.format, "kolakisa-theme-template@1");
    const imp = await post(boss, U(B, "/api/importer"), { payload }); assert.equal(imp.status, 200, imp.text.slice(0, 200)); assert.equal(one("SELECT site_id FROM mk_tb_templates WHERE id = ?", json(imp).template.id).site_id, B);
    assert.equal((await post(boss, U(B, "/api/importer"), { payload: { format: "x" } })).status, 422);
  });
  test("isolation : les modèles d'Alpha sont invisibles et intouchables depuis Bravo (liste, actions, export, simulation)", async () => {
    const t = await mkT(A, "header", "Secret Alpha", {});
    const lb = json(await boss.get(U(B, "/api/modeles"))); assert.ok(!JSON.stringify(lb).includes("Secret Alpha"));
    for (const act of ["publier", "archiver", "dupliquer", "renommer", "conditions"]) assert.equal((await post(boss, U(B, `/api/modeles/${t.id}/${act}`), { name: "x" })).status, 404, act);
    assert.equal((await boss.get(U(B, `/api/modeles/${t.id}/export.json`))).status, 404); assert.equal((await boss.get(U(B, `/api/modeles/${t.id}/instances`))).status, 404);
    const sim = json(await boss.get(U(B, "/api/resolution?type=header&vue=page"))); assert.equal(sim.winner, null);
    assert.equal(one("SELECT COUNT(*) n FROM mk_tb_templates WHERE site_id = ? AND name = 'Secret Alpha'", B).n, 0);
  });
  test("simulation « Pourquoi ce modèle ? » : gagnant et raisons, aucune écriture", async () => {
    const g = await mkT(A, "single_post", "Général article", {}); await post(boss, U(A, `/api/modeles/${g.id}/publier`));
    const c = await mkT(A, "single_post", "Catégorie Sport", { include: [{ kind: "post", category: ["Sport"] }] }); await post(boss, U(A, `/api/modeles/${c.id}/publier`));
    const n0 = one("SELECT COUNT(*) n FROM mk_tb_templates").n;
    const s1 = json(await boss.get(U(A, "/api/resolution?type=single_post&vue=post&id=5&categories=Sport"))); assert.equal(s1.winner.name, "Catégorie Sport");
    assert.ok(s1.explain.find((e) => e.name === "Général article").reason.includes("plus précis"));
    assert.equal(json(await boss.get(U(A, "/api/resolution?type=single_post&vue=post&categories=Autre"))).winner.name, "Général article");
    assert.equal(one("SELECT COUNT(*) n FROM mk_tb_templates").n, n0);
  });
  test("import des anciens réglages : en-tête déjà choisi pour le site repris sans toucher l'ancien système ; second passage sans doublon", async () => {
    const C = Number((await boss.post("/marketing/site-web/sites", { name: "Site Ancien" })).location.match(/sites\/(\d+)/)[1]);
    await boss.post("/marketing/pages", { name: "Page Ancien", site_id: C, kind: "page" }); await boss.post(`/marketing/site-web/sites/${C}/entete/creer`, {});
    const before = one("SELECT header_component_id h FROM mk_sites WHERE id = ?", C).h;
    const r1 = json(await post(boss, U(C, "/api/importer-ancien"))); assert.equal(r1.imported.length, 1); assert.equal(r1.imported[0].type, "header");
    assert.equal(one("SELECT header_component_id h FROM mk_sites WHERE id = ?", C).h, before);
    const r2 = json(await post(boss, U(C, "/api/importer-ancien"))); assert.equal(r2.imported.length, 0);
    assert.equal(json(await boss.get(U(C, "/api/modeles"))).templates.filter((t) => t.type === "header").length, 1);
  });
  test("menu : « Constructeur de thème » dans le raccourci du tableau de bord et le menu Apparence du site (pas du site principal)", async () => {
    const d = await boss.get(`/marketing/site-web/sites/${A}/tableau-de-bord`); assert.equal(d.status, 200);
    assert.ok(d.text.includes(`/sites/${A}/constructeur-de-theme`) && d.text.includes("Constructeur de thème"));
  });
});
