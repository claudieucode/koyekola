// R4 — visibilité des listes par site, de bout en bout : vrai serveur, vraie base d'essai, vraies routes (écrans de liste, exports).
//  1. Comportement historique PRÉSERVÉ (toujours exécuté) : une personne de l'équipe sans plafond voit tous les sites dans chaque liste, avec ou sans « ?site= » ;
//     un accès limité à un site ne voit que son site.
//  2. Plafond (exécuté seulement si la base connaît le plafond de droits de R3 : colonne mk_site_members.mode) : un membre plafonné dont le rôle sur le site B ne donne pas
//     la lecture ne voit AUCUN élément de B dans les listes, les statistiques ni les exports, et « ?site=B » ne contourne rien.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, loginInstructor, newStudent } = require("./helpers");

describe("visibilité des listes par site : bout en bout", () => {
  let srv, boss, db, orgId, A, B, HAS_CAP;
  const one = (sql, ...a) => db.prepare(sql).get(...a);
  const run = (sql, ...a) => Number(db.prepare(sql).run(...a).lastInsertRowid);
  const idOf = (c) => one("SELECT id FROM users WHERE email = ?", c.email).id;
  const U = "/marketing/site-web/utilisateurs";
  const LISTS = ["listes", "campagnes", "segments", "modeles", "automatisations", "tunnels", "pages"];
  const seen = (html) => ["A", "B", "M"].filter((k) => new RegExp(`ZZ[a-z]+-${k}\\b`).test(html)).join("") || "-";
  const screens = async (client, suffix = "") => Object.fromEntries(await Promise.all(LISTS.map(async (p) => [p, seen((await client.get(`/marketing/${p}${suffix}`)).text)])));

  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv); db = srv.db(); orgId = one("SELECT id FROM mk_organizations").id;
    HAS_CAP = one("SELECT COUNT(*) n FROM pragma_table_info('mk_site_members') WHERE name = 'mode'").n > 0;
    A = run("INSERT INTO mk_sites (organization_id, name, slug, tokens) VALUES (?, 'Alpha', 'alpha', '{}')", orgId);
    B = run("INSERT INTO mk_sites (organization_id, name, slug, tokens) VALUES (?, 'Beta', 'beta', '{}')", orgId);
    for (const [k, s] of [["A", A], ["B", B], ["M", null]]) {
      const l = run("INSERT INTO mk_lists (organization_id, name, site_id) VALUES (?, ?, ?)", orgId, `ZZliste-${k}`, s);
      run("INSERT INTO mk_segments (organization_id, name, definition, site_id) VALUES (?, ?, '{}', ?)", orgId, `ZZseg-${k}`, s);
      run("INSERT INTO mk_templates (organization_id, name, site_id) VALUES (?, ?, ?)", orgId, `ZZmod-${k}`, s);
      run("INSERT INTO mk_campaigns (organization_id, name, target_type, target_id, site_id, status, finished_at) VALUES (?, ?, 'list', ?, ?, 'sent', ?)", orgId, `ZZcamp-${k}`, l, s, Date.now());
      run("INSERT INTO mk_automations (organization_id, name, trigger_event, site_id) VALUES (?, ?, 'contact_created', ?)", orgId, `ZZauto-${k}`, s);
      run("INSERT INTO mk_funnels (organization_id, name, site_id) VALUES (?, ?, ?)", orgId, `ZZtun-${k}`, s);
      run("INSERT INTO mk_landing_pages (organization_id, name, slug, title, status, site_id) VALUES (?, ?, ?, ?, 'draft', ?)", orgId, `ZZpage-${k}`, `zz-page-${k}`, `ZZpage-${k}`, s);
    }
  });
  after(() => srv.stop());
  const team = async (role = "editor") => { const c = await newStudent(srv); db.prepare("INSERT INTO mk_org_members (organization_id, user_id, role) VALUES (?, ?, ?)").run(orgId, idOf(c), role); return c; };

  test("TÉMOIN : l'administrateur voit tous les sites dans chaque liste (comportement historique)", async () => {
    assert.deepEqual(await screens(boss), Object.fromEntries(LISTS.map((p) => [p, "ABM"])));
  });
  test("TÉMOIN : un éditeur d'équipe avec un accès de site (mode par défaut) voit tous les sites, avec ou sans « ?site= » (le filtre d'affichage fonctionne)", async () => {
    const editor = await team("editor");
    await boss.post(`${U}/${idOf(editor)}/sites`, { site_id: String(B), role: "viewer" });
    assert.deepEqual(await screens(editor), Object.fromEntries(LISTS.map((p) => [p, "ABM"])));
    const onlyA = await screens(editor, `?site=${A}`);
    for (const p of ["listes", "campagnes", "segments", "modeles", "automatisations", "tunnels"]) assert.equal(onlyA[p], "A", p);
  });
  test("TÉMOIN : un accès limité à un site (sans équipe) ne voit que son site dans l'espace de ce site", async () => {
    const limited = await newStudent(srv);
    await boss.post(`${U}/${idOf(limited)}/sites`, { site_id: String(A), role: "editor" });
    const html = (await limited.get(`/marketing/site-web/sites/${A}/listes`)).text;
    assert.equal(seen(html), "A");
  });

  describe("avec le plafond de droits (R3)", () => {
    let capped, plain;
    before(async () => {
      if (!HAS_CAP) return;
      capped = await team("editor"); plain = await team("editor");
      // « auteur » : aucune lecture des listes, campagnes, segments, modèles, automatisations ; plafond sur B
      await boss.post(`${U}/${idOf(capped)}/sites`, { site_id: String(B), role: "author" });
      db.prepare("UPDATE mk_site_members SET mode = 'limit' WHERE user_id = ? AND site_id = ?").run(idOf(capped), B);
      await boss.post(`${U}/${idOf(plain)}/sites`, { site_id: String(B), role: "author" }); // témoin : même rôle de site, sans plafond
    });
    const need = (t) => { if (!HAS_CAP) { t.skip("plafond de droits (R3) absent de cette base : vérifié lors de l'intégration de R3 et de R4"); return true; } return false; };

    const idsOfB = () => ({
      listes: one("SELECT id FROM mk_lists WHERE site_id = ?", B).id, campagnes: one("SELECT id FROM mk_campaigns WHERE site_id = ?", B).id, segments: one("SELECT id FROM mk_segments WHERE site_id = ?", B).id,
      modeles: one("SELECT id FROM mk_templates WHERE site_id = ?", B).id, automatisations: one("SELECT id FROM mk_automations WHERE site_id = ?", B).id,
      tunnels: one("SELECT id FROM mk_funnels WHERE site_id = ?", B).id, pages: one("SELECT id FROM mk_landing_pages WHERE site_id = ?", B).id,
    });
    test("listes sans site : aucun élément de B pour le membre plafonné dont le rôle de B ne donne pas la lecture ; le témoin sans plafond voit tout", async (t) => {
      if (need(t)) return;
      const c = await screens(capped), p = await screens(plain);
      for (const page of ["listes", "campagnes", "segments", "modeles", "automatisations"]) {
        assert.equal(c[page], "AM", `${page} : B doit être caché`);
        assert.equal(p[page], "ABM", `${page} : le témoin sans plafond garde le comportement historique`);
      }
    });
    test("INVARIANT : une liste montre les éléments de B si et seulement si la lecture de B par identifiant est permise (aucun écart entre liste et fiche)", async (t) => {
      if (need(t)) return;
      const c = await screens(capped);
      for (const [page, id] of Object.entries(idsOfB())) {
        const canRead = (await capped.get(`/marketing/${page}/${id}`)).status === 200;
        assert.equal(c[page].includes("B"), canRead, `${page} : liste ${c[page]}, lecture par identifiant ${canRead ? "permise" : "refusée"}`);
      }
    });
    test("« ?site=B » ne contourne rien : refus, ou liste vide de B", async (t) => {
      if (need(t)) return;
      for (const p of ["listes", "campagnes", "segments", "modeles", "automatisations"]) {
        const r = await capped.get(`/marketing/${p}?site=${B}`);
        assert.ok(r.status === 403 || seen(r.text) === "-", `${p}?site=B : statut ${r.status}, éléments ${seen(r.text)}`);
      }
      const a = await screens(capped, `?site=${A}`);
      assert.equal(a.listes, "A");
      assert.equal(await seen((await capped.get(`/marketing/listes?site=principal`)).text), "M");
    });
    test("statistiques et exports : l'agrégat de l'organisation et les exports excluent B", async (t) => {
      if (need(t)) return;
      const plainTun = (await plain.get("/marketing/analytics/global/export?section=tunnels")).text;
      const cappedTun = (await capped.get("/marketing/analytics/global/export?section=tunnels")).text;
      assert.match(plainTun, /ZZtun-B/, "témoin : l'export historique contient le tunnel de B");
      assert.doesNotMatch(cappedTun, /ZZtun-B/);
      const plainCmp = (await plain.get("/marketing/analytics/comparer/export.csv")).text;
      const cappedCmp = (await capped.get("/marketing/analytics/comparer/export.csv")).text;
      assert.match(plainCmp, /ZZcamp-B/, "témoin : la comparaison historique contient la campagne de B");
      assert.doesNotMatch(cappedCmp, /ZZcamp-B/);
    });
    test("le droit de lire un autre site n'est pas modifié : le membre plafonné voit toujours A et le site principal", async (t) => {
      if (need(t)) return;
      const c = await screens(capped);
      for (const page of ["listes", "campagnes"]) assert.match(c[page], /A/), assert.match(c[page], /M/);
    });
    test("retirer le plafond rend la visibilité historique", async (t) => {
      if (need(t)) return;
      db.prepare("UPDATE mk_site_members SET mode = 'add' WHERE user_id = ? AND site_id = ?").run(idOf(capped), B);
      assert.equal((await screens(capped)).listes, "ABM");
      db.prepare("UPDATE mk_site_members SET mode = 'limit' WHERE user_id = ? AND site_id = ?").run(idOf(capped), B);
      assert.equal((await screens(capped)).listes, "AM");
    });
  });
});
