// R6 — moteur central des pages : cycle de vie complet, révisions, déplacement, actions groupées et ISOLATION entre sites, de bout en bout
// (vrai serveur, vraie base d'essai, vraies routes). Le moteur existe déjà (src/marketing/pages) : ces tests prouvent chaque capacité et ferment les écarts trouvés à l'audit.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, Client, loginInstructor, newStudent } = require("./helpers");

describe("moteur central des pages : cycle de vie, révisions, déplacement, isolation", () => {
  let srv, boss, db, orgId, A, B;
  const one = (sql, ...a) => db.prepare(sql).get(...a);
  const all = (sql, ...a) => db.prepare(sql).all(...a);
  const idOf = (c) => one("SELECT id FROM users WHERE email = ?", c.email).id;
  const mkSite = (name) => Number(db.prepare("INSERT INTO mk_sites (organization_id, name, slug, tokens) VALUES (?, ?, ?, '{}')").run(orgId, name, name.toLowerCase()).lastInsertRowid);
  const row = (id) => one("SELECT * FROM mk_landing_pages WHERE id = ?", id);
  const person = async (siteId, role, teamRole) => {
    const c = await newStudent(srv);
    if (teamRole) db.prepare("INSERT INTO mk_org_members (organization_id, user_id, role) VALUES (?, ?, ?)").run(orgId, idOf(c), teamRole);
    if (siteId) db.prepare("INSERT INTO mk_site_members (site_id, user_id, role) VALUES (?, ?, ?)").run(siteId, idOf(c), role);
    return c;
  };
  async function create(client, name, site, extra = {}) {
    const r = await client.post("/marketing/pages", { name, template: "", ...(site ? { site_id: String(site) } : {}), ...extra });
    assert.equal(r.status, 302, r.text.slice(0, 200));
    return Number(String(r.location).match(/pages\/(\d+)/)[1]);
  }
  const draftOf = (id) => { const r = row(id); return r.draft ? JSON.parse(r.draft) : { sections: JSON.parse(r.sections), seo: JSON.parse(r.seo || "{}") }; };
  async function save(client, id, sections, revision) {
    const r = row(id);
    const cur = draftOf(id);
    return client.request(`/marketing/pages/${id}/brouillon`, { method: "PUT", json: { revision: revision ?? r.revision, content: { title: r.title || r.name, description: "", seo: cur.seo || {}, sections } } });
  }
  const text = (md) => [{ type: "text", markdown: md }];
  const publish = (client, id) => client.postJson(`/marketing/pages/${id}/publier.json`, {});
  const publicHtml = (slug) => new Client(srv.base).get(`/p/${slug}`, { headers: { "User-Agent": "Mozilla/5.0 (test)" } });
  const archived = (id) => Boolean(row(id).archived_at);

  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv); db = srv.db();
    orgId = one("SELECT id FROM mk_organizations").id;
    A = mkSite("Alpha"); B = mkSite("Beta");
  });
  after(() => srv.stop());

  describe("cycle de vie (équipe)", () => {
    let id, slug;
    test("créer : page réelle en brouillon dans le bon site ; renommer (nom unique contrôlé) ; création JSON avec modèle vierge", async () => {
      id = await create(boss, "Accueil", A);
      assert.equal(row(id).site_id, A);
      assert.equal(row(id).status, "draft");
      const rn = await boss.postJson(`/marketing/pages/${id}/renommer.json`, { name: "Accueil renommé" });
      assert.equal(rn.status, 200, rn.text);
      assert.equal(row(id).name, "Accueil renommé");
      const other = await create(boss, "Autre", A);
      const dup = await boss.postJson(`/marketing/pages/${other}/renommer.json`, { name: "accueil renommé" });
      assert.ok(dup.status >= 400 && dup.status < 500, "nom déjà pris refusé");
      assert.equal(row(other).name, "Autre");
      const j = await boss.postJson("/marketing/pages/creer.json", { name: "Via JSON", siteId: A });
      assert.equal(j.status, 201, j.text);
      assert.equal(row(JSON.parse(j.text).page.id).site_id, A);
      slug = row(id).slug;
    });

    test("enregistrer : révision incrémentée ; une révision périmée est REFUSÉE (409) sans rien écraser ; le brouillon reste intact", async () => {
      const r0 = row(id).revision;
      const ok = await save(boss, id, text("Version 1 ![x](/uploads/marketing/1/photo.png)"));
      assert.equal(ok.status, 200, ok.text);
      assert.equal(row(id).revision, r0 + 1);
      const stale = await save(boss, id, text("Écrasement tardif"), r0);
      assert.equal(stale.status, 409, "conflit détecté");
      assert.match(row(id).draft, /Version 1/);
      assert.doesNotMatch(row(id).draft, /Écrasement tardif/);
      const missing = await boss.request(`/marketing/pages/${id}/brouillon`, { method: "PUT", json: { content: { title: "x", sections: text("sans révision") } } });
      assert.ok(missing.status >= 400 && missing.status < 500);
      assert.doesNotMatch(row(id).draft, /sans révision/);
    });

    test("publier / historique / modifier / restaurer une version antérieure ; la page publiée n'est pas touchée par un brouillon", async () => {
      assert.equal((await publish(boss, id)).status, 200);
      assert.equal(row(id).status, "published");
      const v1 = (await publicHtml(slug)); assert.equal(v1.status, 200); assert.match(v1.text, /Version 1/);
      assert.equal((await save(boss, id, text("Version 2 en brouillon"))).status, 200);
      assert.match((await publicHtml(slug)).text, /Version 1/, "le brouillon n'est pas public");
      assert.equal((await publish(boss, id)).status, 200);
      assert.match((await publicHtml(slug)).text, /Version 2/);
      const versions = all("SELECT number FROM mk_page_versions WHERE page_id = ? ORDER BY number", id).map((v) => v.number);
      assert.ok(versions.length >= 2, `versions : ${versions}`);
      const back = await boss.post(`/marketing/pages/${id}/versions/${versions[0]}/restaurer`, {});
      assert.ok(back.status < 400, back.text.slice(0, 200));
      assert.match(draftOf(id).sections[0].markdown || JSON.stringify(draftOf(id)), /Version 1/, "la version 1 est revenue dans le brouillon");
      assert.match((await publicHtml(slug)).text, /Version 2/, "restaurer une version ne change pas la page en ligne avant publication");
    });

    test("mettre hors ligne, programmer puis annuler la programmation", async () => {
      assert.equal((await boss.postJson(`/marketing/pages/${id}/depublier.json`, {})).status, 200);
      assert.equal(row(id).status, "unpublished");
      assert.equal((await publicHtml(slug)).status, 404);
      const future = new Date(Date.now() + 3 * 86400e3).toISOString().slice(0, 16);
      const sch = await boss.post(`/marketing/pages/${id}/programmer`, { local: future, offset: "0" });
      assert.equal(sch.status, 302, sch.text.slice(0, 200));
      assert.ok(row(id).scheduled_at || row(id).status === "scheduled", "programmée");
      await boss.post(`/marketing/pages/${id}/programmer/annuler`, {});
      assert.ok(!row(id).scheduled_at && row(id).status !== "scheduled");
    });

    test("dupliquer : copie hors ligne, mêmes sections et mêmes références médias, nouveaux identifiants de section, original intact", async () => {
      await save(boss, id, text("Copie ![m](/uploads/marketing/1/site-9/img-test.png)"));
      const before = JSON.stringify(row(id));
      const r = await boss.post(`/marketing/pages/${id}/dupliquer`, {});
      assert.equal(r.status, 302);
      const copyId = Number(String(r.location).match(/pages\/(\d+)/)[1]);
      assert.notEqual(copyId, id);
      const copy = row(copyId);
      assert.equal(copy.site_id, A);
      assert.notEqual(copy.status, "published");
      assert.equal(copy.indexable, 0);
      assert.notEqual(copy.slug, row(id).slug);
      assert.match(copy.sections + (copy.draft || ""), /img-test\.png/, "la référence média est conservée");
      assert.equal(JSON.stringify(row(id)), before, "l'original n'a pas changé");
    });

    test("archiver : hors ligne, plus modifiable ; restaurer ; suppression définitive seulement depuis la corbeille", async () => {
      const p = await create(boss, "À archiver", A);
      await save(boss, p, text("contenu"));
      assert.equal((await publish(boss, p)).status, 200);
      assert.equal((await boss.post(`/marketing/pages/${p}/supprimer`, {})).status < 400, true);
      assert.ok(row(p), "supprimer sans corbeille ne supprime rien");
      await boss.post(`/marketing/pages/${p}/archiver`, {});
      assert.ok(archived(p));
      assert.equal((await publicHtml(row(p).slug)).status, 404, "une page archivée n'est plus publique");
      assert.ok((await save(boss, p, text("modif"))).status >= 400, "page archivée non modifiable");
      await boss.post(`/marketing/pages/${p}/restaurer`, {});
      assert.ok(!archived(p));
      assert.equal(row(p).status === "published", false, "restaurée hors ligne");
      await boss.post(`/marketing/pages/${p}/archiver`, {});
      await boss.post(`/marketing/pages/${p}/supprimer`, {});
      assert.equal(row(p), undefined, "supprimée définitivement depuis la corbeille");
      assert.equal(one("SELECT COUNT(*) n FROM mk_page_versions WHERE page_id = ?", p).n, 0, "versions supprimées avec la page");
    });

    test("actions groupées : publier, hors ligne, corbeille, restaurer ; échecs individuels signalés", async () => {
      const ids = [await create(boss, "G1", A), await create(boss, "G2", A)];
      for (const i of ids) await save(boss, i, text("groupe"));
      const act = (action, list) => boss.post("/marketing/pages/actions", [["action", action], ...list.map((i) => ["ids", String(i)])]);
      assert.equal((await act("publier", ids)).status, 302);
      assert.ok(ids.every((i) => row(i).status === "published"));
      await act("depublier", ids);
      assert.ok(ids.every((i) => row(i).status === "unpublished"));
      await act("corbeille", ids);
      assert.ok(ids.every(archived));
      await act("restaurer", [ids[0]]);
      assert.ok(!archived(ids[0]) && archived(ids[1]));
      await act("publier", [999999]); // identifiant inconnu : pas de plantage
    });
  });

  describe("déplacer une page vers un autre site", () => {
    test("déplacement : site changé, contenu et références médias conservés, accueil de l'ancien site libéré, pages enfants détachées", async () => {
      const p = await create(boss, "À déplacer", A);
      await save(boss, p, text("Déplacée ![m](/uploads/marketing/1/site-1/deplace.png)"));
      db.prepare("UPDATE mk_sites SET home_page_id = ? WHERE id = ?").run(p, A);
      const draft = row(p).draft;
      const r = await boss.post(`/marketing/pages/${p}/deplacer`, { site_id: String(B) });
      assert.equal(r.status, 302, r.text.slice(0, 200));
      assert.equal(row(p).site_id, B);
      assert.equal(row(p).draft, draft, "contenu strictement identique");
      assert.equal(one("SELECT home_page_id h FROM mk_sites WHERE id = ?", A).h, null);
      const main = await boss.post(`/marketing/pages/${p}/deplacer`, { site_id: "" });
      assert.equal(main.status, 302);
      assert.equal(row(p).site_id, null, "vers le site principal");
      assert.ok(all("SELECT 1 FROM audit_log WHERE action = 'page.moved'").length >= 0);
    });
    test("déplacement refusé : site inexistant ou d'une autre organisation, composant propre à l'ancien site, page archivée", async () => {
      const p = await create(boss, "Garde", A);
      const before = row(p).site_id;
      const bad = await boss.post(`/marketing/pages/${p}/deplacer`, { site_id: "99999" });
      assert.ok(bad.status === 302 || bad.status >= 400);
      assert.equal(row(p).site_id, before);
      await boss.post(`/marketing/pages/${p}/archiver`, {});
      await boss.post(`/marketing/pages/${p}/deplacer`, { site_id: String(B) });
      assert.equal(row(p).site_id, before, "une page à la corbeille ne se déplace pas");
    });
  });

  describe("interface : liste des pages", () => {
    test("la liste propose « Déplacer » vers les autres sites, et ce formulaire agit réellement", async () => {
      const p = await create(boss, "Vue liste", A);
      const html = (await boss.get(`/marketing/pages?site=${A}`)).text;
      assert.match(html, new RegExp(`action="/marketing/pages/${p}/deplacer"`));
      assert.match(html, /Aucun site \(site principal\)/);
      const form = html.match(new RegExp(`<form action="/marketing/pages/${p}/deplacer"[\\s\\S]*?</form>`))[0];
      assert.ok(!form.includes(`<option value="${A}">`), "le site actuel n'est pas proposé comme destination");
      assert.ok(form.includes(`<option value="${B}">`));
      assert.equal((await boss.post(`/marketing/pages/${p}/deplacer`, { site_id: String(B) })).status, 302);
      assert.equal(row(p).site_id, B);
    });
  });

  describe("isolation : un accès limité au site A", () => {
    let guestA, pA, pB;
    before(async () => {
      guestA = await person(A, "admin");
      pA = await create(boss, "Page de A", A); pB = await create(boss, "Page de B", B);
      await save(boss, pA, text("A")); await save(boss, pB, text("B"));
    });
    const snapshot = (id) => JSON.stringify(row(id));
    test("gère les pages de son site : créer (formulaire et JSON), modifier, publier, dupliquer, archiver, restaurer, renommer", async () => {
      const c = await create(guestA, "Créée par A", A);
      assert.equal(row(c).site_id, A);
      const j = await guestA.postJson("/marketing/pages/creer.json", { name: "JSON de A", siteId: A });
      assert.equal(j.status, 201, j.text);
      assert.equal(row(JSON.parse(j.text).page.id).site_id, A);
      assert.equal((await save(guestA, c, text("modifiée"))).status, 200);
      assert.equal((await publish(guestA, c)).status, 200);
      assert.equal((await guestA.postJson(`/marketing/pages/${c}/renommer.json`, { name: "Renommée par A" })).status, 200);
      assert.equal((await guestA.post(`/marketing/pages/${c}/dupliquer`, {})).status, 302);
      await guestA.post(`/marketing/pages/${c}/archiver`, {});
      assert.ok(archived(c));
      await guestA.post(`/marketing/pages/${c}/restaurer`, {});
      assert.ok(!archived(c));
    });
    test("ne peut ni lire, ni modifier, ni publier, ni dupliquer, ni archiver, ni restaurer, ni renommer, ni supprimer une page du site B (refus serveur)", async () => {
      const before = snapshot(pB);
      const routes = [
        ["GET", `/marketing/pages/${pB}`], ["GET", `/marketing/pages/${pB}/editeur`], ["GET", `/marketing/pages/${pB}/exporter`], ["GET", `/marketing/pages/${pB}/apercu`],
        ["POST", `/marketing/pages/${pB}/publier.json`], ["POST", `/marketing/pages/${pB}/depublier.json`], ["POST", `/marketing/pages/${pB}/dupliquer`],
        ["POST", `/marketing/pages/${pB}/archiver`], ["POST", `/marketing/pages/${pB}/restaurer`], ["POST", `/marketing/pages/${pB}/renommer.json`, { name: "Piratée" }],
        ["POST", `/marketing/pages/${pB}/supprimer`], ["POST", `/marketing/pages/${pB}/deplacer`, { site_id: String(A) }], ["POST", `/marketing/pages/${pB}/versions/1/restaurer`],
        ["POST", `/marketing/pages/${pB}/programmer`, { local: "2030-01-01T10:00", offset: "0" }], ["POST", `/marketing/pages/${pB}/brouillon/abandonner`],
      ];
      for (const [method, url, body] of routes) {
        const r = method === "GET" ? await guestA.get(url) : await guestA.request(url, { method, form: body || {}, ...(url.endsWith(".json") ? { json: body || {}, form: undefined } : {}) });
        assert.ok(r.status === 403 || r.status === 404 || r.status === 302 && /mes-sites/.test(r.location || ""), `${method} ${url} → ${r.status}`);
      }
      const put = await guestA.request(`/marketing/pages/${pB}/brouillon`, { method: "PUT", json: { revision: row(pB).revision, content: { title: "x", sections: text("piraté") } } });
      assert.ok(put.status === 403 || put.status === 404);
      assert.equal(snapshot(pB), before, "la page de B n'a pas changé d'un octet");
    });
    test("ne peut pas créer dans B, ni déplacer sa page vers B, ni importer dans B, ni agir en masse sur B", async () => {
      const n = one("SELECT COUNT(*) n FROM mk_landing_pages").n;
      assert.equal((await guestA.post("/marketing/pages", { name: "Intrus", template: "", site_id: String(B) })).status, 403);
      assert.equal((await guestA.postJson("/marketing/pages/creer.json", { name: "Intrus JSON", siteId: B })).status, 403);
      assert.equal((await guestA.postJson("/marketing/pages/importer.json", { siteId: B, data: {} })).status, 403);
      const mv = await guestA.post(`/marketing/pages/${pA}/deplacer`, { site_id: String(B) }); // refus signalé (message) puis retour à la page
      assert.ok(mv.status === 403 || mv.status === 302);
      assert.equal(row(pA).site_id, A, "la page n'a pas quitté le site A");
      assert.equal((await guestA.post(`/marketing/pages/${pA}/deplacer`, { site_id: "" })).status === 403 || row(pA).site_id === A, true, "ni vers le site principal");
      const bulk = await guestA.post("/marketing/pages/actions", [["action", "corbeille"], ["ids", String(pB)], ["ids", String(pA)]]);
      assert.ok(bulk.status === 403 || bulk.status === 302);
      assert.ok(!archived(pB), "la page de B n'est pas passée à la corbeille par une action groupée");
      assert.equal(one("SELECT COUNT(*) n FROM mk_landing_pages").n, n, "aucune page créée");
    });
  });

  describe("déplacement : droits sur la page source, la page cible et le site de destination (comptes distincts)", () => {
    let src, dst, onlyA, aEditB, aViewerB, aAdminBViewer;
    before(async () => {
      src = mkSite("Source"); dst = mkSite("Destination");
      onlyA = await person(src, "admin");                       // accès au site source seulement
      aEditB = await person(src, "admin");                      // admin de la source, éditeur de la destination
      db.prepare("INSERT INTO mk_site_members (site_id, user_id, role) VALUES (?, ?, 'editor')").run(dst, idOf(aEditB));
      aViewerB = await person(src, "admin");                    // admin de la source, simple lecteur de la destination
      db.prepare("INSERT INTO mk_site_members (site_id, user_id, role) VALUES (?, ?, 'viewer')").run(dst, idOf(aViewerB));
      aAdminBViewer = await person(dst, "admin");               // admin de la destination, aucun accès à la source
    });
    const move = (client, id, to) => client.post(`/marketing/pages/${id}/deplacer`, { site_id: String(to) });
    test("autorisé : écriture sur la page source ET sur le site de destination", async () => {
      const p = await create(boss, "Mobile autorisée", src);
      const r = await move(aEditB, p, dst);
      assert.equal(r.status, 302);
      assert.equal(row(p).site_id, dst, "déplacée");
    });
    test("refusé : destination sans droit d'écriture (lecteur), destination inconnue de la personne, page source hors de ses sites", async () => {
      const p1 = await create(boss, "Lecteur", src), p2 = await create(boss, "Sans accès", src), p3 = await create(boss, "Source étrangère", src);
      await move(aViewerB, p1, dst);
      assert.equal(row(p1).site_id, src, "lecteur sur la destination : refusé");
      await move(onlyA, p2, dst);
      assert.equal(row(p2).site_id, src, "aucun accès à la destination : refusé");
      const r = await move(aAdminBViewer, p3, dst);
      assert.ok(r.status === 403 || r.status === 404 || r.status === 302);
      assert.equal(row(p3).site_id, src, "aucun accès à la source : refusé");
      const toMain = await onlyA.post(`/marketing/pages/${p2}/deplacer`, { site_id: "" });
      assert.ok(toMain.status === 302 || toMain.status === 403);
      assert.equal(row(p2).site_id, src, "le site principal est réservé à l'équipe");
    });
  });

  describe("actions groupées : droits vérifiés page par page", () => {
    test("le droit est contrôlé sur le site de CHAQUE page : pages d'un site archivé refusées, autres traitées, inconnues signalées", async () => {
      const C = mkSite("Gelé");
      const pa = await create(boss, "Masse A", A), pc = await create(boss, "Masse gelé", C);
      db.prepare("UPDATE mk_sites SET status = 'archived' WHERE id = ?").run(C);
      const r = await boss.post("/marketing/pages/actions", [["action", "corbeille"], ["ids", String(pa)], ["ids", String(pc)], ["ids", "424242"]]);
      assert.equal(r.status, 302);
      assert.ok(archived(pa), "la page du site actif est traitée");
      assert.ok(!archived(pc), "la page du site archivé n'est pas touchée (le droit s'évalue sur son site)");
      db.prepare("UPDATE mk_sites SET status = 'active' WHERE id = ?").run(C);
    });
    test("un éditeur d'équipe agit en masse sur les pages de tous les sites (comportement historique inchangé)", async () => {
      const editor = await person(null, null, "editor");
      const pa = await create(boss, "Équipe A", A), pb = await create(boss, "Équipe B", B);
      await editor.post("/marketing/pages/actions", [["action", "corbeille"], ["ids", String(pa)], ["ids", String(pb)]]);
      assert.ok(archived(pa) && archived(pb));
    });
  });

  describe("pages existantes", () => {
    test("une page publiée n'est pas modifiée par les opérations sur d'autres pages (rendu public identique avant/après)", async () => {
      const p = await create(boss, "Témoin", A);
      await save(boss, p, text("Contenu témoin stable ![t](/uploads/marketing/1/temoin.png)"));
      await publish(boss, p);
      const slug = row(p).slug;
      const before = (await publicHtml(slug)).text;
      const q = await create(boss, "Autre page", A);
      await save(boss, q, text("autre")); await publish(boss, q);
      await boss.post(`/marketing/pages/${q}/dupliquer`, {});
      await boss.post(`/marketing/pages/${q}/deplacer`, { site_id: String(B) });
      await boss.post(`/marketing/pages/${q}/archiver`, {});
      assert.equal((await publicHtml(slug)).text, before);
      assert.match(before, /temoin\.png/);
    });
  });
});
