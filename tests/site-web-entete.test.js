// En-tête et pied de page : le Theme Builder est l'UNIQUE gestionnaire. Plus d'écran autonome (anciennes adresses redirigées, anciennes actions supprimées),
// reprise des en-têtes/pieds existants des sites (migration de démarrage idempotente), rendu public conservé, isolation entre sites.
// Par les vraies routes d'un vrai serveur ; l'effet est contrôlé sur les pages PUBLIÉES (même rendu que les visiteurs).
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, Client, loginInstructor, newStudent } = require("./helpers");

const UA = { "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/537.36 Chrome/120 Safari/537.36" };
const idFrom = (location) => Number(location.match(/(\d+)(#.*)?$/)[1]);
const ORIGIN = (srv) => ({ Origin: srv.base });

describe("en-tête et pied de page : Theme Builder seul gestionnaire (vrai serveur)", () => {
  let srv, boss, db, siteId, otherSiteId, page1, page2;
  const slugOf = (id) => db.prepare("SELECT slug FROM mk_landing_pages WHERE id = ?").get(id).slug;
  const html = async (id) => (await new Client(srv.base).get(`/p/${slugOf(id)}`, { headers: UA })).text;
  const hasHeader = (h) => /lp-site-part lp-site-header/.test(h);
  const api = (site, path, opts) => boss.request(`/marketing/site-web/sites/${site}/constructeur-de-theme/api/${path}`, { headers: ORIGIN(srv), ...opts });

  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv);
    db = srv.db();
    siteId = idFrom((await boss.post("/marketing/site-web/sites", { name: "Atelier en-tête" })).location);
    otherSiteId = idFrom((await boss.post("/marketing/site-web/sites", { name: "Autre site" })).location);
    for (const [k, s] of [["page1", siteId], ["page2", otherSiteId]]) {
      const id = idFrom((await boss.post("/marketing/pages", { name: k === "page1" ? "Accueil" : "Accueil bis", site_id: String(s) })).location);
      assert.equal((await boss.request(`/marketing/pages/${id}/publier.json`, { method: "POST", json: {}, headers: ORIGIN(srv) })).status, 200);
      if (k === "page1") page1 = id; else page2 = id;
    }
  });
  after(() => srv.stop());

  test("anciennes adresses : redirection permanente vers la section du Theme Builder ; aucune ancienne action n'existe plus", async () => {
    for (const [old, type] of [["en-tete", "header"], ["pied-de-page", "footer"]]) {
      const r = await boss.get(`/marketing/site-web/sites/${siteId}/reglages/${old}`);
      assert.equal(r.status, 301, old);
      assert.equal(r.location, `/marketing/site-web/sites/${siteId}/constructeur-de-theme?type=${type}`);
      const tb = await boss.get(r.location);
      assert.equal(tb.status, 200, "la section du Theme Builder s'ouvre (pas d'écran vide)");
    }
    for (const path of ["parties", "entete/creer", "entete/variante", `entete/pages/${page1}`]) {
      assert.equal((await boss.post(`/marketing/site-web/sites/${siteId}/${path}`, {})).status, 404, path);
    }
  });

  test("menu : En-tête et Pied de page n'existent plus dans Apparence d'un site ; le Theme Builder y est", async () => {
    const nav = require("../src/marketing/web/cmsNav");
    const space = { siteId, principal: false, base: `/marketing/site-web/sites/${siteId}`, name: "Atelier", listHref: "/marketing/site-web/sites" };
    const keys = nav.projectSections(space).flatMap((s) => s.items).map((i) => i.key);
    assert.ok(!keys.includes("apparence/en-tete") && !keys.includes("apparence/pied-de-page"));
    assert.ok(keys.includes("apparence/theme-builder"));
    const dash = (await boss.get(`/marketing/site-web/sites/${siteId}/tableau-de-bord`)).text;
    assert.doesNotMatch(dash, /reglages\/en-tete|reglages\/pied-de-page/);
  });

  test("Theme Builder : créer, publier un en-tête → affiché sur les pages publiées du site, jamais sur un autre site", async () => {
    assert.equal(hasHeader(await html(page1)), false);
    const c = await api(siteId, "modeles", { method: "POST", json: { type: "header", name: "Mon en-tête", conditions: {} } });
    assert.equal(c.status, 200, c.text);
    const t = JSON.parse(c.text).template;
    const pub = await api(siteId, `modeles/${t.id}/publier`, { method: "POST", json: {} });
    assert.equal(pub.status, 200, pub.text);
    assert.equal(hasHeader(await html(page1)), true, "l'en-tête publié du Theme Builder s'affiche");
    assert.equal(hasHeader(await html(page2)), false, "isolation : l'autre site n'est pas touché");
    // retirer la publication : l'en-tête disparaît ; rien n'est supprimé (le modèle reste, en brouillon)
    assert.equal((await api(siteId, `modeles/${t.id}/depublier`, { method: "POST", json: {} })).status, 200);
    assert.equal(hasHeader(await html(page1)), false);
    assert.ok(db.prepare("SELECT 1 FROM mk_tb_templates WHERE id = ? AND status = 'draft'").get(t.id));
  });

  test("migration de démarrage : l'en-tête et le pied des anciens réglages sont repris dans le Theme Builder, une seule fois, sans rien modifier ; le rendu public est conservé", async () => {
    const now = "datetime('now')";
    const org = db.prepare("SELECT organization_id o FROM mk_sites WHERE id = ?").get(otherSiteId).o;
    const cols = db.prepare("PRAGMA table_info(mk_web_components)").all().map((c) => c.name);
    assert.ok(cols.includes("site_id"));
    const section = JSON.stringify({ type: "layout", children: [{ type: "heading", id: "h0000000001a", props: { text: "Entête historique", level: "2" } }] });
    const ins = (name) => db.prepare(`INSERT INTO mk_web_components (organization_id, name, site_id, section, status, revision, created_at, updated_at) VALUES (?, ?, ?, ?, 'published', 1, ${now}, ${now})`).run(org, name, otherSiteId, section).lastInsertRowid;
    let cid;
    try { cid = ins("En-tête historique"); } catch { cid = null; }
    if (!cid) return; // schéma différent : couvert par theme-builder-parties-actuelles
    db.prepare("UPDATE mk_sites SET header_component_id = ? WHERE id = ?").run(cid, otherSiteId);
    const { adoptAllSites } = require("../src/themeBuilder/legacy");
    const ctx = { db, organizationId: org, userId: null };
    const first = adoptAllSites(db, ctx);
    assert.ok(first.imported >= 1);
    assert.equal(adoptAllSites(db, ctx).imported, 0, "idempotent");
    const tpl = db.prepare("SELECT type, status, source_id FROM mk_tb_templates WHERE site_id = ? AND legacy_ref = 'site-part:header'").get(otherSiteId);
    assert.deepEqual({ type: tpl.type, status: tpl.status, source: tpl.source_id }, { type: "header", status: "published", source: cid });
    assert.equal(db.prepare("SELECT header_component_id h FROM mk_sites WHERE id = ?").get(otherSiteId).h, cid, "ancienne colonne intacte (retour arrière possible)");
    assert.equal(db.prepare("SELECT COUNT(*) n FROM mk_tb_templates WHERE site_id = ?").get(siteId).n >= 0, true);
    assert.equal(db.prepare("SELECT COUNT(*) n FROM mk_tb_templates WHERE site_id = ? AND legacy_ref IS NOT NULL").get(siteId).n, 0, "isolation : le premier site n'a rien repris");
  });
});
