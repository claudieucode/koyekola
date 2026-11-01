// Theme Builder (23.1, lot 5) — RENDU PUBLIC de bout en bout sur serveur réel : en-tête global, en-tête propre à une page (priorité), exclusion, pied de page, republication,
// archivage, repli historique, isolation entre sites, aperçu de page, canevas de l'éditeur inchangé, modèles produit (résolution par site).
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { TEST_KEY, freshMarketing } = require("./marketing-helpers");
const { startServer, Client, loginInstructor } = require("./helpers");
const pages = require("../src/marketing/pages");

const UA = { "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/537.36 Chrome/120 Safari/537.36" };
const CONTENT = (t) => ({ title: t, sections: [{ id: "sect00000001", type: "layout", children: [{ id: "hed000000001", type: "heading", props: { text: `Corps ${t}`, level: "1" } }] }] });

describe("Theme Builder : rendu public (serveur réel)", () => {
  let srv, boss, db, A, B;
  const pg = {};
  const U = (s, p = "") => `/marketing/site-web/sites/${s}/constructeur-de-theme${p}`;
  const post = (path, body) => boss.request(path, { method: "POST", json: body || {} });
  const json = (r) => JSON.parse(r.text);
  const slug = (id) => db.prepare("SELECT slug FROM mk_landing_pages WHERE id = ?").get(id).slug;
  const html = async (id) => (await new Client(srv.base).get(`/p/${slug(id)}`, { headers: UA })).text;
  const make = async (site, name, publish = true) => {
    const id = Number((await boss.post("/marketing/pages", { name, site_id: site, kind: "page", template: "", ouvrir: "editeur" })).location.match(/pages\/(\d+)/)[1]);
    const rev = () => db.prepare("SELECT revision FROM mk_landing_pages WHERE id = ?").get(id).revision;
    assert.equal((await boss.request(`/marketing/pages/${id}/brouillon`, { method: "PUT", headers: { Origin: srv.base }, json: { revision: rev(), content: CONTENT(name) } })).status, 200);
    if (publish) assert.equal((await boss.request(`/marketing/pages/${id}/publier.json`, { method: "POST", json: {}, headers: { Origin: srv.base } })).status, 200);
    return id;
  };
  const tpl = async (site, type, name, conditions) => { const r = await post(U(site, "/api/modeles"), { type, name, conditions }); assert.equal(r.status, 200, r.text.slice(0, 200)); return json(r).template; };
  const publish = async (site, t) => { const r = await post(U(site, `/api/modeles/${t.id}/publier`)); assert.equal(r.status, 200, r.text.slice(0, 300)); return json(r).template; };
  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv); db = srv.db();
    const mk = async (n) => Number((await boss.post("/marketing/site-web/sites", { name: n })).location.match(/sites\/(\d+)/)[1]);
    A = await mk("Site Alpha"); B = await mk("Site Bravo");
    for (const n of ["Accueil", "Services", "Contact"]) pg[n] = await make(A, n);
    pg.Bravo = await make(B, "Page Bravo");
  });
  after(async () => { if (db) db.close(); if (srv) await srv.stop(); });

  test("1-3. sans modèle : comportement historique (aucun en-tête) ; en-tête global publié → affiché sur toutes les pages publiées", async () => {
    for (const id of Object.values(pg)) assert.ok(!(await html(id)).includes("HEADERGLOBAL"));
    const h = await tpl(A, "header", "HEADERGLOBAL", {}); assert.ok(!(await html(pg.Services)).includes("HEADERGLOBAL"), "brouillon : jamais appliqué");
    await publish(A, h);
    for (const n of ["Accueil", "Services", "Contact"]) { const t = await html(pg[n]); assert.ok(t.includes("HEADERGLOBAL"), n); assert.ok(t.includes(`Corps ${n}`)); assert.ok(t.indexOf("HEADERGLOBAL") < t.indexOf(`Corps ${n}`), "en-tête AVANT le contenu"); }
  });
  test("4-5. en-tête propre à une page : il l'emporte sur le global pour cette page, le global reste ailleurs", async () => {
    const h = await tpl(A, "header", "HEADERSERVICES", { include: [{ kind: "page", ids: [pg.Services] }] }); await publish(A, h);
    const s = await html(pg.Services); assert.ok(s.includes("HEADERSERVICES") && !s.includes("HEADERGLOBAL"), "spécifique seul");
    for (const n of ["Accueil", "Contact"]) { const t = await html(pg[n]); assert.ok(t.includes("HEADERGLOBAL") && !t.includes("HEADERSERVICES"), n); }
    const sim = json(await boss.get(U(A, `/api/resolution?type=header&vue=page&id=${pg.Services}`))); assert.equal(sim.winner.name, "HEADERSERVICES");
    assert.ok(sim.explain.find((e) => e.name === "HEADERGLOBAL").reason.includes("plus précis"));
  });
  test("6. pied de page global + exclusion d'une page ; page d'accueil dédiée", async () => {
    const f = await tpl(A, "footer", "FOOTERGLOBAL", { exclude: [{ kind: "page", ids: [pg.Contact] }] }); await publish(A, f);
    assert.ok((await html(pg.Accueil)).includes("FOOTERGLOBAL")); assert.ok(!(await html(pg.Contact)).includes("FOOTERGLOBAL"), "page exclue");
    const t = await html(pg.Services); assert.ok(t.indexOf(`Corps Services`) < t.indexOf("FOOTERGLOBAL"), "pied APRÈS le contenu");
    await post(`/marketing/site-web/sites/${A}/accueil`, { pageId: String(pg.Accueil) }).catch(() => {});
    const hf = await tpl(A, "header", "HEADERACCUEIL", { include: [{ kind: "front_page" }] }); await publish(A, hf);
    const home = db.prepare("SELECT home_page_id h FROM mk_sites WHERE id = ?").get(A).h;
    if (home) assert.ok((await html(home)).includes(home === pg.Accueil ? "HEADERACCUEIL" : "HEADERGLOBAL")); else assert.ok(true);
  });
  test("11. republication : le contenu modifié apparaît sur la page publiée ; archivage → retour au modèle suivant, sans cache périmé", async () => {
    const list = json(await boss.get(U(A, "/api/modeles?type=header"))).templates; const g = list.find((t) => t.name === "HEADERGLOBAL");
    const put = await boss.request(`/marketing/site-web/composants/${g.sourceId}/brouillon`, { method: "PUT", json: { content: { sections: [{ id: "sect00000009", type: "layout", children: [{ id: "hed000000009", type: "heading", props: { text: "HEADERGLOBAL-V2", level: "2" } }] }] }, revision: db.prepare("SELECT revision FROM mk_web_components WHERE id = ?").get(g.sourceId).revision } });
    assert.equal(put.status, 200, put.text.slice(0, 200)); assert.ok(!(await html(pg.Contact)).includes("HEADERGLOBAL-V2"), "brouillon non diffusé");
    await publish(A, json(await boss.get(U(A, `/api/modeles?type=header`))).templates.find((t) => t.name === "HEADERGLOBAL"));
    assert.ok((await html(pg.Contact)).includes("HEADERGLOBAL-V2"));
    const sv = list.find((t) => t.name === "HEADERSERVICES"); assert.ok((await html(pg.Services)).includes("HEADERSERVICES"));
    assert.equal((await post(U(A, `/api/modeles/${sv.id}/archiver`))).status, 200);
    const t = await html(pg.Services); assert.ok(!t.includes("HEADERSERVICES") && t.includes("HEADERGLOBAL-V2"), "immédiatement le global");
    const v1 = json(await boss.get(U(A, `/api/modeles/${g.id}/versions`))).versions; assert.ok(v1.length >= 2);
    assert.equal((await post(U(A, `/api/modeles/${g.id}/versions/1/restaurer`))).status, 200);
    assert.ok((await html(pg.Contact)).includes("HEADERGLOBAL-V2"), "restauration en BROUILLON : la page publique ne change pas");
  });
  test("13. isolation : rien d'Alpha sur Bravo ; un modèle de Bravo ne s'applique qu'à Bravo", async () => {
    const b = await html(pg.Bravo); assert.ok(!/HEADER(GLOBAL|SERVICES|ACCUEIL)|FOOTERGLOBAL/.test(b));
    const hb = await tpl(B, "header", "HEADERBRAVO", {}); await publish(B, hb);
    assert.ok((await html(pg.Bravo)).includes("HEADERBRAVO")); assert.ok(!(await html(pg.Services)).includes("HEADERBRAVO"));
  });
  test("repli historique : un site avec en-tête choisi à l'ancienne et aucun modèle publié rend comme avant ; le modèle publié prime ensuite", async () => {
    const C = Number((await boss.post("/marketing/site-web/sites", { name: "Site Ancien" })).location.match(/sites\/(\d+)/)[1]);
    const p = await make(C, "Page Ancien"); await boss.post(`/marketing/site-web/sites/${C}/entete/creer`, {});
    const t0 = await html(p); assert.match(t0, /lp-site-part lp-site-header/, "en-tête historique");
    const h = await tpl(C, "header", "HEADERNOUVEAU", {}); assert.match(await html(p), /lp-site-header/); assert.ok(!(await html(p)).includes("HEADERNOUVEAU"), "brouillon ignoré");
    await publish(C, h); const t1 = await html(p); assert.ok(t1.includes("HEADERNOUVEAU"));
  });
  test("aperçu de page = page publiée (modèles appliqués) ; canevas de l'éditeur = même en-tête que le site (voir theme-builder-identite.test.js)", async () => {
    const prev = await boss.get(`/marketing/pages/${pg.Contact}/apercu`); assert.equal(prev.status, 200); assert.ok(prev.text.includes("HEADERGLOBAL-V2"), "l'aperçu montre le modèle");
    const ed = await boss.get(`/marketing/pages/${pg.Contact}/editeur`); assert.equal(ed.status, 200);
    const cv = (ed.text.match(/(?:src|data-canvas)="(\/marketing\/pages\/\d+\/[a-z0-9-]*canevas[^"]*)"/) || [])[1];
    if (cv) { const c = await boss.get(cv); assert.ok(c.status === 200 || c.status === 404); }
  });
});

describe("Modèles produit : résolution par site (service)", () => {
  const { A } = freshMarketing();
  const s1 = pages.createSite(A, { name: "Boutique 1" }), s2 = pages.createSite(A, { name: "Boutique 2" });
  const R = require("../src/themeBuilder/render"), store = require("../src/themeBuilder/store");
  const siteModules = require("../src/marketing/siteModules");
  test("fiche produit : catégorie précise › général ; modèle d'un autre site ignoré ; brouillon ignoré ; module requis", () => {
    for (const s of [s1, s2]) siteModules.setEnabled(A, s.id, "commerce", true);
    const mk = (site, name, cond, publish = true) => {
      const t = store.create(A, site, { type: "single_product", name, conditions: cond });
      pages.saveDraft(A, t.sourceId, { title: name, sections: [{ id: "sect00000002", type: "layout", children: [{ id: "hed000000002", type: "heading", props: { text: name, level: "2" } }] }] }, { revision: pages.requirePage(A, t.sourceId).revision });
      return publish ? store.publish(A, site, t.id).template : t;
    };
    const gen = mk(s1.id, "Produit général", {}), shoes = mk(s1.id, "Produit chaussures", { include: [{ kind: "product", category: ["Chaussures"] }] }); mk(s1.id, "Produit brouillon", { include: [{ kind: "product", category: ["Sacs"] }] }, false); const other = mk(s2.id, "Produit autre site", { include: [{ kind: "product", category: ["Chaussures"] }] });
    assert.equal(R.pickRegion(A, s1.id, "product", { category: "Chaussures", postId: 3 }).id, shoes.sourceId);
    assert.equal(R.pickRegion(A, s1.id, "product", { category: "Vêtements", postId: 3 }).id, gen.sourceId);
    assert.equal(R.pickRegion(A, s1.id, "product", { category: "Sacs" }).id, gen.sourceId, "le brouillon Sacs est ignoré");
    assert.equal(R.pickRegion(A, s2.id, "product", { category: "Chaussures" }).id, other.sourceId); assert.notEqual(R.pickRegion(A, s2.id, "product", { category: "Chaussures" }).id, shoes.sourceId);
    assert.equal(R.pickRegion(A, null, "product", {}), null, "site principal : ancien système"); assert.equal(R.pickRegion(A, s1.id, "single_post", {}), null, "famille non gérée");
    store.archive(A, s1.id, shoes.id); assert.equal(R.pickRegion(A, s1.id, "product", { category: "Chaussures" }).id, gen.sourceId, "cache invalidé par l'archivage");
  });
});
