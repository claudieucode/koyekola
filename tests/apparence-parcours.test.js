// KOLAKISA CMS — Apparence : PARCOURS COMPLET des quatre outils ensemble, sur de vraies routes et une vraie base : Templates (import d'un pack) → Éditeur du site (pages, brouillons) →
// Patterns (insertion dans une page) → Styles (publication d'une palette) → publication des pages → site public → rechargement. Chaque étape s'appuie sur les données de la précédente
// (aucun format parallèle) ; le site B reste intact du début à la fin.
const { test, describe, before, after } = require("node:test");
const IDY = (k) => require("../src/services/packBrand").idOf(k);
const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, loginInstructor, newStudent, Client } = require("./helpers");

describe("parcours Templates → Éditeur → Patterns → Styles → publication", () => {
  let srv, boss, db, orgId, A, B, adminA, anon, imported, snapshotB;
  const one = (sql, ...a) => db.prepare(sql).get(...a);
  const all = (sql, ...a) => db.prepare(sql).all(...a);
  const idOf = (c) => one("SELECT id FROM users WHERE email = ?", c.email).id;
  const R = "/marketing/site-web";
  const json = (r) => { try { return JSON.parse(r.text); } catch { return null; } };
  const bootOf = (html, id) => JSON.parse(new RegExp(`<script type="application/json" id="${id}">([\\s\\S]*?)</script>`).exec(html)[1].replace(/\\u003c/g, "<"));
  const key = () => crypto.randomBytes(12).toString("hex");
  const siteB = () => JSON.stringify([all("SELECT * FROM mk_landing_pages WHERE site_id = ?", B), one("SELECT tokens, settings FROM mk_sites WHERE id = ?", B), all("SELECT * FROM nav_menus WHERE site_id = ?", B), all("SELECT * FROM appearance_patterns WHERE site_id = ?", B), all("SELECT * FROM cms_customizer_drafts WHERE site_id = ?", B)]);

  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "", ALLOW_INDEXING: "1" });
    boss = await loginInstructor(srv); db = srv.db(); anon = new Client(srv.base);
    orgId = one("SELECT id FROM mk_organizations").id;
    const site = (n) => Number(db.prepare("INSERT INTO mk_sites (organization_id, name, slug, tokens) VALUES (?, ?, ?, '{}')").run(orgId, n, n.toLowerCase()).lastInsertRowid);
    A = site("Alpha"); B = site("Beta");
    adminA = await newStudent(srv); db.prepare("INSERT INTO mk_site_members (site_id, user_id, role) VALUES (?, ?, 'admin')").run(A, idOf(adminA));
    db.prepare("INSERT INTO mk_landing_pages (organization_id, name, slug, title, sections, status, kind, site_id, published_at) VALUES (?, 'Accueil de B', 'accueil-de-b', 'Accueil de B', ?, 'published', 'page', ?, datetime('now'))").run(orgId, JSON.stringify([{ type: "text", markdown: "B" }]), B);
    snapshotB = siteB();
  });
  after(() => { db.close(); return srv.stop(); });

  test("1. Templates : importer un pack de site (pages natives, menu, brouillon de styles) — rien n'est publié", async () => {
    // Programme 20.4 : la liste des modèles est servie par catalogue.json (recherche et pagination côté serveur)
    const lib = json(await adminA.get(`${R}/templates/catalogue.json?site=${A}&source=pack&q=${encodeURIComponent("Indépendant et services")}`));
    const pack = lib.items.find((i) => i.ref === "pack:service-professionnel"); assert.ok(pack);
    const r = json(await adminA.postJson(`${R}/templates/importer?site=${A}`, { site: String(A), ref: pack.ref, importKey: key(), menu: true, styles: true }));
    assert.equal(r.ok, true, JSON.stringify(r)); imported = r.result;
    assert.equal(imported.pages.length, 5); assert.ok(imported.menu && imported.styles);
    assert.equal(one("SELECT COUNT(*) n FROM mk_landing_pages WHERE site_id = ? AND published_at IS NOT NULL", A).n, 0);
  });

  test("2. Éditeur du site : les pages importées sont là, ouvertes par le vrai Page Builder (cadre), avec leur état", async () => {
    const hub = bootOf((await adminA.get(`${R}/editeur-du-site?site=${A}`)).text, "se-data");
    assert.deepEqual(hub.pages.map((p) => p.name).sort(), imported.pages.map((p) => p.name).sort());
    assert.ok(hub.pages.every((p) => !p.published));
    for (const p of imported.pages) { const ed = await adminA.get(`/marketing/pages/${p.id}/editeur?cadre=1`); assert.equal(ed.status, 200); assert.ok(ed.text.includes("data-pb-save") && ed.text.includes("pb-embedded")); }
    assert.equal(hub.menus.header && hub.menus.header.id, imported.menu.id, "le menu du pack est affecté à l'en-tête s'il est libre (fb47836), jamais au pied de page");
    assert.equal(hub.menus.footer, undefined);
  });

  test("3. Patterns : insérer un pattern dans la page d'accueil importée — sections natives ajoutées au brouillon, modifiables", async () => {
    const home = imported.pages.find((p) => p.key === "accueil");
    const before = JSON.parse(one("SELECT sections FROM mk_landing_pages WHERE id = ?", home.id).sections).length;
    const r = json(await adminA.postJson(`${R}/patterns/inserer?site=${A}`, { site: String(A), ref: "builtin:stats", pageId: home.id, position: "end" }));
    assert.equal(r.ok, true, JSON.stringify(r));
    const d = JSON.parse(one("SELECT draft FROM mk_landing_pages WHERE id = ?", home.id).draft);
    assert.equal(d.sections.length, before + 1); assert.equal(d.sections.at(-1).type, "layout");
    const hub = bootOf((await adminA.get(`${R}/editeur-du-site?site=${A}`)).text, "se-data");
    assert.ok(hub.pending.some((p) => p.id === home.id), "la page modifiée apparaît dans la publication");
  });

  test("4. Styles : le brouillon préparé par le pack est visible dans Styles ; le publier change le site (moteur et rendu)", async () => {
    const st = bootOf((await adminA.get(`${R}/styles?site=${A}`)).text, "st-data");
    assert.equal(st.values["tokens.colors.primary"], IDY("service-professionnel").colors.primary, "identité du pack dans le brouillon"); assert.equal(st.live["tokens.colors.primary"], "#0277b6", "version en ligne inchangée jusque-là");
    const pub = json(await adminA.postJson(`${R}/styles/publier?site=${A}`, { site: String(A), rev: st.draft.rev }));
    assert.equal(pub.ok, true, JSON.stringify(pub));
    assert.equal(JSON.parse(one("SELECT tokens FROM mk_sites WHERE id = ?", A).tokens).colors.primary, IDY("service-professionnel").colors.primary);
    const st2 = bootOf((await adminA.get(`${R}/styles?site=${A}`)).text, "st-data"); assert.equal(st2.live["tokens.colors.primary"], IDY("service-professionnel").colors.primary); assert.equal(st2.draft.count, 0);
  });

  test("5. Publication : les pages prêtes passent en ligne (contrôles habituels), les autres disent pourquoi ; le site public utilise le contenu ET les styles", async () => {
    const hub = bootOf((await adminA.get(`${R}/editeur-du-site?site=${A}`)).text, "se-data");
    const pend = await (async () => json(await adminA.get(`${R}/editeur-du-site/etat?site=${A}`)).pending)();
    const ready = pend.filter((p) => p.ready), blocked = pend.filter((p) => !p.ready);
    void hub;
    const r = json(await adminA.postJson(`${R}/editeur-du-site/publier?site=${A}`, { site: String(A), pageIds: pend.map((p) => p.id) }));
    assert.equal(r.ok, true);
    for (const p of ready) assert.equal(r.results.find((x) => x.id === p.id).ok, true, `${p.name} prête`);
    for (const p of blocked) { const x = r.results.find((y) => y.id === p.id); assert.equal(x.ok, false); assert.ok(x.error, `${p.name} : raison`); }
    const published = all("SELECT id, name, slug FROM mk_landing_pages WHERE site_id = ? AND published_at IS NOT NULL", A);
    assert.ok(published.length >= 1, "au moins une page est publiée");
    const pub = await anon.get(`/p/${published[0].slug}`);
    assert.equal(pub.status, 200); assert.match(pub.text, new RegExp(`--kw-primary:${IDY("service-professionnel").colors.primary}`), "le site public utilise la palette publiée");
    assert.ok(imported.pages.length - published.length === blocked.length, "chaque page non publiée est expliquée");
  });

  test("6. Rechargement et isolation : tout persiste ; le site B est identique, octet pour octet, depuis le début du parcours", async () => {
    const hub = bootOf((await adminA.get(`${R}/editeur-du-site?site=${A}`)).text, "se-data");
    assert.ok(hub.pages.some((p) => p.published), "l'état publié survit au rechargement");
    const lib = bootOf((await adminA.get(`${R}/templates?site=${A}`)).text, "tp-data"); assert.equal(lib.history.length, 1);
    assert.equal(siteB(), snapshotB, "le site B n'a pas changé");
    assert.ok(one("SELECT COUNT(*) n FROM mk_audit_logs WHERE action IN ('template.imported','pattern.inserted','styles.published','site_editor.published')").n >= 4, "chaque étape est journalisée");
  });
});
