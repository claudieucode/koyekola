// KOLAKISA — espace de travail SEO de l'éditeur : disposition (enregistrée sur le compte), dispositions nommées, Mode Fun
// (isolé : ne peut écrire que sa propre progression), couche de données partagée (données réelles par partie).
const { describe, test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const http = require("node:http");
const crypto = require("node:crypto");
const { startServer, loginInstructor, newStudent } = require("./helpers");
const { analyze, scoreOf } = require("../src/utils/seoAnalyzer");

describe("Espace de travail SEO de l'éditeur", () => {
  let srv, prof, google, liveId, draftId;
  const calls = [];
  const q = (sql, ...a) => { const db = srv.db(); const r = db.prepare(sql).all(...a); db.close(); return r; };
  const json = (r) => JSON.parse(r.text);
  const put = (url, body) => prof.request(url, { method: "PUT", json: body });
  const form = (fields) => { const fd = new FormData(); for (const [k, v] of Object.entries(fields)) fd.append(k, v); return fd; };
  const save = (url, fields) => prof.request(url, { method: "POST", multipart: form({ content_format: "html", ...fields }), headers: { "x-blog-editor": "1" } });
  const { privateKey } = crypto.generateKeyPairSync("rsa", { modulusLength: 2048 });
  const SA = JSON.stringify({ type: "service_account", client_email: "seo@test.iam.gserviceaccount.com", private_key: privateKey.export({ type: "pkcs8", format: "pem" }) });

  before(async () => {
    google = http.createServer((req, res) => {
      let body = "";
      req.on("data", (d) => (body += d));
      req.on("end", () => {
        calls.push({ url: req.url, body });
        const send = (d) => { res.writeHead(200, { "content-type": "application/json" }); res.end(JSON.stringify(d)); };
        if (req.url === "/token") return send({ access_token: "t", expires_in: 3600 });
        const b = body ? JSON.parse(body) : {};
        if ((b.dimensions || [])[0] === "query") return send({ rows: [{ keys: ["formation excel"], clicks: 1, impressions: 120, ctr: 0.008, position: 11.2 }, { keys: ["excel débutant"], clicks: 9, impressions: 90, ctr: 0.1, position: 3 }] });
        return send({ rows: [{ clicks: 10, impressions: 210, ctr: 0.048, position: 7.1 }] });
      });
    });
    await new Promise((r) => google.listen(0, "127.0.0.1", r));
    const g = `http://127.0.0.1:${google.address().port}`;
    srv = await startServer({ ENCRYPTION_KEY: crypto.randomBytes(32).toString("hex"), SEO_GOOGLE_TOKEN_URL: `${g}/token`, SEO_GSC_URL: `${g}/gsc` });
    prof = await loginInstructor(srv);
    liveId = json(await save("/formateur/blog/nouveau", { title: "Excel pour débuter", slug: "excel-debuter", content: "<p>Trois mots seulement.</p>", status: "published" })).id;
    draftId = json(await save("/formateur/blog/nouveau", { title: "Brouillon", content: "<p>Texte.</p>", status: "draft" })).id;
  });
  after(async () => { await srv.stop(); google.close(); });

  test("moteur : note inchangée (même formule), mesures brutes et statistiques des mots-clés exposées", () => {
    const r = analyze({ title: "Excel facile", focusKeyword: "excel", secondaryKeywords: "tableur", html: "<h2>Excel</h2><p>Excel est un tableur.</p><img src=\"/a.png\" alt=\"\">" });
    assert.equal(r.score, Math.round((100 * (r.summary.good + r.summary.improve * 0.5)) / r.checks.length));
    assert.equal(scoreOf(r), r.score);
    assert.equal(r.stats.headings.h2, 1);
    assert.equal(r.stats.images.withoutAlt, 1);
    assert.deepEqual(r.keywordStats.map((k) => [k.phrase, k.kind, k.count]), [["excel", "principal", 2], ["tableur", "secondaire", 1]]);
  });

  test("disposition : par défaut absente, enregistrée nettoyée (clés inconnues, doublons, bornes), restituée dans l'éditeur", async () => {
    let page = (await prof.get(`/formateur/blog/${liveId}/modifier`)).text;
    assert.match(page, /"seoWorkspace":\{"layout":null,"fun":\{"enabled":false/);
    assert.equal((await put("/formateur/blog/api/espace-seo/disposition", { layout: "pas du json" })).status, 400);
    const r = await put("/formateur/blog/api/espace-seo/disposition", { layout: { right: { w: 99999, groups: [{ panels: ["score", "inconnu", "score"] }, { panels: ["reco"] }] }, left: { w: 300, groups: [{ panels: ["technical", "gsc"], active: "gsc" }] }, floats: [{ panels: ["images"], x: -50, y: 20, w: 50, h: 300 }], closed: ["external"] } });
    assert.equal(r.status, 200);
    const stored = JSON.parse(q("SELECT layout FROM seo_workspace_prefs")[0].layout);
    assert.deepEqual(stored.right.groups.map((g) => g.panels), [["score"], ["reco"]]);
    assert.equal(stored.right.w, 2000);
    assert.deepEqual(stored.left.groups[0], { panels: ["technical", "gsc"], active: "gsc" });
    assert.deepEqual([stored.floats[0].x, stored.floats[0].w], [0, 200]);
    assert.deepEqual(stored.closed, ["external"]);
    page = (await prof.get(`/formateur/blog/${liveId}/modifier`)).text;
    assert.match(page, /"left":\{"w":300,"groups":\[\{"panels":\["technical","gsc"\],"active":"gsc"\}\]\}/);
  });

  test("dispositions nommées : enregistrer, lire, supprimer ; nom validé", async () => {
    assert.equal((await prof.request("/formateur/blog/api/espace-seo/dispositions", { method: "POST", json: { name: "<script>", layout: { right: { groups: [] } } } })).status, 400);
    const r = json(await prof.request("/formateur/blog/api/espace-seo/dispositions", { method: "POST", json: { name: "Mon espace SEO", layout: { bottom: { h: 300, groups: [{ panels: ["seo-site"] }] } } } }));
    assert.deepEqual(r.saved.map((s) => s.name), ["Mon espace SEO"]);
    const l = json(await prof.get(`/formateur/blog/api/espace-seo/dispositions/${encodeURIComponent("Mon espace SEO")}`)).layout;
    assert.deepEqual(l.bottom, { h: 300, groups: [{ panels: ["seo-site"], active: "seo-site" }] });
    await prof.request(`/formateur/blog/api/espace-seo/dispositions/${encodeURIComponent("Mon espace SEO")}`, { method: "DELETE" });
    assert.equal((await prof.get(`/formateur/blog/api/espace-seo/dispositions/${encodeURIComponent("Mon espace SEO")}`)).status, 404);
  });

  test("Mode Fun : désactivé par défaut ; seules ses propres préférences sont écrites (aucune donnée SEO)", async () => {
    const before = q("SELECT title, seo_title, content FROM posts WHERE id = ?", liveId)[0];
    const r = json(await put("/formateur/blog/api/espace-seo/fun", { fun: { enabled: true, personality: "inconnue", xp: -5, badges: ["nettoyeur-seo", "faux-badge"], seo_title: "piratage", title: "x" } }));
    assert.deepEqual([r.fun.enabled, r.fun.personality, r.fun.xp, r.fun.badges], [true, "professionnel", 0, ["nettoyeur-seo"]]);
    assert.equal("seo_title" in r.fun, false);
    assert.deepEqual(q("SELECT title, seo_title, content FROM posts WHERE id = ?", liveId)[0], before);
    assert.equal(q("SELECT COUNT(*) n FROM seo_changes")[0].n, 0, "aucune modification SEO journalisée");
    const off = json(await put("/formateur/blog/api/espace-seo/fun", { fun: { enabled: false } }));
    assert.deepEqual([off.fun.enabled, off.fun.badges], [false, ["nettoyeur-seo"]], "la progression est conservée");
  });

  test("données : page en ligne réelle (statut, canonical, robots.txt, plan du site), brouillon expliqué", async () => {
    const d = json(await prof.get(`/formateur/blog/${liveId}/espace-seo?parties=page,psi,external,site`));
    assert.equal(d.page.live.status, 200);
    assert.match(d.page.live.canonical, /\/blog\/excel-debuter$/);
    assert.equal(d.page.robotsTxtAllowed, true);
    assert.equal(d.page.sitemap.included, true);
    assert.ok(d.page.live.schemaTypes.includes("BlogPosting"));
    assert.equal(d.psi.canRun, false);
    assert.match(d.psi.reason, /SITE_URL/);
    assert.deepEqual(d.external.map((x) => x.key), ["pagespeed", "search_console", "analytics"]);
    assert.equal(d.site.publishedPosts, 1);
    const dr = json(await prof.get(`/formateur/blog/${draftId}/espace-seo?parties=page,gsc`));
    assert.equal(dr.page.live, null);
    assert.match(dr.page.reason, /pas en ligne/);
    assert.equal(dr.gsc.label, "Non connecté");
    assert.equal(dr.gsc.data, null);
    assert.equal((await prof.request(`/formateur/blog/${liveId}/espace-seo/pagespeed`, { method: "POST", json: {} })).status, 409);
  });

  test("opportunités : uniquement détectées (audit, Search Console filtré sur la page), avec leur source", async () => {
    let o = json(await prof.get(`/formateur/blog/${liveId}/espace-seo?parties=opportunities`)).opportunities;
    assert.deepEqual(o.items, [], "aucun audit, rien de connecté : aucune opportunité inventée");
    await prof.post("/formateur/seo/audit", { kind: "full" });
    o = json(await prof.get(`/formateur/blog/${liveId}/espace-seo?parties=opportunities`)).opportunities;
    assert.ok(o.items.some((i) => i.source === "Audit du site" && /faible|court/i.test(`${i.title} ${i.evidence}`)), JSON.stringify(o.items));
    // Search Console connecté (faux Google) : rapport de CETTE page, opportunités sourcées
    await prof.post("/formateur/seo/integrations/search_console", { property: "sc-domain:kolakisa.test", service_account: SA });
    const g = json(await prof.get(`/formateur/blog/${liveId}/espace-seo?parties=gsc`)).gsc;
    assert.equal(g.state, "connected");
    assert.match(g.reason, /SITE_URL/, "sans adresse publique, aucune requête n'est inventée");
  });

  test("images du texte : fichier réellement vérifié ; élève refusé partout", async () => {
    const r = json(await prof.request("/formateur/blog/api/espace-seo/images", { method: "POST", json: { srcs: ["/uploads/thumbnails/absente.png", "https://exemple.com/a.png"] } }));
    assert.equal(r.images[0].exists, false);
    assert.equal(r.images[1].external, true);
    const student = await newStudent(srv);
    assert.notEqual((await student.get(`/formateur/blog/${liveId}/espace-seo?parties=page`)).status, 200);
    assert.notEqual((await student.request("/formateur/blog/api/espace-seo/fun", { method: "PUT", json: { fun: { enabled: true } } })).status, 200);
  });
});

describe("Espace de travail SEO : Search Console d'une page (adresse publique configurée)", () => {
  let srv, prof, google, id;
  const bodies = [];
  const { privateKey } = crypto.generateKeyPairSync("rsa", { modulusLength: 2048 });
  const SA = JSON.stringify({ type: "service_account", client_email: "seo@test.iam.gserviceaccount.com", private_key: privateKey.export({ type: "pkcs8", format: "pem" }) });
  before(async () => {
    google = http.createServer((req, res) => {
      let body = "";
      req.on("data", (d) => (body += d));
      req.on("end", () => {
        const send = (d) => { res.writeHead(200, { "content-type": "application/json" }); res.end(JSON.stringify(d)); };
        if (req.url === "/token") return send({ access_token: "t", expires_in: 3600 });
        const b = JSON.parse(body);
        bodies.push(b);
        if ((b.dimensions || [])[0] === "query") return send({ rows: [{ keys: ["formation excel"], clicks: 1, impressions: 120, ctr: 0.008, position: 11.2 }] });
        return send({ rows: [{ clicks: 10, impressions: 210, ctr: 0.048, position: 7.1 }] });
      });
    });
    await new Promise((r) => google.listen(0, "127.0.0.1", r));
    const g = `http://127.0.0.1:${google.address().port}`;
    srv = await startServer({ ENCRYPTION_KEY: crypto.randomBytes(32).toString("hex"), SITE_URL: "https://kolakisa.test", SEO_GOOGLE_TOKEN_URL: `${g}/token`, SEO_GSC_URL: `${g}/gsc` });
    prof = await loginInstructor(srv);
    const fd = new FormData();
    for (const [k, v] of Object.entries({ content_format: "html", title: "Excel", slug: "excel", content: "<p>Texte.</p>", status: "published" })) fd.append(k, v);
    id = JSON.parse((await prof.request("/formateur/blog/nouveau", { method: "POST", multipart: fd, headers: { "x-blog-editor": "1" } })).text).id;
    await prof.post("/formateur/seo/integrations/search_console", { property: "sc-domain:kolakisa.test", service_account: SA });
  });
  after(async () => { await srv.stop(); google.close(); });

  test("rapport filtré sur l'adresse de l'article ; opportunités Search Console avec leur source", async () => {
    const d = JSON.parse((await prof.get(`/formateur/blog/${id}/espace-seo?parties=gsc,opportunities`)).text);
    assert.equal(d.gsc.data.totals.current.clicks, 10);
    assert.equal(d.gsc.data.queries[0].query, "formation excel");
    assert.ok(bodies.some((b) => b.dimensionFilterGroups && b.dimensionFilterGroups[0].filters[0].expression === "https://kolakisa.test/blog/excel"));
    const titles = d.opportunities.items.filter((i) => i.source === "Google Search Console").map((i) => i.title);
    assert.ok(titles.some((t) => /Presque en première page : « formation excel »/.test(t)), titles.join(" | "));
    assert.ok(titles.some((t) => /Peu de clics pour « formation excel »/.test(t)));
  });
});
