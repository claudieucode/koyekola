// Programme 22.6 — parcours HTTP réel : écran et API /site-web/sites/:id/contenu-seo, droits, isolation entre sites, brouillons seulement, aucune donnée de trafic.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, loginInstructor, newStudent, Client } = require("./helpers");

describe("Contenu et qualité SEO (serveur réel)", () => {
  let srv, db, boss, A, B, editorA, adminB, readerA, ids = {};
  const one = (sql, ...a) => db.prepare(sql).get(...a);
  const idOf = (c) => one("SELECT id FROM users WHERE email = ?", c.email).id;
  const M = (site) => `/marketing/site-web/sites/${site}/modules`;
  const U = (site, p = "") => `/marketing/site-web/sites/${site}/contenu-seo${p}`;
  const api = (site, p = "") => U(site, `/api${p}`);
  const post = (c, path, body) => c.request(path, { method: "POST", json: body || {} });
  const json = (r) => JSON.parse(r.text);
  const long = (w, k) => Array.from({ length: k }, (_, i) => `${w} numéro ${i} aide les équipes à organiser le travail du quotidien avec méthode.`).join(" ");
  const sectionsOf = (name, extra) => [{ id: "sechero1", type: "hero", title: name, subtitle: "Un sous-titre clair." }, { id: "sectext1", type: "text", markdown: `${extra} ${long("Contenu", 3)}` }];
  function makePage(site, name, extra, status = "published") {
    const p = one("SELECT id FROM mk_landing_pages WHERE name = ?", name);
    const sections = JSON.stringify(sectionsOf(name, extra));
    db.prepare("UPDATE mk_landing_pages SET sections = ?, draft = NULL, status = ?, title = ?, description = '', seo = ? WHERE id = ?").run(sections, status, name, JSON.stringify({ focusKeyword: name }), p.id);
    return p.id;
  }
  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv); db = srv.db();
    const mk = async (name) => Number((await boss.post("/marketing/site-web/sites", { name })).location.match(/sites\/(\d+)/)[1]);
    A = await mk("Site Alpha"); B = await mk("Site Bravo");
    const member = async (site, role) => { const c = await newStudent(srv); db.prepare("INSERT INTO mk_site_members (site_id, user_id, role) VALUES (?, ?, ?)").run(site, idOf(c), role); return c; };
    editorA = await member(A, "editor"); adminB = await member(B, "admin");
    await boss.post("/marketing/site-web/utilisateurs/roles", { name: "Contacts seuls", description: "t", perm: ["contacts.read"] });
    readerA = await member(A, one("SELECT key FROM mk_roles WHERE name = 'Contacts seuls'").key);
    for (const [n, s] of [["Isolation des combles", A], ["Guide travaux", A], ["Page Bravo", B]]) await boss.post("/marketing/pages", { name: n, site_id: s, kind: "page" });
    ids.target = makePage(A, "Isolation des combles", "Un texte sur l'isolation.");
    ids.source = makePage(A, "Guide travaux", "Pour réduire vos factures, pensez à l'isolation des combles dès cet automne.");
    ids.bravo = makePage(B, "Page Bravo", "Texte de Bravo.");
  });
  after(async () => { db.close(); await srv.stop(); });

  test("écran : rendu avec onglets accessibles, script servi, aucun secret ; refus sans droit de lecture et sur un autre site", async () => {
    const r = await editorA.get(U(A)); assert.equal(r.status, 200);
    for (const t of ["Vue d'ensemble", "Maillage interne", "Mots-clés et sources"]) assert.ok(r.text.includes(t), t);
    assert.match(r.text, /role="tablist"/); assert.match(r.text, /ni des prévisions de classement/); assert.equal(/sk-ant|ENCRYPTION|secret/i.test(r.text), false);
    const js = await editorA.get(r.text.match(/src="([^"]*content-intel[^"]*\.js[^"]*)"/)[1]); assert.equal(js.status, 200);
    assert.equal((await readerA.get(U(A))).status, 403); assert.notEqual((await adminB.get(U(A))).status, 200); assert.notEqual((await adminB.get(api(A, "/tableau-de-bord"))).status, 200);
    assert.notEqual((await new Client(srv.base).get(U(A))).status, 200, "visiteur anonyme");
  });
  test("tableau de bord : pages du site seulement, aucune métrique de trafic ; autre site refusé", async () => {
    const d = json(await editorA.get(api(A, "/tableau-de-bord"))); assert.equal(d.ok, true); assert.equal(d.dashboard.pages.length, 2);
    assert.equal(d.dashboard.traffic.available, false); assert.equal(JSON.stringify(d).includes("Page Bravo"), false);
    assert.equal(json(await adminB.get(api(B, "/tableau-de-bord"))).dashboard.pages.length, 1);
    assert.equal(json(await boss.get(api(99999, "/tableau-de-bord"))).ok, false);
  });
  test("analyse d'une page : score évalué + problèmes avec priorité ; page d'un autre site = 404 ; cache au second appel", async () => {
    const e = json(await editorA.get(api(A, `/pages/${ids.source}`))); assert.equal(e.ok, true); assert.equal(e.evaluation.cached, true, "déjà analysée par le tableau de bord : aucune ré-analyse");
    assert.equal(e.evaluation.quality.criteria.length, 14); assert.match(e.evaluation.quality.disclaimer, /pas une prédiction/);
    assert.equal(json(await editorA.get(api(A, `/pages/${ids.source}`))).evaluation.cached, true);
    const x = await editorA.get(api(A, `/pages/${ids.bravo}`)); assert.equal(x.status, 404); assert.equal(json(x).code, "not_found");
    assert.equal((await readerA.get(api(A, `/pages/${ids.source}`))).status, 403);
  });
  test("réglages : faits et marché modifiables avec seo.edit seulement ; valeurs assainies ; propres à chaque site", async () => {
    assert.equal((await post(readerA, api(A, "/reglages/faits"), { facts: { city: "Lyon" } })).status, 403);
    const ok = json(await post(editorA, api(A, "/reglages/faits"), { facts: { city: "Lyon", phone: "<script>x</script>" } })); assert.equal(ok.ok, true); assert.equal(ok.facts.city, "Lyon");
    assert.equal((await post(editorA, api(A, "/reglages/marche"), { language: "fr", country: "CD" })).status, 200);
    assert.equal((await post(editorA, api(A, "/reglages/marche"), { language: "francais" })).status, 400);
    assert.equal(json(await adminB.get(api(B, "/reglages"))).facts.city, undefined); assert.equal(json(await editorA.get(api(A, "/reglages"))).market.country, "CD");
    assert.equal((await post(editorA, api(B, "/reglages/faits"), { facts: { x: "y" } })).status === 200, false, "écrire dans un autre site est refusé");
  });
  test("maillage : proposer, accepter dans le BROUILLON (page en ligne intacte), refuser, id d'un autre site refusé", async () => {
    const live = one("SELECT sections FROM mk_landing_pages WHERE id = ?", ids.source).sections;
    const pr = json(await post(editorA, api(A, "/liens/proposer"))); assert.equal(pr.ok, true);
    const p = pr.proposals.find((x) => x.pageId === ids.source && x.targetId === ids.target); assert.ok(p, JSON.stringify(pr.proposals));
    assert.equal((await post(adminB, api(B, `/liens/${p.id}/accepter`))).status, 404, "proposition d'un autre site");
    assert.equal((await post(readerA, api(A, `/liens/${p.id}/accepter`))).status, 403);
    const ok = json(await post(editorA, api(A, `/liens/${p.id}/accepter`))); assert.equal(ok.ok, true); assert.equal(ok.published, false);
    assert.equal(one("SELECT sections FROM mk_landing_pages WHERE id = ?", ids.source).sections, live, "rien en ligne");
    assert.match(one("SELECT draft FROM mk_landing_pages WHERE id = ?", ids.source).draft, /isolation-des-combles|isolation des combles\]\(/);
    assert.equal((await post(editorA, api(A, `/liens/${p.id}/accepter`))).status, 409);
    const an = json(await editorA.get(api(A, "/liens"))); assert.match(an.analysis.limits, /menus/);
  });
  test("mots-clés : une estimation de l'IA ne porte jamais de volume (422) ; données externes sans source refusées ; sources non connectées", async () => {
    const r1 = await post(editorA, api(A, "/mots-cles"), { keyword: "plombier lyon", provenance: "ai_estimate", metrics: { volume: 900 } }); assert.equal(r1.status, 422); assert.equal(json(r1).code, "no_invented_metrics");
    assert.equal((await post(editorA, api(A, "/mots-cles"), { keyword: "plombier lyon", provenance: "external", metrics: { volume: 900 } })).status, 422);
    assert.equal((await post(editorA, api(A, "/mots-cles"), { keyword: "plombier lyon", provenance: "external", metrics: { volume: 900 }, source: "Outil X", sourceDate: "2026-10-01" })).status, 200);
    const l = json(await editorA.get(api(A, "/mots-cles"))); assert.equal(l.keywords.length, 1); assert.match(l.keywords[0].metricsNote, /Outil X/);
    assert.equal(json(await adminB.get(api(B, "/mots-cles"))).keywords.length, 0);
    const s = json(await editorA.get(api(A, "/sources"))); assert.equal(s.connectors.find((c) => c.id === "keyword_research").status.state, "not_implemented"); assert.ok(s.connectors.every((c) => c.paidCallsTriggered === false));
  });
  test("langues : relier deux pages du site, valider ; page d'un autre site refusée", async () => {
    const g = json(await post(editorA, api(A, "/langues"), { pageId: ids.target, lang: "fr", region: "FR" })); assert.equal(g.ok, true);
    assert.equal((await post(editorA, api(A, "/langues"), { pageId: ids.source, lang: "en", groupKey: g.groupKey })).status, 200);
    assert.equal((await post(editorA, api(A, "/langues"), { pageId: ids.bravo, lang: "es", groupKey: g.groupKey })).status, 404);
    assert.equal((await post(editorA, api(A, "/langues"), { pageId: ids.source, lang: "de" })).status, 409, "page déjà reliée");
    const l = json(await editorA.get(api(A, "/langues"))); assert.equal(l.groups[0].members.length, 2); assert.equal(l.groups[0].validation.ok, true);
    assert.equal(json(await adminB.get(api(B, "/langues"))).groups.length, 0);
  });
  test("optimisation : droit forms.write exigé ; action inconnue refusée ; actions listées (14)", async () => {
    assert.equal(json(await editorA.get(api(A, "/actions"))).actions.length, 14);
    assert.equal((await post(readerA, api(A, "/optimiser"), { action: "improve", pageId: ids.source })).status, 403);
    assert.equal((await post(editorA, api(A, "/optimiser"), { action: "inconnue", pageId: ids.source })).status, 400);
  });
  test("évaluer un texte d'article (éditeur du blog) : même évaluateur, rien n'est enregistré", async () => {
    const before = one("SELECT COUNT(*) AS c FROM mk_ci_evals").c;
    const r = json(await post(editorA, api(A, "/evaluer-texte"), { kind: "article", title: "Isoler ses combles", body: "## Pourquoi\n" + long("Isolation", 14), keyword: "isoler combles" }));
    assert.equal(r.ok, true); assert.equal(r.evaluation.kind, "article"); assert.equal(r.evaluation.quality.criteria.length, 14); assert.equal(one("SELECT COUNT(*) AS c FROM mk_ci_evals").c, before);
    assert.equal((await post(editorA, api(A, "/evaluer-texte"), { kind: "inconnu", body: "x" })).status, 400);
  });
  test("site archivé : aucune écriture (le calque d'accès de la plateforme ou la garde du service refuse), aucune erreur serveur", async () => {
    db.prepare("UPDATE mk_sites SET status = 'archived' WHERE id = ?").run(B);
    const rd = await adminB.get(api(B, "/tableau-de-bord")); assert.ok(rd.status < 500, `lecture : ${rd.status}`);
    const wr = await post(adminB, api(B, "/reglages/faits"), { facts: { a: "b" } }); assert.ok(wr.status >= 400 && wr.status < 500, `écriture : ${wr.status}`);
    db.prepare("UPDATE mk_sites SET status = 'active' WHERE id = ?").run(B);
    assert.equal(one("SELECT COUNT(*) AS c FROM mk_ci_settings WHERE site_id = ? AND key = 'facts'", B).c, 0, "rien n'a été écrit");
  });
});
