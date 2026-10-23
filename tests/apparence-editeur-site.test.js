// KOLAKISA CMS — Apparence → Éditeur du site : espace de travail PAR SITE autour du VRAI Page Builder, sur les vraies routes, la vraie base, de vrais comptes.
// Écran (pages du site, parties globales, menus, styles), éditeur affiché dans le cadre (?cadre=1), état des brouillons avec contrôles de publication, publication page par page,
// permissions côté serveur, isolation A / B / principal.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, loginInstructor, newStudent, Client } = require("./helpers");
const access = require("../src/services/cmsAccess");

describe("éditeur du site : espace de travail, brouillons, publication, permissions, isolation", () => {
  let srv, boss, db, orgId, A, B, adminA, editorA, viewerA, pHome, pDraft, pForm, pArchived, pStep, pB, headerId, footerId;
  const one = (sql, ...a) => db.prepare(sql).get(...a);
  const all = (sql, ...a) => db.prepare(sql).all(...a);
  const idOf = (c) => one("SELECT id FROM users WHERE email = ?", c.email).id;
  const SE = "/marketing/site-web/editeur-du-site";
  const q = (site) => (site ? `?site=${site}` : "");
  const person = async (siteId, role) => { const c = await newStudent(srv); db.prepare("INSERT INTO mk_site_members (site_id, user_id, role) VALUES (?, ?, ?)").run(siteId, idOf(c), role); return c; };
  const bootOf = (html) => JSON.parse(/<script type="application\/json" id="se-data">([\s\S]*?)<\/script>/.exec(html)[1].replace(/\\u003c/g, "<"));
  const json = (r) => { try { return JSON.parse(r.text); } catch { return null; } };
  const publish = (c, site, body) => c.postJson(`${SE}/publier${q(site)}`, { ...(site ? { site: String(site) } : {}), ...body });
  const row = (id) => one("SELECT * FROM mk_landing_pages WHERE id = ?", id);
  const txt = (m) => [{ type: "text", markdown: m }];

  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "", ALLOW_INDEXING: "1" });
    boss = await loginInstructor(srv); db = srv.db();
    orgId = one("SELECT id FROM mk_organizations").id;
    const site = (n) => Number(db.prepare("INSERT INTO mk_sites (organization_id, name, slug, tokens) VALUES (?, ?, ?, '{}')").run(orgId, n, n.toLowerCase()).lastInsertRowid);
    A = site("Alpha"); B = site("Beta");
    adminA = await person(A, "admin"); editorA = await person(A, "editor"); viewerA = await person(A, "viewer");
    const mk = (name, s, { kind = "page", sections = txt(name), published = true, draft = null, archived = false } = {}) =>
      Number(db.prepare("INSERT INTO mk_landing_pages (organization_id, name, slug, title, sections, draft, status, kind, site_id, published_at, archived_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)")
        .run(orgId, name, name.toLowerCase().replace(/\W+/g, "-"), name, JSON.stringify(sections), draft ? JSON.stringify(draft) : null, published ? "published" : "draft", kind, s, published ? "2026-01-01 00:00:00" : null, archived ? "2026-02-01 00:00:00" : null).lastInsertRowid);
    pHome = mk("Accueil A", A); pDraft = mk("Page avec brouillon", A, { draft: { sections: txt("Nouveau texte du brouillon"), title: "Page avec brouillon" } });
    pForm = mk("Page à formulaire", A, { draft: { sections: [{ type: "form", heading: "Inscription", intro: "" }], title: "Page à formulaire" } });
    pArchived = mk("Page archivée", A, { archived: true }); pStep = mk("Étape de tunnel", A, { kind: "step" }); pB = mk("Page de B", B, { draft: { sections: txt("Brouillon de B"), title: "Page de B" } });
    db.prepare("UPDATE mk_sites SET home_page_id = ? WHERE id = ?").run(pHome, A);
    const comp = (name) => Number(db.prepare("INSERT INTO mk_web_components (organization_id, site_id, name, section, kind) VALUES (?, ?, ?, ?, 'standard')").run(orgId, A, name, JSON.stringify({ type: "text", markdown: name })).lastInsertRowid);
    headerId = comp("En-tête de Alpha"); footerId = comp("Pied de Alpha");
    db.prepare("UPDATE mk_sites SET header_component_id = ?, footer_component_id = ? WHERE id = ?").run(headerId, footerId, A);
  });
  after(() => { db.close(); return srv.stop(); });

  describe("espace de travail", () => {
    test("site A : seulement SES pages éditables (ni archivées, ni étapes de tunnel, ni pages de B), page d'accueil, parties globales, droits réels", async () => {
      const r = await boss.get(`${SE}?site=${A}`);
      assert.equal(r.status, 200);
      for (const f of ["data-se-root", "data-se-frame", "data-se-tabs", "data-se-modes", 'id="se-data"', "Éditeur du site"]) assert.ok(r.text.includes(f), f);
      const b = bootOf(r.text);
      assert.equal(b.siteId, A); assert.deepEqual(b.pages.map((p) => p.name).sort(), ["Accueil A", "Page avec brouillon", "Page à formulaire"].sort());
      assert.equal(b.pages.find((p) => p.name === "Accueil A").home, true); assert.equal(b.pages.find((p) => p.name === "Page avec brouillon").hasDraft, true); assert.equal(b.pages.find((p) => p.name === "Accueil A").hasDraft, false);
      assert.equal(b.parts.header.name, "En-tête de Alpha"); assert.equal(b.parts.footer.name, "Pied de Alpha");
      assert.equal(b.can.edit, true); assert.equal(b.can.publish, true);
      assert.deepEqual(b.pending.map((p) => p.name).sort(), ["Page avec brouillon", "Page à formulaire"]);
      assert.ok(!JSON.stringify(b).includes("Page de B"));
      assert.match(r.text, /cms-site-editor\.js/);
    });
    test("l'entrée « Éditeur du site » est un vrai espace de travail : ouvert dans le cadre du site (plus l'ancre des réglages) et du principal", async () => {
      const r = await boss.get(`/marketing/site-web/sites/${A}/editeur-du-site`);
      assert.equal(r.status, 200); assert.ok(r.text.includes("data-se-root"));
      assert.match((await boss.get("/marketing/site-web/apparence/templates")).text, /href="\/marketing\/site-web\/editeur-du-site"/, "le menu pointe vers le nouvel espace");
      const p = bootOf((await boss.get(SE)).text); assert.equal(p.siteId, null); assert.deepEqual(p.parts, { header: null, footer: null }); assert.ok(!p.pages.some((x) => x.name === "Accueil A"));
    });
    test("l'éditeur s'ouvre dans le cadre (?cadre=1) : les boutons « Retour » de l'éditeur sont masqués ; sans le paramètre, l'éditeur est inchangé ; les composants aussi", async () => {
      const framed = await adminA.get(`/marketing/pages/${pDraft}/editeur?cadre=1`), plain = await adminA.get(`/marketing/pages/${pDraft}/editeur`);
      assert.equal(framed.status, 200); assert.equal(plain.status, 200);
      assert.match(framed.text, /<body class="pb-body pb-embedded">/); assert.match(plain.text, /<body class="pb-body">/);
      assert.ok(framed.text.includes("data-pb-save"), "c'est le vrai Page Builder (indicateur d'enregistrement automatique)");
      const comp = await adminA.get(`/marketing/site-web/composants/${headerId}/editeur?cadre=1`); assert.equal(comp.status, 200); assert.match(comp.text, /pb-embedded/);
      assert.equal((await adminA.get(`/marketing/pages/${pB}/editeur?cadre=1`)).status === 200, false, "la page d'un autre site ne s'ouvre pas");
    });
    test("état à jour (JSON) : même contenu que l'écran ; réservé aux comptes autorisés du site", async () => {
      const r = json(await adminA.get(`${SE}/etat?site=${A}`)); assert.equal(r.ok, true); assert.equal(r.pages.length, 3); assert.equal(r.pending.length, 2);
      assert.notEqual((await new Client(srv.base).get(`${SE}/etat?site=${A}`)).status, 200);
      assert.ok([302, 403, 404].includes((await adminA.get(`${SE}/etat?site=${B}`)).status));
    });
  });

  describe("brouillons et publication", () => {
    test("les contrôles de publication sont visibles AVANT de publier : une page à formulaire sans formulaire n'est pas « prête », avec la raison", async () => {
      const b = bootOf((await adminA.get(`${SE}?site=${A}`)).text);
      const ok = b.pending.find((p) => p.name === "Page avec brouillon"), bad = b.pending.find((p) => p.name === "Page à formulaire");
      assert.equal(ok.ready, true); assert.deepEqual(ok.errors, []); assert.equal(bad.ready, false); assert.match(bad.errors.join(" "), /formulaire/);
    });
    test("publier : la page prête passe en ligne (le brouillon devient la version publiée) ; la page bloquée est refusée avec sa raison, sans affecter les autres ; état mis à jour", async () => {
      const r = json(await publish(adminA, A, { pageIds: [pDraft, pForm] }));
      assert.equal(r.ok, true, JSON.stringify(r));
      assert.deepEqual(r.results.map((x) => [x.id, x.ok]), [[pDraft, true], [pForm, false]]);
      assert.match(r.results[1].error, /formulaire/);
      const p = row(pDraft); assert.equal(p.draft, null, "brouillon consommé"); assert.match(p.sections, /Nouveau texte du brouillon/); assert.equal(p.status, "published");
      assert.ok(row(pForm).draft, "la page bloquée garde son brouillon"); assert.equal(JSON.parse(row(pForm).sections)[0].markdown, "Page à formulaire", "version en ligne de la page bloquée intacte");
      assert.deepEqual(r.pending.map((x) => x.name), ["Page à formulaire"]);
      assert.ok(one("SELECT id FROM mk_audit_logs WHERE action = 'site_editor.published' ORDER BY id DESC LIMIT 1"), "publication journalisée");
      assert.match((await new Client(srv.base).get(`/p/${row(pDraft).slug}`)).text, /Nouveau texte du brouillon/, "la page publique montre le nouveau contenu");
    });
    test("entrées invalides ou d'un autre site : aucune page publiée ; liste vide, trop longue ou page inconnue refusées", async () => {
      const pbBefore = JSON.stringify(row(pB));
      for (const body of [{ pageIds: [] }, {}, { pageIds: "x" }, { pageIds: [pB] }, { pageIds: [pDraft, pB] }, { pageIds: [pArchived] }, { pageIds: [pStep] }, { pageIds: [999999] }, { pageIds: Array.from({ length: 51 }, (_, i) => i + 1) }]) {
        const r = await publish(adminA, A, body); assert.equal(r.status, 422, JSON.stringify(body).slice(0, 60));
      }
      assert.equal(JSON.stringify(row(pB)), pbBefore, "la page de B n'a jamais été touchée");
    });
  });

  describe("permissions et isolation", () => {
    test("lecteur : voit l'espace sans pouvoir publier (le serveur refuse) ; éditeur : selon ses droits réels ; anonyme et simple membre refusés", async () => {
      const v = bootOf((await viewerA.get(`${SE}?site=${A}`)).text); assert.equal(v.can.edit, false); assert.equal(v.can.publish, false);
      const before = JSON.stringify(row(pForm)); assert.equal((await publish(viewerA, A, { pageIds: [pForm] })).status, 403); assert.equal(JSON.stringify(row(pForm)), before);
      const perms = access.permissionsOf("editor"), e = bootOf((await editorA.get(`${SE}?site=${A}`)).text);
      assert.equal(e.can.publish, perms.has("pages.publish")); assert.equal(e.can.edit, perms.has("forms.write"));
      if (!perms.has("pages.publish")) assert.equal((await publish(editorA, A, { pageIds: [pForm] })).status, 403);
      assert.notEqual((await new Client(srv.base).get(`${SE}?site=${A}`)).status, 200);
      assert.notEqual((await (await newStudent(srv)).get(`${SE}?site=${A}`)).status, 200);
    });
    test("un accès limité au site A ne voit ni ne publie dans B ni dans le principal, même en forgeant ?site=, le corps ou l'adresse", async () => {
      for (const site of [B, null]) { const g = await adminA.get(`${SE}${q(site)}`); assert.ok([302, 403, 404].includes(g.status), `GET ${site}`); assert.doesNotMatch(g.text, /id="se-data"/); }
      const before = JSON.stringify(row(pB));
      for (const r of [await adminA.postJson(`${SE}/publier?site=${B}`, { site: String(B), pageIds: [pB] }), await adminA.postJson(`${SE}/publier?site=${A}`, { site: String(B), pageIds: [pB] }), await adminA.postJson(`${SE}/publier`, { pageIds: [pB] })]) assert.ok([403, 404, 422].includes(r.status), `forgé → ${r.status}`);
      assert.equal(JSON.stringify(row(pB)), before, "B intact");
      assert.equal((await boss.get(`${SE}?site=999999`)).status, 404);
    });
    test("équipe : publier dans B écrit dans B seulement ; le principal est son propre espace", async () => {
      const aBefore = JSON.stringify(all("SELECT id, draft, status FROM mk_landing_pages WHERE site_id = ? ORDER BY id", A));
      const r = json(await publish(boss, B, { pageIds: [pB] })); assert.equal(r.ok, true); assert.equal(r.results[0].ok, true); assert.equal(row(pB).draft, null);
      assert.equal(JSON.stringify(all("SELECT id, draft, status FROM mk_landing_pages WHERE site_id = ? ORDER BY id", A)), aBefore, "A intact");
      assert.equal((await publish(boss, null, { pageIds: [pHome] })).status, 422, "une page de A n'est pas une page du principal");
    });
  });
});
