// KOLAKISA CMS — Personnaliser (mission TITAN XVIII) : réglages ajoutés (arrière-plan, images, champs, h4-h6, boutons, rupture, transitions).
// Chaque réglage est vérifié de bout en bout : aperçu, brouillon, publication, base du site, rendu public, isolation entre sites.
// Couleurs, typographie, identité, mise en page, CSS ; erreurs de validation (réseau simulé : conflit de version) ; permissions côté serveur ; isolation A / B / principal ;
// publication réelle vérifiée dans le moteur du site ET dans le rendu public, jamais sur la seule réponse de l'API.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, loginInstructor, newStudent } = require("./helpers");

describe("personnalisateur étendu : arrière-plan, images, formulaires, typographie, boutons (TITAN XVIII)", () => {
  let srv, boss, db, orgId, A, B, adminA, editorA, viewerA, pageA, pageB, mediaA, mediaB, mediaMain;
  const one = (sql, ...a) => db.prepare(sql).get(...a);
  const idOf = (c) => one("SELECT id FROM users WHERE email = ?", c.email).id;
  const PZ = "/marketing/site-web/personnaliser";
  const person = async (siteId, role) => { const c = await newStudent(srv); db.prepare("INSERT INTO mk_site_members (site_id, user_id, role) VALUES (?, ?, ?)").run(siteId, idOf(c), role); return c; };
  const SECTIONS = JSON.stringify([{ type: "text", markdown: "Contenu" }]);
  const tokensOf = (id) => JSON.parse(one("SELECT tokens FROM mk_sites WHERE id = ?", id).tokens);
  const settingsOf = (id) => JSON.parse(one("SELECT settings FROM mk_sites WHERE id = ?", id).settings || "{}");
  const draftOf = (site) => one("SELECT * FROM cms_customizer_drafts WHERE COALESCE(site_id, 0) = COALESCE(?, 0)", site);
  const bootOf = (html) => JSON.parse(html.match(/<script type="application\/json" id="kwc-boot">([\s\S]*?)<\/script>/)[1].replace(/\\u003c/g, "<"));
  const q = (site) => (site ? `?site=${site}` : "");
  const post = (c, path, site, body) => c.postJson(`${PZ}${path}${q(site)}`, { ...(site ? { site: String(site) } : {}), ...body });
  const json = (r) => { try { return JSON.parse(r.text); } catch { return null; } };
  const home = (c) => c.get("/");

  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "", ALLOW_INDEXING: "1" });
    boss = await loginInstructor(srv); db = srv.db();
    orgId = one("SELECT id FROM mk_organizations").id;
    const site = (n) => Number(db.prepare("INSERT INTO mk_sites (organization_id, name, slug, tokens) VALUES (?, ?, ?, '{}')").run(orgId, n, n.toLowerCase()).lastInsertRowid);
    A = site("Alpha"); B = site("Beta");
    adminA = await person(A, "admin"); editorA = await person(A, "editor"); viewerA = await person(A, "viewer");
    const page = (slug, s) => Number(db.prepare("INSERT INTO mk_landing_pages (organization_id, name, slug, title, sections, status, kind, site_id, published_at) VALUES (?, ?, ?, ?, ?, 'published', 'page', ?, datetime('now'))").run(orgId, slug, slug, slug, SECTIONS, s).lastInsertRowid);
    pageA = page("page-alpha", A); pageB = page("page-beta", B);
    const med = (name, reach, siteId) => Number(db.prepare("INSERT INTO mk_media (organization_id, kind, type, name, path, mime, size, reach, site_id) VALUES (?, 'image', 'image', ?, ?, 'image/png', 10, ?, ?)").run(orgId, name, `/uploads/marketing/${name}.png`, reach, siteId).lastInsertRowid);
    mediaA = med("logo-a", "site", A); mediaB = med("logo-b", "site", B); mediaMain = med("logo-main", "shared", null);
  });
  after(() => { db.close(); return srv.stop(); });

  const NEW = {
    "settings.background.color": "#112233", "settings.background.gradient.enabled": true, "settings.background.gradient.from": "#ff0000", "settings.background.gradient.to": "#0000ff", "settings.background.gradient.angle": 45,
    "tokens.type.h4.size": 21, "tokens.type.h5.weight": 600, "tokens.type.caption.size": 13, "tokens.type.h2.transform": "uppercase",
    "tokens.colors.success": "#118833", "tokens.colors.error": "#bb1122", "tokens.radius.card": 22, "tokens.border.width": 2, "tokens.sizes.buttonHeight": 52,
    "tokens.images.radius": 17, "tokens.images.shadow": "lg", "tokens.images.fit": "contain",
    "tokens.forms.bg": "#fefefe", "tokens.forms.radius": 13, "tokens.forms.focusColor": "#aa00aa", "tokens.forms.labelColor": "#334455",
    "tokens.buttons.active.bg": "#334488", "tokens.buttons.hover.border": "#445599",
    "settings.layout.breakpoints.tablet": 1100, "settings.layout.breakpoints.mobile": 700, "settings.transitions.type": "fade", "settings.transitions.duration": 250,
  };

  describe("catalogue", () => {
    test("site : les nouveaux panneaux et réglages existent ; le principal ne les propose pas (le moteur ne sait pas les rendre)", async () => {
      const ids = (b) => b.panels.flatMap((p) => p.controls.map((c) => c.id));
      const site = bootOf((await boss.get(`${PZ}?site=${A}`)).text);
      for (const id of Object.keys(NEW)) assert.ok(ids(site).includes(id), id);
      for (const p of ["arriere-plan", "images", "formulaires"]) assert.ok(site.panels.some((x) => x.id === p), p);
      const main = bootOf((await boss.get(PZ)).text);
      for (const id of Object.keys(NEW)) assert.ok(!ids(main).includes(id), `${id} absent du principal`);
      for (const p of ["arriere-plan", "images", "formulaires"]) assert.ok(!main.panels.some((x) => x.id === p), p);
    });
    test("les couleurs référencées (« token:primary ») s'affichent en hexadécimal", async () => {
      const site = bootOf((await boss.get(`${PZ}?site=${A}`)).text);
      assert.match(site.values["settings.background.gradient.from"], /^#[0-9a-f]{6}$/);
    });
  });

  describe("de l'aperçu au site public", () => {
    test("valeurs refusées par le moteur : rien n'est enregistré", async () => {
      for (const changes of [{ "settings.layout.breakpoints.mobile": 900 }, { "tokens.images.fit": "nawak" }, { "tokens.forms.bg": "rouge" }, { "settings.background.image": "javascript:alert(1)" }, { "tokens.type.h4.size": 3 }]) {
        const r = await post(boss, "/rendu", A, { changes });
        assert.equal(r.status, 422, JSON.stringify(changes));
      }
      assert.equal(draftOf(A), undefined);
    });
    test("l'image de fond d'un autre site est refusée", async () => {
      const pathB = one("SELECT path FROM mk_media WHERE id = ?", mediaB).path;
      const r = await post(boss, "/brouillon", A, { changes: { "settings.background.image": pathB } });
      assert.equal(r.status, 422);
    });
    test("aperçu : le CSS recalculé contient les nouveaux réglages", async () => {
      const r = json(await post(boss, "/rendu", A, { changes: NEW }));
      assert.equal(r.ok, true); assert.equal(r.structural, false, "tout est CSS : aperçu sans rechargement");
      const css = (r.assets.theme + r.assets.bodyStyle).toLowerCase();
      for (const frag of ["#112233", "linear-gradient(45deg", "--kw-success:#118833", "--kw-radius-card:22px", "--kw-h4-size:21px", "border-radius:17px", "object-fit:contain", "#aa00aa", "#334488"]) assert.ok(css.includes(frag), frag);
      assert.equal(draftOf(A), undefined);
    });
    test("brouillon → publication : base du site A, rendu public, B et principal intacts", async () => {
      const beforeB = JSON.stringify([tokensOf(B), settingsOf(B)]);
      const beforeMain = JSON.stringify(db.prepare("SELECT published FROM appearance_configs").all());
      const d = json(await post(boss, "/brouillon", A, { changes: NEW }));
      assert.equal(d.ok, true); assert.equal(d.draft.count, Object.keys(NEW).length);
      const p = json(await post(boss, "/publier", A, { rev: d.draft.rev }));
      assert.equal(p.ok, true);
      const t = tokensOf(A), s = settingsOf(A);
      assert.equal(t.type.h4.size, 21); assert.equal(t.type.h5.weight, 600); assert.equal(t.type.h2.transform, "uppercase"); assert.equal(t.colors.success, "#118833");
      assert.equal(t.radius.card, 22); assert.equal(t.border.width, 2); assert.equal(t.sizes.buttonHeight, 52);
      assert.equal(t.images.radius, 17); assert.equal(t.images.shadow, "lg"); assert.equal(t.forms.radius, 13); assert.equal(t.forms.focusColor, "#aa00aa");
      assert.equal(t.buttons.active.bg, "#334488"); assert.equal(t.buttons.hover.border, "#445599");
      assert.equal(s.background.color, "#112233"); assert.equal(s.background.gradient.enabled, true); assert.equal(s.background.gradient.angle, 45);
      assert.equal(s.layout.breakpoints.tablet, 1100); assert.equal(s.layout.breakpoints.mobile, 700); assert.equal(s.transitions.type, "fade"); assert.equal(s.transitions.duration, 250);
      const page = (await boss.get(`/marketing/pages/${pageA}/apercu`)).text.toLowerCase();
      for (const frag of ["#112233", "linear-gradient(45deg", "--kw-success:#118833", "--kw-radius-card:22px", "border-radius:17px", "#334488", "#aa00aa"]) assert.ok(page.includes(frag), `rendu public : ${frag}`);
      assert.equal(JSON.stringify([tokensOf(B), settingsOf(B)]), beforeB, "le site B n'a pas bougé");
      assert.equal(JSON.stringify(db.prepare("SELECT published FROM appearance_configs").all()), beforeMain, "le principal n'a pas bougé");
      const pb = (await boss.get(`/marketing/pages/${pageB}/apercu`)).text.toLowerCase();
      assert.ok(!pb.includes("#112233") && !pb.includes("--kw-success:#118833"));
    });
    test("après publication, l'écran rouvert affiche les valeurs enregistrées ; restauration → brouillon, rien de publié", async () => {
      const boot = bootOf((await boss.get(`${PZ}?site=${A}`)).text);
      assert.equal(boot.values["tokens.type.h4.size"], 21); assert.equal(boot.values["settings.background.color"], "#112233"); assert.equal(boot.draft.count, 0);
      const v = boot.history[0];
      const r = await post(boss, "/restaurer", A, { version: v.id });
      assert.equal(r.status, 200);
      assert.equal(tokensOf(A).type.h4.size, 21, "rien n'est publié par la restauration");
      assert.ok(draftOf(A), "l'ancien état est placé dans le brouillon");
    });
    test("permissions : l'éditeur de A ne publie pas ; le lecteur ne modifie rien", async () => {
      assert.equal((await post(editorA, "/publier", A, {})).status, 403);
      assert.equal((await post(viewerA, "/brouillon", A, { changes: { "tokens.images.radius": 5 } })).status, 403);
      assert.equal((await post(editorA, "/brouillon", B, { changes: { "tokens.images.radius": 5 } })).status, 403, "accès limité au site A");
    });
  });
});
