// Programme 22.8 — moteur responsive : typographie fluide (sécurité), profils de points de rupture, audit statique, assistant (proposer → appliquer → annuler) sur serveur réel, isolation multisite.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, loginInstructor, newStudent } = require("./helpers");
const Fluid = require("../src/responsive/fluid");
const BP = require("../src/responsive/breakpoints");
const Audit = require("../src/responsive/audit");
const B = require("../src/layoutGen/base");
const V = require("../src/layoutGen/validate");
const nodes = require("../src/marketing/pages/nodes");

const x = { seed: "r228" };
// Section volontairement fragile : largeur fixe, 4 colonnes, titre énorme, ligne de 3 éléments sans retour, contenu essentiel masqué sur mobile
const fragile = () => V.toSection("frag", [
  B.node(x, "container", {}, { d: { width: "640px" } }, [B.heading(x, "Largeur fixe", 2, { d: { fontSize: "24px" } })], { name: "Bloc fixe" }),
  B.node(x, "grid", {}, { d: { display: "grid", columns: 4, gap: "token:space-md" } }, [1, 2, 3, 4].map((i) => B.heading(x, `Carte ${i}`, 3, { d: { fontSize: "20px" } }))),
  B.heading(x, "Titre immense", 1, { d: { fontSize: "72px" } }),
  B.node(x, "container", {}, { d: { display: "flex", flexDirection: "row" } }, [B.heading(x, "A", 3), B.heading(x, "B", 3), B.heading(x, "C", 3)]),
]);

describe("Typographie fluide : sûre et exacte", () => {
  const css = (fs) => { const h = B.heading(x, "T", 1, { d: { fontSize: fs } }); const r = V.validate({}, V.toSection("t", [h])); return r.ok ? /font-size:([^;}]*)/.exec(nodes.pageCss([r.section]))[1] : null; };
  test("fluid:min-max devient un clamp() calculé, jamais saisi ; bornes exactes à 320 et 1440 px", () => {
    const c = css("fluid:28-56"); assert.match(c, /^clamp\(1\.75rem, [\d.]+rem \+ [\d.]+vw, 3\.5rem\)$/);
    const m = /clamp\(([\d.]+)rem, ([\d.]+)rem \+ ([\d.]+)vw, ([\d.]+)rem\)/.exec(c).slice(1).map(Number);
    const at = (w) => Math.min(m[3] * 16 / 16 * 16, 0) + Math.max(m[0] * 16, Math.min(m[3] * 16, m[1] * 16 + (m[2] / 100) * w));
    assert.ok(Math.abs(at(320) - 28) < 0.1, `à 320 px : ${at(320)}`); assert.ok(Math.abs(at(1440) - 56) < 0.1, `à 1440 px : ${at(1440)}`);
  });
  test("calc(), clamp() libres, bornes inversées ou hors limites : refusés", () => {
    for (const bad of ["calc(1px + 2vw)", "clamp(1px, 2vw, 3px)", "fluid:90-30", "fluid:4-20", "fluid:20-500", "fluid:20-30;color:red", "fluid:20-30 }"]) assert.equal(css(bad), null, bad);
    assert.equal(css("24px"), "24px", "les valeurs existantes ne changent pas");
  });
  test("titre conseillé : jamais sous 26–30 px, borné", () => { assert.equal(Fluid.forHeading(72, 1), "fluid:40-72"); assert.equal(Fluid.forHeading(30, 1), null); });
});

describe("Breakpoint Manager", () => {
  test("sept profils rattachés à l'écran natif du site, selon SES seuils", () => {
    assert.equal(BP.PROFILES.length, 7);
    const d = Object.fromEntries(BP.profilesFor().map((p) => [p.key, p.device]));
    assert.deepEqual(d, { "mobile-small": "mobile", mobile: "mobile", "mobile-large": "mobile", tablet: "tablet", laptop: "desktop", desktop: "desktop", wide: "wide" });
    const custom = Object.fromEntries(BP.profilesFor({ tablet: 1279, mobile: 400, wide: 1600 }).map((p) => [p.key, p.device]));
    assert.equal(custom["mobile-large"], "tablet", "430 px > seuil mobile 400"); assert.equal(custom.laptop, "desktop", "1280 px est au-dessus du seuil tablette 1279"); assert.equal(custom.tablet, "tablet");
  });
  test("incohérences de seuils signalées ; largeurs d'arête pour tester les conflits de media queries", () => {
    assert.ok(BP.check({ tablet: 700, mobile: 767, wide: 1920 }).length >= 1); assert.deepEqual(BP.check(), []);
    assert.deepEqual(BP.edgeWidths(), [767, 768, 1023, 1024, 1919, 1920]);
  });
});

describe("Audit statique", () => {
  test("détecte les cinq défauts fabriqués, avec écran, preuve et correction ; l'ordinateur n'est jamais modifié", () => {
    const sec = V.validate({}, fragile()).section; const a = Audit.auditSections([sec]);
    const rules = new Set(a.issues.map((i) => i.rule));
    for (const r of ["fixed-width", "grid-narrow", "heading-too-large", "flex-row-crowded"]) assert.ok(rules.has(r), r);
    for (const i of a.issues.filter((i) => i.fix)) { assert.notEqual(i.fix.device, "desktop"); assert.ok(i.evidence && i.element && i.device && i.message); }
    assert.equal(a.summary.blocking >= 2, true);
  });
  test("une valeur propre à l'écran (réglage manuel) n'est jamais signalée ni écrasée", () => {
    const s = fragile(); s.children[0].styles.mobile = { width: "100%" }; s.children[2].styles.mobile = { fontSize: "30px" };
    const a = Audit.auditSections([V.validate({}, s).section]);
    assert.ok(!a.issues.some((i) => i.rule === "fixed-width" || i.rule === "heading-too-large"));
  });
  test("contenu essentiel masqué sur mobile : avertissement sans correction automatique", () => {
    const s = fragile(); s.children[2].hideOn = ["mobile"];
    const a = Audit.auditSections([V.validate({}, s).section]); const h = a.issues.find((i) => i.rule === "hidden-essential");
    assert.ok(h && h.fix === null);
  });
});

describe("Assistant responsive (serveur réel)", () => {
  let srv, db, boss, A, Bsite, editorA, pageA, pageB;
  const one = (sql, ...a) => db.prepare(sql).get(...a);
  const U = (site, p = "") => `/marketing/site-web/sites/${site}/responsive${p}`;
  const post = (c, path, body) => c.request(path, { method: "POST", json: body || {} });
  const json = (r) => JSON.parse(r.text);
  const draft = (id) => JSON.parse(one("SELECT draft FROM mk_landing_pages WHERE id = ?", id).draft).sections;
  const put = (id, sections) => db.prepare("UPDATE mk_landing_pages SET draft = ? WHERE id = ?").run(JSON.stringify({ sections }), id);
  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv); db = srv.db();
    const mk = async (name) => Number((await boss.post("/marketing/site-web/sites", { name })).location.match(/sites\/(\d+)/)[1]);
    A = await mk("Site Alpha"); Bsite = await mk("Site Bravo");
    await boss.post("/marketing/pages", { name: "Page Alpha", site_id: A, kind: "page" }); await boss.post("/marketing/pages", { name: "Page Bravo", site_id: Bsite, kind: "page" });
    pageA = one("SELECT id FROM mk_landing_pages WHERE name = 'Page Alpha'").id; pageB = one("SELECT id FROM mk_landing_pages WHERE name = 'Page Bravo'").id;
    const sec = V.validate({}, fragile()).section; put(pageA, [sec]); put(pageB, [V.validate({}, V.toSection("b", [B.heading({ seed: "b" }, "Titre B", 1, { d: { fontSize: "80px" } })])).section]);
    editorA = await newStudent(srv); db.prepare("INSERT INTO mk_site_members (site_id, user_id, role) VALUES (?, ?, 'viewer')").run(A, one("SELECT id FROM users WHERE email = ?", editorA.email).id);
  });
  after(async () => { db.close(); await srv.stop(); });

  test("écran et profils : sept profils, seuils du site, aucun secret ; 404 pour un site inconnu", async () => {
    const r = await boss.get(U(A)); assert.equal(r.status, 200); for (const s of ['id="rs-form"', 'role="status"', "responsive-studio.js"]) assert.ok(r.text.includes(s), s);
    assert.equal((await boss.get("/js/responsive-studio.js")).status, 200); assert.equal((await boss.get(U(999999))).status, 404);
    const p = json(await boss.get(U(A, "/api/profils"))); assert.equal(p.profiles.length, 7); assert.deepEqual(p.breakpoints, { tablet: 1023, mobile: 767, wide: 1920 });
  });
  test("analyse d'une page et du site : lecture seule, rien n'est écrit", async () => {
    const before = one("SELECT draft FROM mk_landing_pages WHERE id = ?", pageA).draft;
    const j = json(await boss.get(U(A, `/api/pages/${pageA}/analyse`))); assert.ok(j.summary.total >= 4 && j.summary.fixable >= 3);
    const all = json(await boss.get(U(A, "/api/analyse"))); assert.ok(all.pages.every((p) => p.issues.every((i) => i.page === p.page.id)));
    assert.equal(one("SELECT draft FROM mk_landing_pages WHERE id = ?", pageA).draft, before);
  });
  test("proposer → appliquer → annuler : tablette/mobile seulement, ordinateur intact, brouillon uniquement, annulation exacte", async () => {
    const orig = one("SELECT draft FROM mk_landing_pages WHERE id = ?", pageA).draft, status0 = one("SELECT status FROM mk_landing_pages WHERE id = ?", pageA).status;
    const pr = await post(boss, U(A, "/api/proposer"), { pageId: pageA, scope: "page" }); assert.equal(pr.status, 200, pr.text.slice(0, 300)); const p = json(pr);
    assert.equal(p.status, "proposed"); assert.ok(p.changes.length >= 3); assert.equal(one("SELECT draft FROM mk_landing_pages WHERE id = ?", pageA).draft, orig, "la proposition n'écrit rien");
    const ap = await post(boss, U(A, `/api/operations/${p.opId}/appliquer`), {}); assert.equal(ap.status, 200, ap.text.slice(0, 300));
    const s = draft(pageA)[0], flat = []; const walk = (l) => l.forEach((n) => { flat.push(n); walk(n.children || []); }); walk(s.children);
    const fixed = flat.find((n) => n.props && n.props.text === undefined && n.name === "Bloc fixe"); assert.equal(fixed.styles.mobile.width, "100%"); assert.equal(fixed.styles.desktop.width, "640px", "ordinateur intact");
    const big = flat.find((n) => n.props && n.props.text === "Titre immense"); assert.match(big.styles.mobile.fontSize, /^fluid:/); assert.equal(big.styles.desktop.fontSize, "72px");
    assert.equal(one("SELECT status FROM mk_landing_pages WHERE id = ?", pageA).status, status0, "rien n'est publié");
    assert.equal((await post(boss, U(A, `/api/operations/${p.opId}/appliquer`), {})).status, 409, "déjà appliquée");
    const un = await post(boss, U(A, `/api/operations/${p.opId}/annuler`)); assert.equal(un.status, 200, un.text.slice(0, 300));
    assert.deepEqual(draft(pageA).map((x) => x.id), JSON.parse(orig).sections.map((x) => x.id)); assert.ok(!JSON.stringify(draft(pageA)).includes("fluid:"));
  });
  test("une correction locale reste locale : la portée « élément » ne touche que cet élément", async () => {
    const a = json(await boss.get(U(A, `/api/pages/${pageA}/analyse`))); const target = a.issues.find((i) => i.rule === "heading-too-large");
    const p = json(await post(boss, U(A, "/api/proposer"), { pageId: pageA, scope: "node", sectionId: target.section, nodeId: target.node, rules: [target.rule] }));
    assert.ok(p.changes.length >= 1 && p.changes.every((c) => c.path.split("/")[1] === target.node), "un seul élément");
    await post(boss, U(A, `/api/operations/${p.opId}/refuser`)); assert.equal((await post(boss, U(A, `/api/operations/${p.opId}/appliquer`), {})).status, 409, "refusée ≠ appliquable");
  });
  test("protections : conflit après modification (409) ; section validée = confirmation ; section verrouillée = 423", async () => {
    const reg = (kind, ref, state) => post(boss, `/marketing/site-web/sites/${A}/regeneration/api/protections`, { kind, ref, state });
    const sid = draft(pageA)[0].id;
    const p1 = json(await post(boss, U(A, "/api/proposer"), { pageId: pageA, scope: "page" }));
    db.prepare("UPDATE mk_landing_pages SET draft = ? WHERE id = ?").run(JSON.stringify({ sections: draft(pageA).map((s) => ({ ...s, name: "modifiée à la main" })) }), pageA);
    assert.equal((await post(boss, U(A, `/api/operations/${p1.opId}/appliquer`), {})).status, 409, "section changée depuis la proposition");
    assert.equal((await reg("section", sid, "validated")).status, 200);
    const p2 = json(await post(boss, U(A, "/api/proposer"), { pageId: pageA, scope: "page" })); assert.equal(p2.requiresConfirmation, true, "section validée : confirmation exigée");
    assert.equal((await post(boss, U(A, `/api/operations/${p2.opId}/appliquer`), {})).status, 409, "sans confirmation : refus");
    assert.equal((await reg("section", sid, "locked")).status, 200);
    const p3 = json(await post(boss, U(A, "/api/proposer"), { pageId: pageA, scope: "page" }));
    const locked = await post(boss, U(A, `/api/operations/${p3.opId}/appliquer`), { confirm: true, allow: [sid] }); assert.equal(locked.status, 423); assert.equal(json(locked).code, "protected");
    assert.ok(!JSON.stringify(draft(pageA)).includes("fluid:"), "rien n'a été écrit");
  });
  test("isolation multisite : l'opération du site A est introuvable depuis B ; la page de B refusée depuis A", async () => {
    const pb = await post(boss, U(Bsite, "/api/proposer"), { pageId: pageB, scope: "page" }); assert.equal(pb.status, 200, pb.text.slice(0, 200)); const opB = json(pb).opId;
    assert.equal((await post(boss, U(A, `/api/operations/${opB}/appliquer`), {})).status, 404);
    assert.notEqual((await post(boss, U(A, "/api/proposer"), { pageId: pageB, scope: "page" })).status, 200, "page d'un autre site");
    assert.equal((await post(boss, U(Bsite, `/api/operations/${opB}/appliquer`), {})).status, 200);
    assert.ok(!JSON.stringify(draft(pageA)).includes("Titre B"));
  });
  test("droits : un lecteur ne peut ni proposer ni annuler", async () => {
    assert.equal((await post(editorA, U(A, "/api/proposer"), { pageId: pageA, scope: "page" })).status, 403);
  });
});
