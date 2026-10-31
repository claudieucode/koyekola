// Programme 22.9 — parcours HTTP réel : priorité de l'image principale sur la page publique, tableau de bord, analyse, historique, comparaison, droits, isolation entre sites, journal.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { TEST_KEY } = require("./marketing-helpers");
const zlib = require("node:zlib");
const fs = require("node:fs");
const path = require("node:path");
const { startServer, loginInstructor, newStudent, Client } = require("./helpers");

describe("Performance des pages publiées (serveur réel)", () => {
  let srv, db, boss, anon, A, B, editorA, readerA, adminB, pageA, pageB, slugA, slugB;
  const one = (sql, ...a) => db.prepare(sql).get(...a);
  const idOf = (c) => one("SELECT id FROM users WHERE email = ?", c.email).id;
  const U = (site, p = "") => `/marketing/site-web/sites/${site}/performance${p}`;
  const json = (r) => JSON.parse(r.text);
  const post = (c, path, body) => c.request(path, { method: "POST", json: body || {} });
  const imgNode = (id, src, alt) => ({ id, type: "image", props: { src, alt }, styles: { desktop: {}, tablet: {}, mobile: {} }, children: [] });
  const layout = (id, nodes) => ({ type: "layout", id, children: nodes });
  async function publish(pageId, sections) {
    const r = one("SELECT revision, title, name FROM mk_landing_pages WHERE id = ?", pageId);
    const s = await boss.request(`/marketing/pages/${pageId}/brouillon`, { method: "PUT", json: { revision: r.revision, content: { sections, title: r.title || r.name, description: "" } } });
    assert.equal(s.status, 200, s.text.slice(0, 300));
    assert.equal((await boss.post(`/marketing/pages/${pageId}/publier.json`, {})).status, 200);
  }
  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "", KOLAKISA_PERF_GAP_MS: "0" });
    boss = await loginInstructor(srv); anon = new Client(srv.base); db = srv.db();
    const mk = async (name) => Number((await boss.post("/marketing/site-web/sites", { name })).location.match(/sites\/(\d+)/)[1]);
    A = await mk("Perf Alpha"); B = await mk("Perf Bravo");
    const member = async (site, role) => { const c = await newStudent(srv); db.prepare("INSERT INTO mk_site_members (site_id, user_id, role) VALUES (?, ?, ?)").run(site, idOf(c), role); return c; };
    editorA = await member(A, "editor"); adminB = await member(B, "admin");
    await boss.post("/marketing/site-web/utilisateurs/roles", { name: "Contacts seuls", description: "t", perm: ["contacts.read"] });
    readerA = await member(A, one("SELECT key FROM mk_roles WHERE name = 'Contacts seuls'").key);
    await boss.post("/marketing/pages", { name: "Page PA", site_id: A, kind: "page" }); await boss.post("/marketing/pages", { name: "Page PB", site_id: B, kind: "page" });
    pageA = one("SELECT id, slug FROM mk_landing_pages WHERE name = 'Page PA'"); pageB = one("SELECT id, slug FROM mk_landing_pages WHERE name = 'Page PB'"); slugA = pageA.slug; slugB = pageB.slug; pageA = pageA.id; pageB = pageB.id;
    await publish(pageA, [layout("lseca0000001", [imgNode("aaaaaa01", "https://exemple.test/hero.jpg", "Image principale"), imgNode("aaaaaa02", "https://exemple.test/second.jpg", "Seconde image")])]);
    await publish(pageB, [layout("lsecb0000001", [imgNode("bbbbbb01", "https://exemple.test/b.jpg", "Image B")])]);
  });
  after(async () => { db.close(); await srv.stop(); });

  test("page publique : seule la première grande image perd le chargement différé et devient prioritaire ; la page reste complète", async () => {
    const r = await anon.get(`/p/${slugA}`); assert.equal(r.status, 200);
    const imgs = r.text.match(/<img\b[^>]*>/g).filter((t) => /exemple\.test/.test(t));
    assert.equal(imgs.length, 2);
    assert.match(imgs[0], /fetchpriority="high"/); assert.doesNotMatch(imgs[0], /loading="lazy"/);
    assert.match(imgs[1], /loading="lazy"/); assert.doesNotMatch(imgs[1], /fetchpriority/);
    assert.match(r.text, /<\/html>\s*$/); assert.match(r.headers.get("content-type"), /text\/html/);
    assert.match(r.headers.get("cache-control"), /no-store|no-cache/, "les pages publiques restent non mises en cache partagé (personnalisées)");
  });
  test("tableau de bord : écran accessible sans secret, assets servis, introuvable pour un site inconnu, refusé sans droit de lecture", async () => {
    const r = await boss.get(U(A)); assert.equal(r.status, 200);
    for (const s of ['id="pf-status"', 'role="status"', 'aria-live="polite"', "performance.js", "performance.css", 'scope="col"']) assert.ok(r.text.includes(s), s);
    assert.ok(!/ANTHROPIC|sk-ant|ENCRYPTION/.test(r.text));
    assert.equal((await boss.get("/js/performance.js")).status, 200); assert.equal((await boss.get("/css/performance.css")).status, 200);
    assert.equal((await boss.get(U(999999))).status, 404); assert.notEqual((await readerA.get(U(A))).status, 200);
  });
  test("analyse d'une page publiée : métriques étiquetées, LCP/INP/CLS indisponibles, constats complets, candidat LCP corrigé automatiquement", async () => {
    const r = await post(boss, U(A, `/api/pages/${pageA}/analyser`)); assert.equal(r.status, 200, r.text.slice(0, 300)); const j = json(r);
    const m = j.report.metrics; assert.ok(m.htmlBytes.value > 1000 && m.htmlBytes.env === "analyse-statique"); assert.ok(m.cssBytes.value > 10000, "landing.css mesurée sur le disque");
    for (const k of ["lcp", "inp", "cls"]) assert.equal(m[k].kind, "indisponible"); assert.equal(m.ttfb.env, "serveur"); assert.ok(m.ttfb.value >= 0);
    assert.equal(j.report.facts.lcpCandidate.fetchpriority, "high", "l'analyse lit le HTML réellement servi, donc déjà optimisé");
    assert.ok(!j.report.findings.some((f) => f.id === "lcp-lazy"));
    assert.match(j.report.conditions.note, /LCP\/INP\/CLS/); assert.equal(j.comparison, null);
    for (const f of j.report.findings) for (const k of ["origin", "impact", "fix", "difficulty", "severity"]) assert.ok(f[k]);
  });
  test("désactiver l'option : la page redevient telle que le gabarit la produit, constat « image différée » signalé, journal tenu ; réactiver = retour arrière", async () => {
    assert.equal((await post(boss, U(A, "/api/options"), { option: "lcpPriority", value: false })).status, 200);
    const off = await anon.get(`/p/${slugA}`); assert.doesNotMatch(off.text, /fetchpriority="high"/);
    const a = json(await post(boss, U(A, `/api/pages/${pageA}/analyser`)));
    const f = a.report.findings.find((x) => x.id === "lcp-lazy"); assert.ok(f, "le problème est détecté quand l'optimisation est coupée"); assert.equal(f.auto, false);
    assert.ok(a.comparison && a.comparison.items.length > 0, "comparaison automatique avec le rapport précédent");
    assert.equal((await post(boss, U(A, "/api/options"), { option: "lcpPriority", value: true })).status, 200);
    assert.match((await anon.get(`/p/${slugA}`)).text, /fetchpriority="high"/);
    const v = json(await boss.get(U(A, "/api/vue"))); assert.equal(v.settings.lcpPriority, true);
    assert.deepEqual(v.log.slice(0, 2).map((l) => [l.before, l.after]), [[0, 1], [1, 0]]);
  });
  test("réglage du site A sans effet sur le site B ; options invalides refusées", async () => {
    await post(boss, U(A, "/api/options"), { option: "lcpPriority", value: false });
    assert.match((await anon.get(`/p/${slugB}`)).text, /fetchpriority="high"/);
    assert.equal(json(await boss.get(U(B, "/api/vue"))).settings.lcpPriority, true);
    assert.equal((await post(boss, U(A, "/api/options"), { option: "autre", value: true })).status, 422);
    assert.equal((await post(boss, U(A, "/api/options"), { option: "lcpPriority", value: "oui" })).status, 422);
    await post(boss, U(A, "/api/options"), { option: "lcpPriority", value: true });
  });
  test("historique, détail et comparaison : seuils configurables, rapports d'un autre site inaccessibles", async () => {
    const h = json(await boss.get(U(A, `/api/pages/${pageA}/historique`))).history; assert.ok(h.length >= 2); assert.ok(h[0].summary.htmlGzipBytes > 0);
    const c = json(await post(boss, U(A, "/api/comparer"), { before: h[h.length - 1].id, after: h[0].id, thresholds: { jsBytes: { rel: 0.5, abs: 100000 } } }));
    assert.ok(["stable", "incertain", "régression"].includes(c.comparison.verdict)); assert.equal(c.comparison.blocking, false); assert.equal(c.comparison.thresholds.jsBytes.rel, 0.5);
    const b = json(await post(boss, U(B, `/api/pages/${pageB}/analyser`)));
    assert.equal((await boss.get(U(A, `/api/rapports/${b.id}`))).status, 404, "rapport du site B introuvable depuis le site A");
    assert.equal((await post(boss, U(A, "/api/comparer"), { before: h[0].id, after: b.id })).status, 404);
    assert.equal((await boss.get(U(A, `/api/pages/${pageB}/historique`))).status, 404, "page d'un autre site");
    assert.equal((await post(boss, U(A, `/api/pages/${pageB}/analyser`))).status, 404);
  });
  test("brouillon ou page non publiée : analyse refusée ; droits : lecteur sans forms.read refusé, éditeur sans forms.write ne règle pas", async () => {
    await boss.post("/marketing/pages", { name: "Brouillon P", site_id: A, kind: "page" });
    const d = one("SELECT id FROM mk_landing_pages WHERE name = 'Brouillon P'").id;
    const r = await post(boss, U(A, `/api/pages/${d}/analyser`)); assert.equal(r.status, 422); assert.match(json(r).error, /publiée/);
    assert.notEqual((await post(readerA, U(A, `/api/pages/${pageA}/analyser`))).status, 200);
    assert.notEqual((await post(readerA, U(A, "/api/options"), { option: "lcpPriority", value: false })).status, 200);
    assert.equal((await post(adminB, U(A, `/api/pages/${pageA}/analyser`))).status === 200, false, "administrateur du site B sans droit sur A");
  });
  test("image de la médiathèque : width/height réservés d'après le fichier ; image externe ou recadrée : aucun attribut inventé", async () => {
    const png = (w, h) => { const chunk = (t, d) => { const b = Buffer.alloc(12 + d.length); b.writeUInt32BE(d.length, 0); b.write(t, 4, "latin1"); d.copy(b, 8); b.writeUInt32BE(zlib.crc32(b.subarray(4, 8 + d.length)) >>> 0, 8 + d.length); return b; };
      const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 2;
      const raw = Buffer.alloc((w * 3 + 1) * h); return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk("IHDR", ihdr), chunk("IDAT", zlib.deflateSync(raw)), chunk("IEND", Buffer.alloc(0))]); };
    const org = one("SELECT id FROM mk_organizations").id, name = "1700000000000-abcdef012345.png", dir = path.join(srv.dir, "uploads", "marketing", String(org));
    fs.mkdirSync(dir, { recursive: true }); fs.writeFileSync(path.join(dir, name), png(40, 20));
    await boss.post("/marketing/pages", { name: "Page Dim", site_id: A, kind: "page" });
    const pd = one("SELECT id, slug FROM mk_landing_pages WHERE name = 'Page Dim'");
    await publish(pd.id, [layout("lsecd0000001", [imgNode("dddddd01", `/uploads/marketing/${org}/${name}`, "Image médiathèque"), imgNode("dddddd02", "https://exemple.test/ext.jpg", "Image externe")])]);
    const t = (await anon.get(`/p/${pd.slug}`)).text.match(/<img\b[^>]*>/g);
    const lib = t.find((x) => x.includes(name)), ext = t.find((x) => x.includes("ext.jpg"));
    assert.match(lib, /width="40" height="20"/); assert.doesNotMatch(ext, /\swidth=/);
  });
  test("vue globale : comptes réels, données terrain déclarées indisponibles, aucun score inventé", async () => {
    const v = json(await boss.get(U(A, "/api/vue"))).overview;
    assert.ok(v.totals.pages >= 2 && v.totals.analyzed >= 1); assert.equal(v.field.available, false); assert.match(v.field.note, /terrain/);
    assert.ok(!JSON.stringify(v).includes('"score"')); assert.equal(v.vitals.thresholds.lcp.good, 2500);
  });
  test("optimiser n'altère ni le statut ni le contenu de la page : mêmes sections, même révision", async () => {
    const before = one("SELECT revision, sections FROM mk_landing_pages WHERE id = ?", pageA);
    await post(boss, U(A, "/api/options"), { option: "lcpPriority", value: false }); await post(boss, U(A, "/api/options"), { option: "lcpPriority", value: true });
    const after = one("SELECT revision, sections FROM mk_landing_pages WHERE id = ?", pageA); assert.deepEqual(after, before);
  });
});

describe("Performance : anti-rafale et historique borné (serveur réel)", () => {
  let srv, boss, db, site, page;
  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "", KOLAKISA_PERF_GAP_MS: "60000" });
    boss = await loginInstructor(srv); db = srv.db();
    site = Number((await boss.post("/marketing/site-web/sites", { name: "Perf Rafale" })).location.match(/sites\/(\d+)/)[1]);
    await boss.post("/marketing/pages", { name: "Page R", site_id: site, kind: "page" });
    page = db.prepare("SELECT id, revision FROM mk_landing_pages WHERE name = 'Page R'").get();
    await boss.request(`/marketing/pages/${page.id}/brouillon`, { method: "PUT", json: { revision: page.revision, content: { sections: [{ type: "layout", id: "lsecr0000001", children: [{ id: "rrrrrr01", type: "heading", props: { text: "Titre", level: 1 }, styles: { desktop: {}, tablet: {}, mobile: {} }, children: [] }] }], title: "Page R", description: "" } } });
    await boss.post(`/marketing/pages/${page.id}/publier.json`, {});
  });
  after(async () => { db.close(); await srv.stop(); });
  test("une seconde analyse immédiate de la même page est refusée avec un message clair", async () => {
    const u = `/marketing/site-web/sites/${site}/performance/api/pages/${page.id}/analyser`;
    assert.equal((await boss.request(u, { method: "POST", json: {} })).status, 200);
    const r = await boss.request(u, { method: "POST", json: {} }); assert.equal(r.status, 422); assert.match(JSON.parse(r.text).error, /patientez/);
  });
  test("historique borné à 30 rapports par page (les plus anciens sont retirés, jamais les données du site)", async () => {
    const orgId = db.prepare("SELECT organization_id o FROM mk_landing_pages WHERE id = ?").get(page.id).o;
    const ins = db.prepare("INSERT INTO mk_perf_reports (organization_id, site_id, page_id, kind, env, build, optimization, report) VALUES (?, ?, ?, 'statique', 'analyse-statique', 'x', '{}', '{}')");
    for (let i = 0; i < 40; i++) ins.run(orgId, site, page.id);
    process.env.KOLAKISA_PERF_GAP_MS = "0"; // le service tourne ici, dans le processus de test
    const P = require("../src/perfEngine");
    const ctx = { db, organizationId: orgId, userId: null };
    const out = await P.analyzePage(ctx, site, page.id, async () => ({ status: 200, html: "<html><body><main><p>x</p></main></body></html>", headers: {}, ttfbMs: 1 }), { host: "k.test" });
    assert.ok(out.id > 0);
    assert.equal(db.prepare("SELECT COUNT(*) n FROM mk_perf_reports WHERE page_id = ?").get(page.id).n, 30, "40 anciens + 1 nouveau → 30 gardés");
    assert.equal(db.prepare("SELECT MAX(id) m FROM mk_perf_reports WHERE page_id = ?").get(page.id).m, out.id, "le plus récent est conservé");
    assert.equal(db.prepare("SELECT COUNT(*) n FROM mk_landing_pages WHERE id = ?").get(page.id).n, 1, "la page elle-même n'est jamais touchée");
    await assert.rejects(() => P.analyzePage(ctx, site, page.id, async () => ({ status: 200, html: "x".repeat(5 * 1024 * 1024 + 1), headers: {} }), {}), /5 Mo/);
    delete process.env.KOLAKISA_PERF_GAP_MS;
  });
});
