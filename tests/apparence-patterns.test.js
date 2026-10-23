// KOLAKISA CMS — Apparence → Patterns : bibliothèque de compositions PAR SITE, sur les vraies routes, la vraie base, de vrais comptes.
// Bibliothèque (intégrés + compositions du site), aperçu réel avec les styles du site, insertion dans le BROUILLON d'une page (sections natives, rien de publié), enregistrement depuis une page,
// renommage / duplication / corbeille, validation, permissions côté serveur, isolation A / B / principal.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, loginInstructor, newStudent, Client } = require("./helpers");
const access = require("../src/services/cmsAccess");

describe("patterns : bibliothèque, aperçu, insertion, compositions, isolation", () => {
  let srv, boss, db, orgId, A, B, adminA, editorA, viewerA, pageA1, pageA2, pageB, pageStep;
  const one = (sql, ...a) => db.prepare(sql).get(...a);
  const all = (sql, ...a) => db.prepare(sql).all(...a);
  const idOf = (c) => one("SELECT id FROM users WHERE email = ?", c.email).id;
  const PT = "/marketing/site-web/patterns";
  const q = (site) => (site ? `?site=${site}` : "");
  const person = async (siteId, role) => { const c = await newStudent(srv); db.prepare("INSERT INTO mk_site_members (site_id, user_id, role) VALUES (?, ?, ?)").run(siteId, idOf(c), role); return c; };
  const bootOf = (html) => JSON.parse(/<script type="application\/json" id="pt-data">([\s\S]*?)<\/script>/.exec(html)[1].replace(/\\u003c/g, "<"));
  const post = (c, path, site, body) => c.postJson(`${PT}/${path}${q(site)}`, { ...(site ? { site: String(site) } : {}), ...body });
  const json = (r) => { try { return JSON.parse(r.text); } catch { return null; } };
  const page = (id) => { const r = one("SELECT * FROM mk_landing_pages WHERE id = ?", id); return { ...r, draftSections: r.draft ? JSON.parse(r.draft).sections : null, pubSections: JSON.parse(r.sections) }; };
  const sec = (type, extra = {}) => ({ type, ...extra });

  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "", ALLOW_INDEXING: "1" });
    boss = await loginInstructor(srv); db = srv.db();
    orgId = one("SELECT id FROM mk_organizations").id;
    const site = (n, tokens = "{}") => Number(db.prepare("INSERT INTO mk_sites (organization_id, name, slug, tokens) VALUES (?, ?, ?, ?)").run(orgId, n, n.toLowerCase(), tokens).lastInsertRowid);
    A = site("Alpha", JSON.stringify({ colors: { primary: "#8a1c3a" } })); B = site("Beta");
    adminA = await person(A, "admin"); editorA = await person(A, "editor"); viewerA = await person(A, "viewer");
    const mk = (name, s, kind = "page", sections = [sec("text", { markdown: `Texte ${name}` }), sec("hero", { title: `Titre ${name}`, subtitle: "", image: "", imageAlt: "", buttonLabel: "", buttonUrl: "" })]) =>
      Number(db.prepare("INSERT INTO mk_landing_pages (organization_id, name, slug, title, sections, status, kind, site_id, published_at) VALUES (?, ?, ?, ?, ?, 'published', ?, ?, datetime('now'))").run(orgId, name, name.toLowerCase().replace(/\W+/g, "-"), name, JSON.stringify(sections), kind, s).lastInsertRowid);
    pageA1 = mk("Page A1", A); pageA2 = mk("Page A2", A, "page", [sec("text", { markdown: "Seule section" })]); pageB = mk("Page B", B); pageStep = mk("Étape A", A, "step");
  });
  after(() => { db.close(); return srv.stop(); });

  describe("bibliothèque", () => {
    test("site A : patterns intégrés (catalogue réel), aucune composition au départ, seulement les pages de CE site (ni étapes de tunnel), droits réels", async () => {
      const r = await boss.get(`${PT}?site=${A}`);
      assert.equal(r.status, 200);
      for (const f of ["data-pt-root", "data-pt-grid", "data-pt-search", "Patterns", 'id="pt-data"']) assert.ok(r.text.includes(f), f);
      const b = bootOf(r.text);
      assert.equal(b.siteId, A); assert.equal(b.principal, false);
      assert.ok(b.builtin.length >= 20, `intégrés : ${b.builtin.length}`);
      assert.ok(b.builtin.every((p) => p.ref.startsWith("builtin:") && p.sections >= 1 && p.elements >= 1 && p.category && p.label));
      assert.deepEqual(b.mine, []); assert.deepEqual(b.trash, []);
      assert.deepEqual(b.pages.map((p) => p.name).sort(), ["Page A1", "Page A2"], "pages du site A seulement, sans étape de tunnel ni page de B");
      assert.equal(b.pages.find((p) => p.name === "Page A1").sections.length, 2);
      assert.equal(b.can.manage, true); assert.equal(b.can.insert, true);
      assert.match(r.text, /cms-patterns\.js/);
    });
    test("l'entrée « Patterns » n'est plus « BIENTÔT » : ouverte dans le cadre du site et du principal", async () => {
      const r = await boss.get(`/marketing/site-web/sites/${A}/patterns`);
      assert.equal(r.status, 200); assert.ok(r.text.includes("data-pt-root"));
      assert.doesNotMatch(r.text.replace(/\s+/g, " "), /Patterns<\/span>\s*<span[^>]*>Bientôt/i);
      assert.match((await boss.get("/marketing/site-web/apparence")).text, /href="\/marketing\/site-web\/patterns"/);
      assert.equal(bootOf((await boss.get(PT)).text).principal, true);
    });
    test("aperçu réel : le pattern est rendu avec les STYLES DU SITE (couleur de A), sans rien enregistrer ; référence inconnue ou d'un autre site : introuvable", async () => {
      const before = all("SELECT id FROM mk_landing_pages").length;
      const r = await boss.get(`${PT}/apercu?ref=builtin:hero&site=${A}`);
      assert.equal(r.status, 200); assert.match(r.text, /Le résultat que vous promettez/); assert.match(r.text, /--kw-primary:#8a1c3a/, "styles du site A");
      assert.equal(all("SELECT id FROM mk_landing_pages").length, before, "aucune page créée");
      const rb = await boss.get(`${PT}/apercu?ref=builtin:hero&site=${B}`); assert.doesNotMatch(rb.text, /#8a1c3a/, "B n'a pas les styles de A");
      for (const ref of ["builtin:inconnu", "mine:99999", "bidon", "mine:1; DROP"]) assert.equal((await boss.get(`${PT}/apercu?ref=${encodeURIComponent(ref)}&site=${A}`)).status, 404, ref);
    });
  });

  describe("insertion dans une page", () => {
    test("à la fin, au début, après une section : sections NATIVES ajoutées au brouillon (ordre exact) ; la version en ligne et les autres pages ne bougent pas", async () => {
      const pubBefore = page(pageA1).pubSections.length, revBefore = page(pageA1).revision, otherBefore = JSON.stringify(page(pageA2));
      const r1 = json(await post(adminA, "inserer", A, { ref: "builtin:cta", pageId: pageA1, position: "end" }));
      assert.equal(r1.ok, true, JSON.stringify(r1)); assert.equal(r1.inserted.added, 1); assert.equal(r1.inserted.at, 2);
      let p = page(pageA1);
      assert.equal(p.draftSections.length, 3); assert.ok(p.revision > revBefore); assert.equal(p.pubSections.length, pubBefore, "version en ligne intacte (rien n'est publié)");
      assert.equal(p.draftSections[2].type, "layout", "section native du Page Builder"); assert.ok(p.draftSections[2].id, "nouvel identifiant");
      assert.equal(p.draftSections[0].type, "text"); assert.equal(p.draftSections[1].type, "hero");
      const r2 = json(await post(adminA, "inserer", A, { ref: "builtin:faq", pageId: pageA1, position: "start" }));
      assert.equal(r2.inserted.at, 0); p = page(pageA1); assert.equal(p.draftSections.length, 4); assert.equal(p.draftSections[0].type, "layout"); assert.equal(p.draftSections[1].type, "text");
      const r3 = json(await post(adminA, "inserer", A, { ref: "builtin:stats", pageId: pageA1, position: "after", after: 1 }));
      assert.equal(r3.inserted.at, 2); p = page(pageA1); assert.equal(p.draftSections.length, 5); assert.equal(p.draftSections[1].type, "text"); assert.equal(p.draftSections[2].type, "layout"); assert.equal(p.draftSections[3].type, "hero");
      const ids = p.draftSections.map((s) => s.id); assert.equal(new Set(ids).size, ids.length, "identifiants uniques");
      assert.equal(JSON.stringify(page(pageA2)), otherBefore, "l'autre page est intacte");
      assert.ok(one("SELECT id FROM mk_audit_logs WHERE action = 'pattern.inserted' ORDER BY id DESC LIMIT 1"), "insertion journalisée");
      db.prepare("UPDATE mk_landing_pages SET draft = NULL WHERE id = ?").run(pageA1);
    });
    test("insérer deux fois ajoute deux fois (aucun lien caché avec l'original) ; les sections insérées sont revalidées et modifiables par l'éditeur (la page s'ouvre)", async () => {
      await post(adminA, "inserer", A, { ref: "builtin:features", pageId: pageA2, position: "end" }); await post(adminA, "inserer", A, { ref: "builtin:features", pageId: pageA2, position: "end" });
      const p = page(pageA2); assert.equal(p.draftSections.length, 3);
      assert.notEqual(p.draftSections[1].id, p.draftSections[2].id);
      const ed = await adminA.get(`/marketing/pages/${pageA2}/editeur`); assert.equal(ed.status, 200);
      assert.match((await adminA.get(`/marketing/pages/${pageA2}/apercu`)).text, /Pourquoi nous choisir|Avantage 1/, "le rendu de la page montre le pattern inséré");
    });
    test("erreurs : emplacement inconnu, section de repère inexistante, page d'un autre site, étape de tunnel, page archivée, référence invalide, page pleine — rien n'est écrit", async () => {
      const snapshot = () => JSON.stringify(all("SELECT id, revision, draft FROM mk_landing_pages ORDER BY id"));
      const before = snapshot();
      for (const [body, msg] of [[{ ref: "builtin:cta", pageId: pageA1, position: "milieu" }, /Position inconnue/], [{ ref: "builtin:cta", pageId: pageA1, position: "after", after: 99 }, /repère introuvable/], [{ ref: "builtin:cta", pageId: pageB, position: "end" }, /Page introuvable pour ce site/],
        [{ ref: "builtin:cta", pageId: pageStep, position: "end" }, /Page introuvable pour ce site/], [{ ref: "builtin:zzz", pageId: pageA1, position: "end" }, /Pattern inconnu/], [{ ref: "mine:99999", pageId: pageA1, position: "end" }, /introuvable pour ce site/], [{ ref: "mine:1; DROP TABLE x", pageId: pageA1 }, /Pattern (inconnu|introuvable)/]]) {
        const r = await post(adminA, "inserer", A, body); assert.equal(r.status, 422, JSON.stringify(body)); assert.match(json(r).error, msg);
      }
      assert.equal(snapshot(), before, "aucune écriture");
      const arch = Number(db.prepare("INSERT INTO mk_landing_pages (organization_id, name, slug, title, sections, status, kind, site_id, archived_at) VALUES (?, 'Archivée', 'archivee', 'Archivée', '[]', 'draft', 'page', ?, datetime('now'))").run(orgId, A).lastInsertRowid);
      assert.equal((await post(adminA, "inserer", A, { ref: "builtin:cta", pageId: arch, position: "end" })).status, 422);
      const full = Number(db.prepare("INSERT INTO mk_landing_pages (organization_id, name, slug, title, sections, status, kind, site_id) VALUES (?, 'Pleine', 'pleine', 'Pleine', ?, 'draft', 'page', ?)").run(orgId, JSON.stringify(Array.from({ length: 40 }, (_, i) => sec("text", { markdown: `s${i}` }))), A).lastInsertRowid);
      const rf = await post(adminA, "inserer", A, { ref: "builtin:cta", pageId: full, position: "end" }); assert.equal(rf.status, 422); assert.match(json(rf).error, /au plus/);
    });
  });

  describe("compositions du site", () => {
    let mineId;
    test("enregistrer des sections d'une page : copie indépendante, privée au site A ; la page source ne change pas ; erreurs claires", async () => {
      const src = JSON.stringify(page(pageA1));
      const r = json(await post(adminA, "creer", A, { pageId: pageA1, sections: [0, 1], name: "Mon bloc d'accueil", description: "Texte + bandeau" }));
      assert.equal(r.ok, true, JSON.stringify(r)); mineId = r.created;
      const row = one("SELECT * FROM appearance_patterns WHERE id = ?", mineId);
      assert.equal(row.site_id, A); assert.equal(JSON.parse(row.sections).length, 2); assert.equal(row.source_page_id, pageA1);
      assert.ok(JSON.parse(row.sections).every((s) => !("id" in s)), "identifiants retirés (copie indépendante)");
      assert.equal(JSON.stringify(page(pageA1)), src, "la page source est intacte");
      assert.equal(r.mine.length, 1); assert.equal(r.mine[0].label, "Mon bloc d'accueil"); assert.equal(r.mine[0].sections, 2);
      for (const [body, msg] of [[{ pageId: pageA1, sections: [], name: "Vide" }, /au moins une section/], [{ pageId: pageA1, sections: [0], name: "mon BLOC d'accueil" }, /existe déjà/], [{ pageId: pageA1, sections: [0], name: "" }, /nom/i],
        [{ pageId: pageA1, sections: [9], name: "Hors page" }, /introuvable/], [{ pageId: pageB, sections: [0], name: "Page de B" }, /Page introuvable pour ce site/], [{ pageId: pageA1, sections: Array.from({ length: 13 }, (_, i) => i), name: "Trop" }, /au plus/]]) {
        const x = await post(adminA, "creer", A, body); assert.equal(x.status, 422, JSON.stringify(body)); assert.match(json(x).error, msg);
      }
    });
    test("réutiliser la composition dans une autre page du site ; elle apparaît aussi dans le Page Builder (onglet Blocs) de CE site seulement", async () => {
      const r = json(await post(adminA, "inserer", A, { ref: `mine:${mineId}`, pageId: pageA2, position: "start" }));
      assert.equal(r.ok, true); assert.equal(r.inserted.added, 2);
      const p = page(pageA2); assert.equal(p.draftSections[0].type, "text"); assert.equal(p.draftSections[1].type, "hero");
      const ed = (await adminA.get(`/marketing/pages/${pageA2}/editeur`)).text; assert.ok(ed.includes(`user-${mineId}`), "proposé par le Page Builder du site A");
    });
    test("renommer, dupliquer, mettre à la corbeille, restaurer, supprimer définitivement (seulement depuis la corbeille)", async () => {
      assert.equal(json(await post(adminA, "renommer", A, { id: mineId, name: "Bloc d'accueil v2", description: "Nouvelle description" })).ok, true);
      assert.equal(one("SELECT name FROM appearance_patterns WHERE id = ?", mineId).name, "Bloc d'accueil v2");
      const d = json(await post(adminA, "dupliquer", A, { id: mineId })); assert.equal(d.ok, true);
      assert.equal(one("SELECT name FROM appearance_patterns WHERE id = ?", d.created).name, "Bloc d'accueil v2 (copie)");
      assert.equal(JSON.parse(one("SELECT sections FROM appearance_patterns WHERE id = ?", d.created).sections).length, 2);
      const t = json(await post(adminA, "supprimer", A, { id: d.created })); assert.equal(t.ok, true);
      assert.equal(t.mine.length, 1); assert.equal(t.trash.length, 1);
      assert.equal((await post(adminA, "purger", A, { id: mineId })).status, 422, "on ne purge pas un pattern actif");
      const rs = json(await post(adminA, "restaurer", A, { id: d.created })); assert.equal(rs.mine.length, 2); assert.equal(rs.trash.length, 0);
      await post(adminA, "supprimer", A, { id: d.created });
      assert.equal(json(await post(adminA, "purger", A, { id: d.created })).ok, true);
      assert.equal(one("SELECT id FROM appearance_patterns WHERE id = ?", d.created), undefined);
      assert.ok(page(pageA2).draftSections.length >= 5, "les pages qui l'ont inséré ne changent pas");
    });
  });

  describe("permissions et isolation", () => {
    test("lecteur : bibliothèque et aperçu visibles, AUCUNE écriture (le serveur refuse) ; éditeur : selon ses droits réels ; administrateur : tout", async () => {
      const v = bootOf((await viewerA.get(`${PT}?site=${A}`)).text); assert.equal(v.can.manage, false); assert.equal(v.can.insert, false);
      assert.equal((await viewerA.get(`${PT}/apercu?ref=builtin:hero&site=${A}`)).status, 200);
      const before = JSON.stringify(all("SELECT id, revision, draft FROM mk_landing_pages ORDER BY id")), patBefore = all("SELECT id FROM appearance_patterns").length;
      for (const [path, body] of [["inserer", { ref: "builtin:cta", pageId: pageA1, position: "end" }], ["creer", { pageId: pageA1, sections: [0], name: "Pirate" }], ["renommer", { id: 1, name: "x" }], ["dupliquer", { id: 1 }], ["supprimer", { id: 1 }], ["restaurer", { id: 1 }], ["purger", { id: 1 }]]) assert.equal((await post(viewerA, path, A, body)).status, 403, path);
      assert.equal(JSON.stringify(all("SELECT id, revision, draft FROM mk_landing_pages ORDER BY id")), before); assert.equal(all("SELECT id FROM appearance_patterns").length, patBefore);
      const perms = access.permissionsOf("editor"), e = bootOf((await editorA.get(`${PT}?site=${A}`)).text);
      assert.equal(e.can.manage, perms.has("appearance.patterns")); assert.equal(e.can.insert, perms.has("forms.write"));
      assert.equal((await post(editorA, "creer", A, { pageId: pageA1, sections: [0], name: "Par éditeur" })).status === 200, perms.has("appearance.patterns"));
      db.prepare("DELETE FROM appearance_patterns WHERE name = 'Par éditeur'").run();
    });
    test("un accès limité au site A ne voit ni ne modifie B ni le principal ; une composition de B est introuvable pour A, même appelée par son identifiant", async () => {
      const bp = Number(db.prepare("INSERT INTO appearance_patterns (site_id, name, sections) VALUES (?, 'Secret de B', ?)").run(B, JSON.stringify([sec("text", { markdown: "Contenu secret de B" })])).lastInsertRowid);
      const mp = Number(db.prepare("INSERT INTO appearance_patterns (site_id, name, sections) VALUES (NULL, 'Principal', ?)").run(JSON.stringify([sec("text", { markdown: "Contenu du principal" })])).lastInsertRowid);
      const a = bootOf((await adminA.get(`${PT}?site=${A}`)).text);
      assert.ok(!JSON.stringify(a).includes("Secret de B") && !JSON.stringify(a).includes("Principal"), "ni B ni le principal dans la bibliothèque de A");
      for (const [path, body] of [["inserer", { ref: `mine:${bp}`, pageId: pageA1, position: "end" }], ["renommer", { id: bp, name: "Volé" }], ["dupliquer", { id: bp }], ["supprimer", { id: bp }], ["inserer", { ref: `mine:${mp}`, pageId: pageA1, position: "end" }]]) {
        const r = await post(adminA, path, A, body); assert.equal(r.status, 422, `${path} ${JSON.stringify(body)}`);
      }
      assert.equal((await boss.get(`${PT}/apercu?ref=mine:${bp}&site=${A}`)).status, 404, "aperçu : B introuvable depuis A");
      assert.equal(one("SELECT name FROM appearance_patterns WHERE id = ?", bp).name, "Secret de B"); assert.equal(one("SELECT deleted_at FROM appearance_patterns WHERE id = ?", bp).deleted_at, null);
      for (const site of [B, null]) { const g = await adminA.get(`${PT}${q(site)}`); assert.ok([302, 403, 404].includes(g.status), `GET ${site}`); assert.doesNotMatch(g.text, /id="pt-data"/); }
      for (const f of [await adminA.postJson(`${PT}/inserer?site=${B}`, { site: String(B), ref: "builtin:cta", pageId: pageB, position: "end" }), await adminA.postJson(`${PT}/inserer?site=${A}`, { site: String(B), ref: "builtin:cta", pageId: pageB, position: "end" })]) assert.ok([403, 404, 422].includes(f.status), `forgé → ${f.status}`);
      assert.equal(page(pageB).draftSections, null, "la page de B n'a jamais été touchée");
      const asB = bootOf((await boss.get(`${PT}?site=${B}`)).text); assert.deepEqual(asB.mine.map((p) => p.label), ["Secret de B"]); assert.deepEqual(asB.pages.map((p) => p.name), ["Page B"]);
      const asP = bootOf((await boss.get(PT)).text); assert.deepEqual(asP.mine.map((p) => p.label), ["Principal"]);
    });
    test("anonyme et simple membre : refusés ; site inconnu : 404", async () => {
      assert.notEqual((await new Client(srv.base).get(`${PT}?site=${A}`)).status, 200);
      assert.notEqual((await (await newStudent(srv)).get(`${PT}?site=${A}`)).status, 200);
      assert.equal((await boss.get(`${PT}?site=999999`)).status, 404);
    });
  });
});
