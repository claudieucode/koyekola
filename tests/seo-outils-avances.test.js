// SEO Intelligence (lot avancé) : SEO local (horaires, GPS, établissements), type de page, export / import, import Rank Math / Yoast,
// liens internes, suivi de positionnement et connexions Google PAR SITE. HTTP réel, deux sites, droits réels, Google simulé localement.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const http = require("node:http");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, Client, loginInstructor, newStudent } = require("./helpers");
const local = require("../src/seo/local");

const jsonLd = (html) => [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => JSON.parse(m[1]));
const nodes = (html) => jsonLd(html).flatMap((d) => d["@graph"] || [d]);

describe("SEO local : lecture des horaires, coordonnées et établissements (unité)", () => {
  test("horaires : plages, listes de jours, ordre et formats refusés", () => {
    const ok = local.parseHours("Lun-Ven 09:00-18:00\nSam 10:00-13:00\nLun,Mer 19:00-21:00");
    assert.equal(ok.errors.length, 0);
    assert.deepEqual(ok.specs[0].dayOfWeek, ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]);
    assert.deepEqual([ok.specs[1].opens, ok.specs[1].closes], ["10:00", "13:00"]);
    assert.deepEqual(ok.specs[2].dayOfWeek, ["Monday", "Wednesday"]);
    for (const bad of ["Ven-Lun 09:00-18:00", "Lun 18:00-09:00", "Lun 25:00-26:00", "Fermé", "Lun 9h-18h", "Xyz 09:00-10:00"]) assert.ok(local.parseHours(bad).errors.length, bad);
  });
  test("coordonnées : les deux ou aucune, bornées", () => {
    assert.deepEqual(local.parseGeo("48,8566", "2.3522").geo, { "@type": "GeoCoordinates", latitude: 48.8566, longitude: 2.3522 });
    assert.equal(local.parseGeo("", "").geo, null);
    for (const [a, b] of [["48.8", ""], ["91", "2"], ["10", "181"], ["abc", "2"]]) assert.ok(local.parseGeo(a, b).errors.length, `${a}/${b}`);
  });
  test("établissements : champs obligatoires, pays à 2 lettres, téléphone, horaires", () => {
    const r = local.parseLocations("Atelier Lyon | 5 rue X | 69001 | Lyon | fr | +33 4 11 22 33 44 | Lun-Ven 09:00-17:00; Sam 10:00-12:00\nBoutique Nice | 1 quai Y | | Nice");
    assert.equal(r.errors.length, 0);
    assert.equal(r.locations.length, 2);
    assert.equal(r.locations[0].country, "FR");
    assert.equal(r.locations[0].specs.length, 2);
    for (const bad of ["Sans ville | rue | 75000 | ", "A | B | C | D | francais", "A | B | C | D | FR | tel-invalide", "A | B | C | D | FR | +33 1 23 45 67 89 | Lun 99:00-10:00"]) assert.ok(local.parseLocations(bad).errors.length, bad);
    assert.equal(local.parseLocations(Array.from({ length: 11 }, (_, i) => `L${i} | r | 1 | V`).join("\n")).errors.length, 1);
  });
});

describe("SEO avancé : isolation par site, droits, données réelles", () => {
  let srv, boss, db, A, B, adminA, viewerA, adminB, google, gscCalls;
  const SP = "/marketing/site-web/sites";
  const one = (sql, ...a) => db.prepare(sql).get(...a);
  const all = (sql, ...a) => db.prepare(sql).all(...a);
  const idOf = (c) => one("SELECT id FROM users WHERE email = ?", c.email).id;
  const mkSite = async (name) => Number(String((await boss.post(SP, { name })).location).match(/sites\/(\d+)/)[1]);
  const member = async (site, role) => { const c = await newStudent(srv); db.prepare("INSERT INTO mk_site_members (site_id, user_id, role) VALUES (?, ?, ?)").run(site, idOf(c), role); return c; };
  const org = () => one("SELECT id FROM mk_organizations").id;
  const mkPage = (site, slug, title, sections = [], seo = {}) => Number(db.prepare("INSERT INTO mk_landing_pages (organization_id, name, slug, title, status, site_id, published_at, indexable, sections, seo) VALUES (?, ?, ?, ?, 'published', ?, datetime('now'), 1, ?, ?)")
    .run(org(), title, slug, title, site, JSON.stringify(sections), JSON.stringify(seo)).lastInsertRowid);
  const serviceAccount = () => { const { privateKey } = crypto.generateKeyPairSync("rsa", { modulusLength: 2048 }); return JSON.stringify({ type: "service_account", client_email: "svc@projet.iam.gserviceaccount.com", private_key: privateKey.export({ type: "pkcs8", format: "pem" }) }); };

  before(async () => {
    // Google simulé : jeton + Search Console (requêtes), pour ne jamais joindre le vrai service
    gscCalls = [];
    google = http.createServer((req, res) => {
      let body = ""; req.on("data", (d) => (body += d)); req.on("end", () => {
        res.setHeader("Content-Type", "application/json");
        if (req.url.startsWith("/token")) return res.end(JSON.stringify({ access_token: "jeton-test", expires_in: 3600 }));
        const m = /\/sites\/([^/]+)\/searchAnalytics\/query/.exec(req.url);
        if (m) { gscCalls.push(decodeURIComponent(m[1])); return res.end(JSON.stringify({ rows: [{ keys: ["yoga doux"], clicks: 12, impressions: 340, ctr: 0.035, position: 7.4 }] })); }
        res.statusCode = 404; res.end("{}");
      });
    });
    await new Promise((r) => google.listen(0, "127.0.0.1", r));
    const g = `http://127.0.0.1:${google.address().port}`;
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "", ALLOW_INDEXING: "1", SEO_GOOGLE_TOKEN_URL: `${g}/token`, SEO_GSC_URL: g });
    boss = await loginInstructor(srv); db = srv.db();
    A = await mkSite("Alpha Avance"); B = await mkSite("Bravo Avance");
    adminA = await member(A, "admin"); viewerA = await member(A, "viewer"); adminB = await member(B, "admin");
  });
  after(() => { db.close(); google.close(); return srv.stop(); });

  test("SEO local : horaires, GPS et établissements publiés pour un LocalBusiness ; refus des formats invalides ; rien d'inventé sinon", async () => {
    const bad = await boss.post("/formateur/seo/reglages", { org_hours: "Lun 25:00-26:00" });
    assert.ok([200, 302, 400, 422].includes(bad.status));
    assert.equal(one("SELECT COUNT(*) n FROM seo_settings WHERE key = 'org_hours'").n, 0, "format invalide : rien n'est enregistré");
    await boss.post("/formateur/seo/reglages", { org_type: "LocalBusiness", org_street: "12 rue des Lilas", org_city: "Paris", org_hours: "Lun-Ven 09:00-18:00\nSam 10:00-13:00", org_lat: "48.8566", org_lng: "2.3522", org_locations: "Atelier Lyon | 5 rue X | 69001 | Lyon | FR | +33 4 11 22 33 44 | Lun-Ven 09:00-17:00" });
    const ns = nodes((await new Client(srv.base).get("/")).text);
    const o = ns.find((n) => n["@type"] === "LocalBusiness" && n["@id"].endsWith("/#organization"));
    assert.ok(o, "organisation LocalBusiness");
    assert.equal(o.openingHoursSpecification.length, 2);
    assert.deepEqual(o.geo, { "@type": "GeoCoordinates", latitude: 48.8566, longitude: 2.3522 });
    const loc = ns.find((n) => (n["@id"] || "").endsWith("/#location-1"));
    assert.equal(loc.name, "Atelier Lyon");
    assert.equal(loc.address.addressLocality, "Lyon");
    assert.deepEqual(loc.parentOrganization, { "@id": o["@id"] });
    // Hors LocalBusiness : ni horaires ni GPS sur l'organisation
    await boss.post("/formateur/seo/reglages", { org_type: "Organization" });
    const o2 = nodes((await new Client(srv.base).get("/")).text).find((n) => (n["@id"] || "").endsWith("/#organization"));
    assert.equal("openingHoursSpecification" in o2, false);
    assert.equal("geo" in o2, false);
  });

  test("type de page : seuls les sous-types de WebPage de la liste fermée sont acceptés ; le type choisi est repris par le graphe de la page", async () => {
    const { normalizeSeo } = require("../src/marketing/pages");
    assert.equal(normalizeSeo({ schemaType: "ContactPage" }).schemaType, "ContactPage");
    assert.equal(normalizeSeo({ schemaType: "Event" }).schemaType, undefined, "un type qui exige des données absentes n'est pas proposé");
    assert.equal(normalizeSeo({ schemaType: "WebPage" }).schemaType, undefined, "le type par défaut n'est pas stocké");
    const p = mkPage(A, "nous-contacter", "Nous contacter", [], { schemaType: "ContactPage" });
    assert.ok(p);
    const res = await new Client(srv.base).get("/p/nous-contacter");
    assert.equal(res.status, 200);
    const wp = nodes(res.text).find((n) => (n["@id"] || "").endsWith("#webpage"));
    assert.ok(wp, "nœud de page présent");
    assert.equal(wp["@type"], "ContactPage");
  });

  test("export : réglages et redirections du site, sans secret ni identifiant ; un autre site ne peut pas le lire", async () => {
    await adminA.post(`${SP}/${A}/seo/meta`, { site_name: "Alpha Marque", default_description: "Description alpha" });
    await adminA.post(`${SP}/${A}/redirections`, { source: "/vieux", target: "/nouveau", status: "301", match_type: "exact" });
    await adminA.post(`${SP}/${A}/redirections`, { source: "/section", target: "/rubrique", status: "301", match_type: "prefix" });
    const r = await adminA.get(`${SP}/${A}/seo/transfert/export.json`);
    assert.equal(r.status, 200);
    const j = JSON.parse(r.text);
    assert.equal(j.format, "kolakisa-seo");
    assert.equal(j.settings.site_name, "Alpha Marque");
    assert.deepEqual(j.redirects.map((x) => [x.source, x.match]).sort(), [["/section", "prefix"], ["/vieux", "exact"]]);
    assert.equal(/service_account|private_key|secret|api_key|site_id/i.test(r.text), false);
    assert.equal((await adminB.get(`${SP}/${A}/seo/transfert/export.json`)).status, 403);
    assert.equal((await new Client(srv.base).get(`${SP}/${A}/seo/transfert/export.json`)).status, 302);
  });

  test("import : aperçu sans écriture, puis application au SEUL site de l'appelant ; réglages globaux et fichier étranger refusés", async () => {
    const file = (await adminA.get(`${SP}/${A}/seo/transfert/export.json`)).text;
    const prev = await adminB.post(`${SP}/${B}/seo/transfert/import`, { json: file });
    assert.equal(prev.status, 200);
    assert.match(prev.text, /Aperçu/);
    assert.equal(one("SELECT COUNT(*) n FROM seo_site_settings WHERE site_id = ?", B).n, 0, "l'aperçu n'écrit rien");
    assert.equal(one("SELECT COUNT(*) n FROM seo_redirects WHERE site_id = ?", B).n, 0);
    await adminB.post(`${SP}/${B}/seo/transfert/import`, { json: file, apply: "1" });
    assert.equal(JSON.parse(one("SELECT value FROM seo_site_settings WHERE site_id = ? AND key = 'site_name'", B).value), "Alpha Marque");
    assert.deepEqual(all("SELECT source_path, match_type FROM seo_redirects WHERE site_id = ? ORDER BY source_path", B).map((r) => `${r.source_path}:${r.match_type}`), ["/section:prefix", "/vieux:exact"]);
    assert.equal(one("SELECT COUNT(*) n FROM seo_site_settings WHERE site_id = ?", A).n >= 2, true);
    // clé globale dans le fichier : ignorée ; fichier quelconque : refusé sans écrire
    const sneaky = JSON.stringify({ format: "kolakisa-seo", version: 1, settings: { robots_custom: "User-agent: *\nDisallow: /", home_title: "PIRATE" }, redirects: [] });
    const s = await adminB.post(`${SP}/${B}/seo/transfert/import`, { json: sneaky, apply: "1" });
    assert.equal(s.status, 200);
    assert.equal(one("SELECT COUNT(*) n FROM seo_settings WHERE key = 'home_title'").n, 0, "réglage global jamais modifié depuis un site");
    const junk = await adminB.post(`${SP}/${B}/seo/transfert/import`, { json: "{\"format\":\"autre\"}", apply: "1" });
    assert.match(junk.text, /pas un export de/);
    // droits : un lecteur ne peut pas importer
    assert.equal((await viewerA.post(`${SP}/${A}/seo/transfert/import`, { json: file, apply: "1" })).status, 403);
  });

  test("import Rank Math / Yoast : variables résolues, brouillon seulement, page d'un autre site intacte", async () => {
    const pa = mkPage(A, "tarifs", "Nos tarifs");
    const pb = mkPage(B, "tarifs-b", "Tarifs de B");
    const pc = mkPage(A, "tarifs-c", "Tarifs C");
    const table = "url,rank_math_title,rank_math_description,rank_math_focus_keyword\n/p/tarifs,%title% %sep% %sitename%,Tous les tarifs de la plateforme,tarifs yoga\n/p/inexistante,X,Y,Z\n/p/tarifs-b,Pirate,Pirate,pirate\n/p/tarifs-c,%inconnue%,,";
    const prev = await adminA.post(`${SP}/${A}/seo/transfert/wordpress`, { table });
    assert.match(prev.text, /Aperçu/);
    assert.equal(one("SELECT draft FROM mk_landing_pages WHERE id = ?", pa).draft, null, "aperçu : aucun brouillon");
    const applied = await adminA.post(`${SP}/${A}/seo/transfert/wordpress`, { table, apply: "1" });
    const draftRow = one("SELECT draft FROM mk_landing_pages WHERE id = ?", pa).draft;
    const draft = draftRow ? JSON.parse(draftRow) : null;
    assert.ok(draft, ((applied.text.match(/role="(?:status|alert)"[\s\S]{0,1500}/) || [""])[0]).replace(/<[^>]+>/g, " ").replace(/\s+/g, " "));
    assert.match(draft.seo.title, /^Nos tarifs .+ Alpha Marque$/);
    assert.equal(draft.seo.focusKeyword, "tarifs yoga");
    assert.equal(draft.seo.description, "Tous les tarifs de la plateforme");
    assert.equal(one("SELECT status FROM mk_landing_pages WHERE id = ?", pa).status, "published");
    assert.equal(one("SELECT draft FROM mk_landing_pages WHERE id = ?", pc).draft, null, "variable inconnue : champ écarté, rien d'écrit");
    assert.match(applied.text, /variable inconnue/);
    assert.equal(one("SELECT draft FROM mk_landing_pages WHERE id = ?", pb).draft, null, "la page du site B n'est pas touchée");
    // format Yoast, clé longue
    const yoast = "url,meta_key,meta_value\n/p/tarifs,_yoast_wpseo_metadesc,Description Yoast\n";
    const y = await adminA.post(`${SP}/${A}/seo/transfert/wordpress`, { table: yoast, apply: "1" });
    assert.equal(y.status, 200);
    assert.equal(JSON.parse(one("SELECT draft FROM mk_landing_pages WHERE id = ?", pa).draft).seo.description, "Description Yoast");
    assert.equal((await viewerA.post(`${SP}/${A}/seo/transfert/wordpress`, { table, apply: "1" })).status, 403);
  });

  test("liens internes : suggestions bornées au site, sans lien déjà présent ni page d'un autre site", async () => {
    const yoga = mkPage(A, "formation-yoga", "Formation yoga", [], { focusKeyword: "formation yoga" });
    mkPage(A, "meditation", "Méditation guidée", [{ type: "text", text: "<p>Découvrez notre FORMATION YOGA et la <a href=\"/p/meditation\">méditation</a>.</p>" }]);
    mkPage(A, "accueil-blog", "Blog", [{ type: "text", text: "<p>Notre méditation guidée est appréciée. Lisez la <a href=\"/p/formation-yoga\">formation yoga</a>.</p>" }]);
    mkPage(B, "formation-yoga-b", "Formation yoga B", [], { focusKeyword: "formation yoga" });
    const html = (await adminA.get(`${SP}/${A}/seo/liens-internes`)).text;
    assert.match(html, /Formation yoga/);
    assert.match(html, /\/p\/formation-yoga/);
    assert.equal(/formation-yoga-b/.test(html), false, "aucune page de B");
    const sec = html.split("<section").filter((s) => s.includes("Blog") && s.includes("Lier vers"));
    assert.equal(sec.some((s) => s.includes("/p/formation-yoga")), false, "le lien déjà présent n'est pas re-suggéré");
    assert.ok(yoga);
    assert.equal((await adminB.get(`${SP}/${A}/seo/liens-internes`)).status, 403);
  });

  test("positionnement : saisie, import Search Console, écart, validation, isolation et droits", async () => {
    const add = (c, site, o) => c.post(`${SP}/${site}/seo/positions`, o);
    await add(adminA, A, { keyword: "Formation Yoga", position: "12", date: "2026-10-01", url: "/p/formation-yoga" });
    await add(adminA, A, { keyword: "formation yoga", position: "8,5", date: "2026-10-15" });
    await add(adminA, A, { keyword: "invalide", position: "0" });
    await add(adminA, A, { keyword: "futur", position: "3", date: "2999-01-01" });
    assert.equal(one("SELECT COUNT(*) n FROM seo_rank_entries WHERE site_id = ?", A).n, 2, "position 0 et date future refusées");
    const csv = "Requêtes les plus fréquentes,Clics,Impressions,CTR,Position\nyoga doux,10,200,5%,6.2\nméditation,3,90,3%,\"14,8\"\n";
    await adminA.post(`${SP}/${A}/seo/positions/import`, { csv, date: "2026-10-20" });
    const page = (await adminA.get(`${SP}/${A}/seo/positions`)).text;
    assert.match(page, /formation yoga/);
    assert.match(page, /-3\.5/, "écart 12 → 8.5");
    assert.match(page, /yoga doux/);
    assert.equal(all("SELECT source FROM seo_rank_entries WHERE site_id = ? AND keyword = 'yoga doux'", A)[0].source, "import-gsc");
    assert.equal(one("SELECT COUNT(*) n FROM seo_rank_entries WHERE site_id = ?", B).n, 0);
    assert.equal(/formation yoga/.test((await adminB.get(`${SP}/${B}/seo/positions`)).text), false, "B ne voit pas les mesures de A");
    assert.equal((await viewerA.post(`${SP}/${A}/seo/positions`, { keyword: "x", position: "5" })).status, 403);
    assert.equal((await adminB.post(`${SP}/${A}/seo/positions`, { keyword: "x", position: "5" })).status, 403);
    const eid = one("SELECT id FROM seo_rank_entries WHERE site_id = ? LIMIT 1", A).id;
    await adminB.post(`${SP}/${B}/seo/positions/${eid}/supprimer`, {});
    assert.ok(one("SELECT id FROM seo_rank_entries WHERE id = ?", eid), "B ne peut pas supprimer une mesure de A");
  });

  test("connexions Google par site : propriété propre à chaque site, clé chiffrée, jamais renvoyée, relevé via l'API simulée", async () => {
    const key = serviceAccount();
    const bad = await adminA.post(`${SP}/${A}/seo/connexions/search_console`, { property: "pas une propriété", service_account: key });
    assert.equal(bad.status, 302);
    assert.equal(one("SELECT COUNT(*) n FROM seo_integrations WHERE name LIKE 'search_console@site%'").n, 0);
    const junkKey = await adminA.post(`${SP}/${A}/seo/connexions/search_console`, { property: "sc-domain:alpha.test", service_account: "{\"type\":\"autre\"}" });
    assert.equal(junkKey.status, 302);
    assert.equal(one("SELECT COUNT(*) n FROM seo_integrations WHERE name LIKE 'search_console@site%'").n, 0, "clé invalide : rien d'enregistré");
    await adminA.post(`${SP}/${A}/seo/connexions/search_console`, { property: "sc-domain:alpha.test", service_account: key });
    await adminB.post(`${SP}/${B}/seo/connexions/search_console`, { property: "sc-domain:bravo.test", service_account: serviceAccount() });
    const rows = all("SELECT name, secret, status FROM seo_integrations WHERE name LIKE 'search_console@site%' ORDER BY name");
    assert.deepEqual(rows.map((r) => r.name), [`search_console@site${A}`, `search_console@site${B}`]);
    assert.ok(rows.every((r) => r.status === "connected" && r.secret && !r.secret.includes("PRIVATE KEY")), "chiffrées et vérifiées");
    assert.deepEqual([...gscCalls].sort(), ["sc-domain:alpha.test", "sc-domain:bravo.test"]);
    const pageA = (await adminA.get(`${SP}/${A}/seo/connexions`)).text;
    assert.match(pageA, /sc-domain:alpha\.test/);
    assert.equal(/bravo\.test/.test(pageA), false);
    assert.equal(/PRIVATE KEY|svc@projet/.test(pageA), false, "la clé n'est jamais renvoyée au navigateur");
    assert.equal(one("SELECT COUNT(*) n FROM seo_integrations WHERE name = 'search_console'").n, 0, "la connexion centrale n'est pas touchée");
    // Relevé de positions depuis l'API du site A (donnée simulée par le faux Google)
    await adminA.post(`${SP}/${A}/seo/positions/api`, {});
    assert.equal(all("SELECT keyword, source FROM seo_rank_entries WHERE site_id = ? AND source = 'api-gsc'", A).length, 1);
    assert.equal(all("SELECT 1 FROM seo_rank_entries WHERE site_id = ? AND source = 'api-gsc'", B).length, 0);
    // droits et déconnexion
    assert.equal((await viewerA.post(`${SP}/${A}/seo/connexions/search_console`, { property: "sc-domain:x.test" })).status, 403);
    assert.equal((await adminB.post(`${SP}/${A}/seo/connexions/search_console`, { action: "deconnecter" })).status, 403);
    await adminA.post(`${SP}/${A}/seo/connexions/search_console`, { action: "deconnecter" });
    assert.equal(one("SELECT COUNT(*) n FROM seo_integrations WHERE name = ?", `search_console@site${A}`).n, 0);
    assert.equal(one("SELECT COUNT(*) n FROM seo_integrations WHERE name = ?", `search_console@site${B}`).n, 1, "B reste connecté");
  });
});
