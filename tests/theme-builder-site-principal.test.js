// Theme Builder → SITE PRINCIPAL : l'en-tête et le pied de page du site principal se gèrent UNIQUEMENT dans le Theme Builder (modèles à site_id NULL),
// avec isolation totale par rapport aux sites créés. Serveur réel : création, publication, rendu public, isolation, anciens écrans supprimés.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const http = require("node:http");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, loginInstructor } = require("./helpers");

const hostReq = (srv, host, path) => {
  const u = new URL(srv.base);
  return new Promise((resolve, reject) => {
    const r = http.request({ host: u.hostname, port: u.port, path, method: "GET", headers: { ...(host ? { Host: host } : {}), "User-Agent": "Mozilla/5.0 Chrome/120 Safari/537.36" } }, (resp) => {
      let text = ""; resp.on("data", (d) => (text += d)); resp.on("end", () => resolve({ status: resp.statusCode, text, headers: resp.headers }));
    });
    r.on("error", reject); r.end();
  });
};

describe("Theme Builder : site principal (serveur réel)", () => {
  let srv, boss, db, org, A;
  const ORIGIN = () => ({ Origin: srv.base });
  const one = (sql, ...a) => db.prepare(sql).get(...a);
  const P = "/marketing/site-web/principal/constructeur-de-theme";
  const post = (path, body) => boss.request(path, { method: "POST", json: body || {} });
  const mkSite = (name, slug) => Number(db.prepare("INSERT INTO mk_sites (organization_id, name, slug, tokens) VALUES (?, ?, ?, '{}')").run(org, name, slug).lastInsertRowid);
  // Modèle COMPOSANT (en-tête / pied) : on écrit un titre repérable dans le composant, puis on publie
  const model = async (base, type, name, conditions = {}) => {
    const r = await post(`${base}/api/modeles`, { type, name, conditions }); assert.equal(r.status, 200, r.text.slice(0, 300));
    const t = JSON.parse(r.text).template;
    const c = one("SELECT section FROM mk_web_components WHERE id = ?", t.sourceId);
    const section = JSON.parse(c.section); section.children = [{ id: "hed000000002", type: "heading", props: { text: name, level: "3" } }];
    db.prepare("UPDATE mk_web_components SET section = ? WHERE id = ?").run(JSON.stringify(section), t.sourceId);
    const p = await post(`${base}/api/modeles/${t.id}/publier`); assert.equal(p.status, 200, p.text.slice(0, 300));
    return t;
  };
  const PUBLIC = ["/", "/catalogue", "/blog", "/page-introuvable-xyz"];

  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv); db = srv.db(); org = one("SELECT id FROM mk_organizations").id;
    A = mkSite("Site A", "site-a");
  });
  after(async () => { if (db) db.close(); if (srv) await srv.stop(); });

  test("0. l'écran du Theme Builder s'ouvre pour le site principal et ne propose aucun modèle au départ", async () => {
    const page = await boss.get(P); assert.equal(page.status, 200, page.text.slice(0, 200));
    assert.match(page.text, /Site principal/);
    const l = await boss.get(`${P}/api/modeles`); assert.equal(l.status, 200);
    assert.equal(JSON.parse(l.text).total, 0);
    for (const p of PUBLIC) { const r = await hostReq(srv, null, p); assert.ok([200, 404].includes(r.status), `${p} → ${r.status}`); assert.doesNotMatch(r.text, /kw-theme-header|kw-theme-footer/, p); }
  });

  test("1. en-tête et pied publiés pour le site principal : affichés sur ses pages publiques, rien sur un site créé", async () => {
    const h = await model(P, "header", "ENTETE-PRINCIPAL"); const f = await model(P, "footer", "PIED-PRINCIPAL");
    assert.equal(h.siteId, null); assert.equal(f.siteId, null);
    assert.equal(one("SELECT site_id FROM mk_tb_templates WHERE id = ?", h.id).site_id, null);
    for (const p of PUBLIC) {
      const r = await hostReq(srv, null, p); assert.ok([200, 404].includes(r.status), `${p} → ${r.status}`);
      assert.match(r.text, /ENTETE-PRINCIPAL/, `${p} : en-tête du principal absent`);
      assert.match(r.text, /PIED-PRINCIPAL/, `${p} : pied du principal absent`);
      assert.doesNotMatch(r.text, /class="site-header"|class="site-footer"/, `${p} : l'ancien habillage ne doit plus s'afficher`);
    }
  });

  test("2. isolation : la liste du site A est vide, celle du principal ne contient pas les modèles de A, et inversement", async () => {
    const base = `/marketing/site-web/sites/${A}/constructeur-de-theme`;
    assert.equal(JSON.parse((await boss.get(`${base}/api/modeles`)).text).total, 0);
    await model(base, "header", "ENTETE-A");
    const main = JSON.parse((await boss.get(`${P}/api/modeles`)).text);
    assert.deepEqual(main.templates.map((t) => t.name).sort(), ["ENTETE-PRINCIPAL", "PIED-PRINCIPAL"]);
    const mine = JSON.parse((await boss.get(`${base}/api/modeles`)).text);
    assert.deepEqual(mine.templates.map((t) => t.name), ["ENTETE-A"]);
    // un modèle du principal n'est jamais lisible ni modifiable par l'adresse d'un site, et réciproquement
    const idMain = main.templates[0].id;
    assert.equal((await post(`${base}/api/modeles/${idMain}/archiver`)).status, 404);
    const idA = mine.templates[0].id;
    assert.equal((await post(`${P}/api/modeles/${idA}/archiver`)).status, 404);
    const r = await hostReq(srv, null, "/catalogue"); assert.doesNotMatch(r.text, /ENTETE-A/);
  });

  test("3. archiver le modèle publié rend l'ancien habillage au site principal (retour arrière sans perte)", async () => {
    const main = JSON.parse((await boss.get(`${P}/api/modeles`)).text);
    const h = main.templates.find((t) => t.type === "header");
    assert.equal((await post(`${P}/api/modeles/${h.id}/archiver`)).status, 200);
    const r = await hostReq(srv, null, "/catalogue");
    assert.doesNotMatch(r.text, /ENTETE-PRINCIPAL/); assert.match(r.text, /class="site-header"/);
    assert.match(r.text, /PIED-PRINCIPAL/);
  });

  test("4. les écrans autonomes « En-tête » et « Pied de page » n'existent plus nulle part", async () => {
    for (const path of ["/marketing/site-web/apparence/en-tete", "/marketing/site-web/apparence/pied-de-page"]) {
      const r = await boss.request(path, { method: "GET", redirect: "manual" });
      assert.ok([301, 302, 404].includes(r.status), `${path} → ${r.status}`);
      if (r.status !== 404) assert.match(String(r.headers.location || r.headers.get?.("location") || ""), /constructeur-de-theme/);
    }
    for (const path of ["/marketing/site-web/apparence/en-tete", "/marketing/site-web/apparence/pied-de-page"]) {
      const r = await boss.request(path, { method: "POST", json: { base: "1" }, headers: ORIGIN() });
      assert.ok([404, 405].includes(r.status), `POST ${path} → ${r.status}`);
    }
    const menu = await boss.get("/marketing/site-web/apparence/styles");
    assert.doesNotMatch(menu.text, />\s*En-tête\s*</); assert.doesNotMatch(menu.text, />\s*Pied de page\s*</);
    assert.match(menu.text, /Theme Builder/);
  });

  test("5. une page du Page Builder du site principal reçoit aussi l'en-tête et le pied publiés ; la barre latérale du principal ne fuit pas vers un site", async () => {
    await model(P, "header", "ENTETE-PAGE-PRINCIPAL"); await model(P, "sidebar", "SIDE-PRINCIPAL");
    const id = Number((await boss.post("/marketing/pages", { name: "Page du principal" })).location.match(/(\d+)$/)[1]);
    const rev = one("SELECT revision FROM mk_landing_pages WHERE id = ?", id).revision;
    const content = { sections: [{ id: "sect00000001", type: "layout", children: [{ id: "hed000000001", type: "heading", props: { text: "CONTENU-PAGE", level: "2" } }] }] };
    assert.equal((await boss.request(`/marketing/pages/${id}/brouillon`, { method: "PUT", headers: ORIGIN(), json: { revision: rev, content } })).status, 200);
    assert.equal((await boss.postJson(`/marketing/pages/${id}/publier.json`, {})).status, 200);
    const slug = one("SELECT slug FROM mk_landing_pages WHERE id = ?", id).slug;
    const r = await hostReq(srv, null, `/p/${slug}`);
    assert.equal(r.status, 200);
    assert.match(r.text, /CONTENU-PAGE/); assert.match(r.text, /ENTETE-PAGE-PRINCIPAL/); assert.match(r.text, /PIED-PRINCIPAL/); assert.match(r.text, /SIDE-PRINCIPAL/);
    assert.ok(r.text.indexOf("ENTETE-PAGE-PRINCIPAL") < r.text.indexOf("CONTENU-PAGE") && r.text.indexOf("CONTENU-PAGE") < r.text.indexOf("PIED-PRINCIPAL"), "ordre : en-tête, contenu, pied");
    const a = await boss.get(`/marketing/site-web/sites/${A}/constructeur-de-theme/api/modeles`);
    assert.doesNotMatch(a.text, /PRINCIPAL/);
  });
});
