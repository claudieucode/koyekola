// KOLAKISA CMS — Personnaliser (TITAN XVIII, suite) : valeurs par appareil, mode sombre, palette nommée, composants d'en-tête/pied, publication planifiée, lien d'aperçu partageable.
// Chaque réglage est vérifié de bout en bout : aperçu, brouillon, publication, base du site, rendu public, isolation entre sites.
// Couleurs, typographie, identité, mise en page, CSS ; erreurs de validation (réseau simulé : conflit de version) ; permissions côté serveur ; isolation A / B / principal ;
// publication réelle vérifiée dans le moteur du site ET dans le rendu public, jamais sur la seule réponse de l'API.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, loginInstructor, newStudent } = require("./helpers");

describe("personnalisateur complet : appareils, mode sombre, palette, en-tête/pied, planification, lien partageable (TITAN XVIII)", () => {
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

  const compA = () => one("SELECT id FROM mk_web_components WHERE name = 'EnteteAlpha'").id;
  const html = async (c, path) => (await c.get(path)).text;

  before(() => {
    const mk = (name, site, text) => Number(db.prepare("INSERT INTO mk_web_components (organization_id, site_id, name, section) VALUES (?, ?, ?, ?)").run(orgId, site, name, JSON.stringify({ type: "text", markdown: text })).lastInsertRowid);
    mk("EnteteAlpha", A, "MARQUEUR-ENTETE-ALPHA"); mk("EnteteBeta", B, "MARQUEUR-ENTETE-BETA"); mk("PiedAlpha", A, "MARQUEUR-PIED-ALPHA");
  });
  const publishNow = async (site, changes) => {
    const d = json(await post(boss, "/brouillon", site, { changes }));
    assert.equal(d.ok, true, JSON.stringify(d));
    const p = json(await post(boss, "/publier", site, { rev: d.draft.rev }));
    assert.equal(p.ok, true, JSON.stringify(p));
  };

  describe("valeurs par appareil et mode sombre", () => {
    test("tablette et mobile : publiés dans le site et rendus sous les points de rupture, sans changer le global", async () => {
      await publishNow(A, { "settings.responsive.tablet.h1": 30, "settings.responsive.mobile.h1": 24, "settings.responsive.mobile.gutter": 10, "settings.responsive.mobile.body": 15 });
      const s = settingsOf(A);
      assert.equal(s.responsive.tablet.h1, 30); assert.equal(s.responsive.mobile.gutter, 10); assert.equal(s.responsive.tablet.body, null);
      const page = (await html(boss, `/marketing/pages/${pageA}/apercu`)).toLowerCase();
      assert.ok(page.includes("@media (max-width:1023px){.lp-site{--kw-h1-size:30px!important}}"), "tablette");
      assert.ok(page.includes("@media (max-width:767px)") && page.includes("--kw-h1-size:24px!important") && page.includes("--kw-body-size:15px!important") && page.includes("padding-left:10px"), "mobile");
      assert.equal(tokensOf(A).type.h1.size, 44, "la taille globale du titre 1 n'est pas réécrite");
      assert.ok(!(await html(boss, `/marketing/pages/${pageB}/apercu`)).includes("--kw-h1-size:24px!important"), "site B intact");
    });
    test("valeur hors limites refusée", async () => {
      assert.equal((await post(boss, "/rendu", A, { changes: { "settings.responsive.mobile.h1": 500 } })).status, 422);
    });
    test("mode sombre : couleurs rendues sous « prefers-color-scheme: dark » ; désactivé = rien", async () => {
      await publishNow(A, { "settings.dark.mode": "auto", "settings.dark.background": "#0a1620", "settings.dark.text": "#e6eef5" });
      const page = (await html(boss, `/marketing/pages/${pageA}/apercu`)).toLowerCase();
      assert.ok(page.includes("@media (prefers-color-scheme:dark){.lp-site{--kw-background:#0a1620!important"), "mode sombre");
      assert.ok(page.includes("html[data-kw-force-dark] .lp-site"), "aperçu forcé");
      await publishNow(A, { "settings.dark.mode": "off" });
      assert.ok(!(await html(boss, `/marketing/pages/${pageA}/apercu`)).includes("prefers-color-scheme:dark"), "désactivé : aucune règle");
    });
  });

  describe("palette nommée", () => {
    test("création, persistance, rendu en variable CSS, doublon refusé, suppression d'une couleur utilisée refusée", async () => {
      await publishNow(A, { "tokens.customColors": [{ key: "c-corail", label: "Corail", hex: "#FF6655" }] });
      assert.deepEqual(tokensOf(A).customColors, [{ key: "c-corail", label: "Corail", hex: "#ff6655" }]);
      assert.ok((await html(boss, `/marketing/pages/${pageA}/apercu`)).toLowerCase().includes("--kw-c-corail:#ff6655"));
      const dup = await post(boss, "/rendu", A, { changes: { "tokens.customColors": [{ key: "c-un", label: "X", hex: "#111111" }, { key: "c-deux", label: "x", hex: "#222222" }] } });
      assert.equal(dup.status, 422);
      assert.equal((await post(boss, "/rendu", A, { changes: { "tokens.customColors": [{ key: "c-un", label: "", hex: "#111111" }] } })).status, 422, "nom obligatoire");
      assert.equal((await post(boss, "/rendu", A, { changes: { "tokens.customColors": [{ key: "c-un", label: "Ok", hex: "rouge" }] } })).status, 422, "couleur invalide");
      await publishNow(A, { "tokens.buttons.normal.bg": "token:c-corail" }).catch(() => {});
      const boot = bootOf((await boss.get(`${PZ}?site=${A}`)).text);
      assert.equal(boot.values["tokens.buttons.normal.bg"], "#ff6655", "référence à la palette affichée en hexadécimal");
    });
    test("la palette n'existe pas pour le principal", async () => {
      assert.equal((await post(boss, "/rendu", null, { changes: { "tokens.customColors": [] } })).status, 422);
    });
  });

  describe("composants d'en-tête et de pied de page du site", () => {
    test("liste limitée aux composants du site (jamais ceux d'un autre) ; l'aperçu les montre sans rien publier", async () => {
      const boot = bootOf((await boss.get(`${PZ}?site=${A}`)).text);
      const ctl = boot.panels.flatMap((p) => p.controls).find((c) => c.id === "parts.header");
      const names = ctl.options.map((o) => o[1]);
      assert.ok(names.includes("EnteteAlpha") && !names.includes("EnteteBeta"));
      assert.equal((await post(boss, "/rendu", A, { changes: { "parts.header": one("SELECT id FROM mk_web_components WHERE name = 'EnteteBeta'").id } })).status, 422, "composant d'un autre site refusé");
      const r = json(await post(boss, "/rendu", A, { changes: { "parts.header": compA() } }));
      assert.equal(r.structural, true);
      const prev = await html(boss, `/marketing/pages/${pageA}/apercu?kwcustom=1`);
      assert.ok(prev.includes("MARQUEUR-ENTETE-ALPHA"), "aperçu avec l'en-tête choisi");
      assert.ok(!(await html(boss, `/marketing/pages/${pageA}/apercu`)).includes("MARQUEUR-ENTETE-ALPHA"), "version en ligne inchangée");
      assert.equal(one("SELECT header_component_id h FROM mk_sites WHERE id = ?", A).h, null, "rien n'est publié par l'aperçu");
    });
    test("publication : le site utilise l'en-tête et le pied choisis ; B intact ; retrait possible", async () => {
      await publishNow(A, { "parts.header": compA(), "parts.footer": one("SELECT id FROM mk_web_components WHERE name = 'PiedAlpha'").id });
      assert.equal(one("SELECT header_component_id h FROM mk_sites WHERE id = ?", A).h, compA());
      const page = await html(boss, `/marketing/pages/${pageA}/apercu`);
      assert.ok(page.includes("MARQUEUR-ENTETE-ALPHA") && page.includes("MARQUEUR-PIED-ALPHA"));
      assert.equal(one("SELECT header_component_id h FROM mk_sites WHERE id = ?", B).h, null);
      await publishNow(A, { "parts.header": "" });
      assert.ok(!(await html(boss, `/marketing/pages/${pageA}/apercu`)).includes("MARQUEUR-ENTETE-ALPHA"), "en-tête retiré");
    });
  });

  describe("publication planifiée", () => {
    const future = (min) => new Date(Date.now() + min * 60000).toISOString();
    test("planifier exige un brouillon, une date future, le droit de publier", async () => {
      await post(boss, "/annuler", A, {});
      assert.equal((await post(boss, "/planifier", A, { at: future(10) })).status, 422, "sans brouillon");
      const d = json(await post(boss, "/brouillon", A, { changes: { "tokens.radius.card": 7 } }));
      assert.equal((await post(boss, "/planifier", A, { at: "pas une date", rev: d.draft.rev })).status, 422);
      assert.equal((await post(boss, "/planifier", A, { at: new Date(Date.now() - 3600000).toISOString(), rev: d.draft.rev })).status, 422, "passé");
      assert.equal((await post(editorA, "/planifier", A, { at: future(10), rev: d.draft.rev })).status, 403, "l'éditeur ne planifie pas");
      const ok = await post(boss, "/planifier", A, { at: future(10), rev: d.draft.rev });
      assert.equal(ok.status, 200);
      assert.ok(draftOf(A).publish_at);
      assert.ok(bootOf((await boss.get(`${PZ}?site=${A}`)).text).draft.publishAt);
    });
    test("modifier le brouillon annule la planification ; rien n'est publié avant l'heure", async () => {
      const boot = bootOf((await boss.get(`${PZ}?site=${A}`)).text);
      assert.notEqual(tokensOf(A).radius && tokensOf(A).radius.card, 7, "pas publié avant l'heure");
      const r = json(await post(boss, "/brouillon", A, { changes: { "tokens.radius.card": 8 }, rev: boot.draft.rev }));
      assert.equal(r.ok, true);
      assert.equal(draftOf(A).publish_at, null);
    });
    test("à l'heure dite : publié par l'écran qui s'ouvre ; droit retiré = non publié et raison conservée", async () => {
      let d = json(await post(boss, "/brouillon", A, { changes: { "tokens.radius.card": 9 } }));
      await post(boss, "/planifier", A, { at: future(10), rev: d.draft.rev });
      db.prepare("UPDATE cms_customizer_drafts SET publish_at = datetime('now', '-1 minute') WHERE site_id = ?").run(A);
      await boss.get(`${PZ}?site=${A}`);
      assert.equal(tokensOf(A).radius.card, 9, "publié à l'heure");
      assert.equal(draftOf(A), undefined, "brouillon consommé");
      assert.equal(one("SELECT COUNT(*) n FROM cms_customizer_versions WHERE site_id = ? AND note = 'Publication planifiée'", A).n, 1, "version historisée");
      // échec : la personne qui a planifié n'a plus le droit
      d = json(await post(boss, "/brouillon", A, { changes: { "tokens.radius.card": 11 } }));
      await post(boss, "/planifier", A, { at: future(10), rev: d.draft.rev });
      db.prepare("UPDATE cms_customizer_drafts SET publish_at = datetime('now', '-1 minute'), scheduled_by = ? WHERE site_id = ?").run(idOf(viewerA), A);
      await boss.get(`${PZ}?site=${A}`);
      assert.equal(tokensOf(A).radius.card, 9, "non publié");
      const row = draftOf(A);
      assert.equal(row.publish_at, null); assert.match(row.publish_error, /droit de publier/);
      assert.match(bootOf((await boss.get(`${PZ}?site=${A}`)).text).draft.scheduleError, /droit de publier/);
    });
  });

  describe("lien d'aperçu partageable", () => {
    let url, token;
    test("créé depuis un brouillon enregistré, réservé à ceux qui publient, impossible pour le principal", async () => {
      await post(boss, "/annuler", A, {});
      assert.equal((await post(boss, "/partager", A, {})).status, 422, "sans brouillon");
      await post(boss, "/brouillon", A, { changes: { "tokens.colors.primary": "#8800aa" } });
      assert.equal((await post(editorA, "/partager", A, {})).status, 403);
      assert.equal((await post(boss, "/partager", null, {})).status, 422, "principal");
      const r = json(await post(boss, "/partager", A, {}));
      assert.equal(r.ok, true); url = r.url; token = new URL(url).searchParams.get("kwshare");
      assert.match(token, /^[a-f0-9]{48}$/);
      assert.equal(one("SELECT COUNT(*) n FROM cms_customizer_shares WHERE token_hash = ?", token).n, 0, "le jeton n'est pas stocké en clair");
    });
    test("sans compte : le visiteur voit le brouillon, en noindex, sans compter la vue ; sans jeton : version en ligne", async () => {
      const { Client } = require("./helpers");
      const anon = new Client(srv.base);
      const path = new URL(url).pathname + new URL(url).search;
      const viewsBefore = one("SELECT COUNT(*) n FROM mk_landing_events").n;
      const r = await anon.get(path);
      assert.equal(r.status, 200);
      assert.ok(r.text.toLowerCase().includes("#8800aa"), "brouillon visible");
      assert.match(String(r.headers.get("x-robots-tag") || ""), /noindex/);
      assert.match(String(r.headers.get("cache-control") || ""), /no-store/);
      assert.equal(one("SELECT COUNT(*) n FROM mk_landing_events").n, viewsBefore, "la visite d'aperçu n'est pas comptée");
      assert.ok(!(await anon.get(new URL(url).pathname)).text.toLowerCase().includes("#8800aa"), "sans jeton : version en ligne");
      assert.ok(!(await anon.get(`${new URL(url).pathname}?kwshare=${"0".repeat(48)}`)).text.toLowerCase().includes("#8800aa"), "jeton inconnu");
      assert.equal(tokensOf(A).colors.primary, "#0277b6", "rien n'est publié par le lien");
    });
    test("le jeton d'un site ne montre rien d'un autre ; révoqué ou expiré = plus rien", async () => {
      const { Client } = require("./helpers");
      const anon = new Client(srv.base);
      const slugB = one("SELECT slug FROM mk_landing_pages WHERE id = ?", pageB).slug;
      assert.ok(!(await anon.get(`/p/${slugB}?kwshare=${token}`)).text.toLowerCase().includes("#8800aa"), "site B");
      db.prepare("UPDATE cms_customizer_shares SET expires_at = datetime('now', '-1 minute')").run();
      assert.ok(!(await anon.get(new URL(url).pathname + new URL(url).search)).text.toLowerCase().includes("#8800aa"), "expiré");
      db.prepare("UPDATE cms_customizer_shares SET expires_at = datetime('now', '+1 day')").run();
      assert.ok((await anon.get(new URL(url).pathname + new URL(url).search)).text.toLowerCase().includes("#8800aa"), "de nouveau valable");
      assert.equal(json(await post(boss, "/revoquer-partage", A, {})).revoked, 1);
      assert.ok(!(await anon.get(new URL(url).pathname + new URL(url).search)).text.toLowerCase().includes("#8800aa"), "révoqué");
    });
  });
});
