// Un SEUL pied de page par page : quand un pied de page de site (Theme Builder) s'applique, le pied par défaut des pages du Page Builder
// (widgets « footer-1 / footer-2 » + marque + Cookies / Confidentialité, views/marketing-public/landing.ejs) n'est JAMAIS ajouté en plus.
// Sans pied applicable (page exclue, aucun modèle), le repli prévu reste affiché exactement une fois. Isolation entre sites.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, Client, loginInstructor } = require("./helpers");

const UA = { "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/537.36 Chrome/120 Safari/537.36" };
const sect = (id, text) => ({ id, type: "layout", children: [{ id: `${id}h`.slice(0, 20), type: "heading", props: { text, level: "2" } }] });
const count = (t, s) => t.split(s).length - 1;

describe("Pied de page unique sur les pages du site", () => {
  let srv, boss, db, S1, S2, pA, pX, pB;
  const U = (s, p = "") => `/marketing/site-web/sites/${s}/constructeur-de-theme${p}`;
  const post = (path, body) => boss.request(path, { method: "POST", json: body || {} });
  const json = (r) => JSON.parse(r.text);
  const slug = (id) => db.prepare("SELECT slug FROM mk_landing_pages WHERE id = ?").get(id).slug;
  const pub = async (id) => (await new Client(srv.base).get(`/p/${slug(id)}`, { headers: UA })).text;
  const mkPage = async (site, name) => {
    const id = Number((await boss.post("/marketing/pages", { name, site_id: site, kind: "page", template: "", ouvrir: "editeur" })).location.match(/pages\/(\d+)/)[1]);
    const rev = db.prepare("SELECT revision FROM mk_landing_pages WHERE id = ?").get(id).revision;
    assert.equal((await boss.request(`/marketing/pages/${id}/brouillon`, { method: "PUT", headers: { Origin: srv.base }, json: { revision: rev, content: { title: name, sections: [sect("sect00000001", `CORPS-${name}`)] } } })).status, 200);
    assert.equal((await boss.request(`/marketing/pages/${id}/publier.json`, { method: "POST", json: {}, headers: { Origin: srv.base } })).status, 200);
    return id;
  };
  const footer = async (site, name, conditions) => json(await post(U(site, "/api/modeles"), { type: "footer", name, conditions })).template;
  const saveDraft = async (t, text) => {
    const rev = db.prepare("SELECT revision FROM mk_web_components WHERE id = ?").get(t.sourceId).revision;
    const r = await boss.request(`/marketing/site-web/composants/${t.sourceId}/brouillon`, { method: "PUT", headers: { Origin: srv.base }, json: { revision: rev, content: { title: "t", sections: [sect(`sect${String(t.id).padStart(7, "0")}`, text)] } } });
    assert.equal(r.status, 200, r.text.slice(0, 200));
  };
  const publish = async (site, t) => { const r = await post(U(site, `/api/modeles/${t.id}/publier`)); assert.equal(r.status, 200, r.text.slice(0, 300)); };

  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv); db = srv.db();
    const mk = async (n) => Number((await boss.post("/marketing/site-web/sites", { name: n })).location.match(/sites\/(\d+)/)[1]);
    S1 = await mk("Site Un"); S2 = await mk("Site Deux");
    pA = await mkPage(S1, "Accueil"); pX = await mkPage(S1, "Exclue"); pB = await mkPage(S2, "Autre site");
  });
  after(async () => { if (db) db.close(); if (srv) await srv.stop(); });

  test("sans pied de Theme Builder : le pied par défaut s'affiche une seule fois (repli historique)", async () => {
    const h = await pub(pA);
    assert.equal(count(h, 'class="lp-foot"'), 1);
  });
  test("avec un pied de Theme Builder applicable : un seul pied, le pied par défaut (marque, Cookies, widgets) n'est pas rendu en plus", async () => {
    const t = await footer(S1, "Pied TB", { exclude: [{ kind: "page", ids: [pX] }] });
    await saveDraft(t, "PIED-TB-UNIQUE"); await publish(S1, t);
    const h = await pub(pA);
    assert.ok(h.includes("PIED-TB-UNIQUE"));
    assert.equal(count(h, "lp-site-footer"), 1, "le pied du Theme Builder est rendu une fois");
    assert.equal(count(h, 'class="lp-foot"'), 0, "aucun pied par défaut en plus");
    assert.equal(count(h, "lp-foot-widgets"), 0, "aucune zone de widgets de pied en plus");
  });
  test("page exclue des conditions : aucun pied Theme Builder, le repli prévu s'affiche une seule fois", async () => {
    const h = await pub(pX);
    assert.ok(!h.includes("PIED-TB-UNIQUE"));
    assert.equal(count(h, "lp-site-footer"), 0);
    assert.equal(count(h, 'class="lp-foot"'), 1);
  });
  test("isolation : le pied d'un site ne retire pas le repli de l'autre site", async () => {
    const h = await pub(pB);
    assert.ok(!h.includes("PIED-TB-UNIQUE"));
    assert.equal(count(h, 'class="lp-foot"'), 1);
  });
});
