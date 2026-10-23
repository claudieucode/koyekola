// KOLAKISA CMS — Outils : corbeille cloisonnée par site, rubriques ouvertes dans l'espace d'un site (plus de « Bientôt »).
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, loginInstructor } = require("./helpers");

let srv, boss, db;
const one = (sql, ...a) => db.prepare(sql).get(...a);
const T = "/marketing/site-web/corbeille";
const idOf = (location, re = /pages\/(\d+)/) => Number(String(location).match(re)[1]);
async function newSite(name) { const r = await boss.post("/marketing/site-web/sites", { name }); return Number(String(r.location).match(/sites\/(\d+)/)[1]); }
async function pageIn(name, site) {
  const r = await boss.post("/marketing/pages", { name, template: "", ...(site ? { site_id: String(site) } : {}) });
  assert.equal(r.status, 302, r.text.slice(0, 200));
  const id = idOf(r.location);
  db.prepare("UPDATE mk_landing_pages SET archived_at = datetime('now') WHERE id = ?").run(id); // mise à la corbeille
  return id;
}

before(async () => {
  srv = await startServer({ SITE_URL: "", SMTP_HOST: "", ENCRYPTION_KEY: TEST_KEY });
  boss = await loginInstructor(srv);
  db = srv.db();
});
after(async () => { await srv.stop(); });

describe("corbeille cloisonnée par site", () => {
  test("la corbeille d'un site ne montre que ses éléments ; la restauration d'un élément d'un autre site est refusée", async () => {
    const a = await newSite("Corbeille A"), b = await newSite("Corbeille B");
    const pa = await pageIn("Page corbeille A", a), pb = await pageIn("Page corbeille B", b);
    assert.equal(one("SELECT site_id FROM mk_landing_pages WHERE id = ?", pa).site_id, a);
    const la = await boss.get(`${T}?site=${a}`);
    assert.equal(la.status, 200);
    assert.match(la.text, /Page corbeille A/);
    assert.doesNotMatch(la.text, /Page corbeille B/, "un autre site n'apparaît pas");
    const r = await boss.post(`${T}/actions?site=${a}`, { action: "restaurer", items: `page:${pb}`, retour: `${T}?site=${a}` });
    assert.equal(r.status, 302);
    assert.ok(one("SELECT archived_at FROM mk_landing_pages WHERE id = ?", pb).archived_at, "la page de B reste à la corbeille");
    const ok = await boss.post(`${T}/actions?site=${a}`, { action: "restaurer", items: `page:${pa}`, retour: `${T}?site=${a}` });
    assert.equal(ok.status, 302);
    assert.equal(one("SELECT archived_at FROM mk_landing_pages WHERE id = ?", pa).archived_at, null, "la page de A est restaurée");
  });
  test("suppression définitive : hors périmètre refusée, dans le périmètre acceptée", async () => {
    const a = await newSite("Purge A"), b = await newSite("Purge B");
    const pa = await pageIn("Purge page A", a), pb = await pageIn("Purge page B", b);
    await boss.post(`${T}/actions?site=${a}`, { action: "supprimer", items: `page:${pb}`, retour: T });
    assert.ok(one("SELECT 1 FROM mk_landing_pages WHERE id = ?", pb), "la page de B existe toujours");
    await boss.post(`${T}/actions?site=${a}`, { action: "supprimer", items: `page:${pa}`, retour: T });
    assert.equal(one("SELECT 1 FROM mk_landing_pages WHERE id = ?", pa), undefined);
  });
});

describe("rubriques Outils dans l'espace d'un site", () => {
  test("Corbeille, Importer, Exporter, Diagnostic, Maintenance, Caches et Outils de contenu sont ouverts (sans « Bientôt ») et répondent", async () => {
    const s = await newSite("Espace outils");
    const home = await boss.get(`/marketing/site-web/sites/${s}/outils`);
    assert.equal(home.status, 200);
    for (const [label, path] of [["Corbeille", "corbeille"], ["Importer", "outils/importer"], ["Exporter", "outils/exporter"], ["Diagnostic", "outils/diagnostic"], ["Maintenance", "outils/maintenance"], ["Caches", "outils/cache"], ["Outils de contenu", "outils/contenu"]]) {
      assert.match(home.text, new RegExp(`href="/marketing/site-web/sites/${s}/${path}"[^>]*>[^<]*(<[^>]+>[^<]*)*${label}`), `${label} ouvert dans le menu du site`);
      const r = await boss.get(`/marketing/site-web/sites/${s}/${path}`);
      assert.equal(r.status, 200, `${label} : ${r.status}`);
    }
  });
});

describe("diagnostic : qualité du contenu et confidentialité du rapport", () => {
  test("contenus sans titre / sans adresse détectés et proposés (rien n'est modifié) ; articles de même titre signalés à titre d'information", async () => {
    const ins = db.prepare("INSERT INTO posts (title, slug, content, status) VALUES (?, ?, 'x', 'draft')");
    ins.run("", "sans-titre-test"); ins.run("Sans adresse test", ""); ins.run("Doublon test", "doublon-1"); ins.run("doublon TEST", "doublon-2");
    const r = await boss.post("/marketing/site-web/outils/diagnostic/integrite", {});
    assert.equal(r.status, 302, r.text.slice(0, 200));
    const id = Number(String(r.location).match(/analyse=(\d+)/)[1]);
    let run;
    for (let i = 0; i < 100; i++) { run = JSON.parse((await boss.get(`/marketing/site-web/outils/operations/${id}.json`)).text); if (run.finished) break; await new Promise((x) => setTimeout(x, 150)); }
    assert.equal(run.status, "done", JSON.stringify(run));
    const page = (await boss.get("/marketing/site-web/outils/diagnostic")).text;
    assert.match(page, /Contenus sans titre/);
    assert.match(page, /Contenus sans adresse/);
    assert.match(page, /Articles de même titre/);
    assert.equal(one("SELECT title FROM posts WHERE slug = 'sans-titre-test'").title, "", "aucun titre n'a été inventé");
    assert.equal(one("SELECT slug FROM posts WHERE title = 'Sans adresse test'").slug, "", "aucune adresse n'a été inventée");
  });
});
