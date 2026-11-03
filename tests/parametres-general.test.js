// KOLAKISA CMS — Paramètres → Général (centre de configuration) : écran par site et pour le principal, enregistrement unique « tout ou rien », validation serveur, réglages sensibles
// (confirmation), droits, isolation entre sites, inscriptions publiques (effet réel sur /inscription), formats de date (effet réel sur l'affichage), fuseaux et changements d'heure,
// premier jour de la semaine, écrans déplacés (en-tête, pied de page, design system) et anciens liens.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, Client, loginInstructor, newStudent } = require("./helpers");

describe("Paramètres → Général", () => {
  let srv, boss, db, orgId, A, B, adminA, viewerA, outsider, anon;
  const one = (sql, ...a) => db.prepare(sql).get(...a);
  const idOf = (c) => one("SELECT id FROM users WHERE email = ?", c.email).id;
  const R = "/marketing/site-web";
  const API = `${R}/parametres/api/general`;
  const qs = (site) => (site ? `?site=${site}` : "");
  const parse = (t) => { try { return JSON.parse(t); } catch { return { raw: String(t).slice(0, 120) }; } };
  const put = async (client, values, { site, confirm } = {}) => { const r = await client.request(`${API}${qs(site)}`, { method: "PUT", json: { values, ...(confirm ? { confirm: true } : {}) } }); return { status: r.status, body: parse(r.text) }; };
  const settingsOf = (id) => JSON.parse(one("SELECT settings FROM mk_sites WHERE id = ?", id).settings || "{}");
  const bootOf = (html) => JSON.parse(/<script type="application\/json" id="sg-data">([\s\S]*?)<\/script>/.exec(html)[1].replace(/\\u003c/g, "<"));

  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "", ALLOW_INDEXING: "1" });
    boss = await loginInstructor(srv); db = srv.db(); anon = new Client(srv.base);
    orgId = one("SELECT id FROM mk_organizations").id;
    const site = (n) => Number(db.prepare("INSERT INTO mk_sites (organization_id, name, slug, tokens) VALUES (?, ?, ?, '{}')").run(orgId, n, n.toLowerCase()).lastInsertRowid);
    A = site("Alpha"); B = site("Beta");
    adminA = await newStudent(srv); viewerA = await newStudent(srv); outsider = await newStudent(srv);
    db.prepare("INSERT INTO mk_site_members (site_id, user_id, role) VALUES (?, ?, 'admin')").run(A, idOf(adminA));
    db.prepare("INSERT INTO mk_site_members (site_id, user_id, role) VALUES (?, ?, 'viewer')").run(A, idOf(viewerA));
  });
  after(() => { db.close(); return srv.stop(); });

  test("l'écran : cinq sections, valeurs réelles du site, aucun écran vide ; le principal et un site ont chacun le leur", async () => {
    const r = await boss.get(`${R}/sites/${A}/reglages`); assert.equal(r.status, 200);
    for (const id of ["identite", "adresses", "comptes", "langue", "dates"]) assert.ok(r.text.includes(`id="${id}"`), id);
    const boot = bootOf(r.text);
    assert.equal(boot.fields.site_name.value, "Alpha"); assert.equal(boot.fields.site_slug.value, "alpha");
    assert.equal(boot.fields.timezone.value, "Europe/Paris"); assert.equal(boot.fields.date_format.value, "long"); assert.equal(boot.fields.week_start.value, "monday");
    assert.ok(!("registration_open" in boot.fields), "les inscriptions publiques sont une réglage de la plateforme, pas d'un site");
    const main = bootOf((await boss.get(`${R}/parametres`)).text);
    assert.ok("registration_open" in main.fields && "admin_email" in main.fields); assert.ok(!("site_slug" in main.fields) && !("favicon" in main.fields));
    assert.equal((await boss.get(`${R}/parametres?site=${A}`)).status, 200);
    assert.equal((await anon.get(`${R}/sites/${A}/reglages`)).status === 200, false, "anonyme : refusé");
  });

  test("enregistrement unique : nom, slogan, fuseau, formats, semaine → un seul appel ; rechargement = valeurs réellement enregistrées ; la réponse les renvoie", async () => {
    const r = await put(boss, { site_name: "Alpha Studio", description: "Formations en ligne", timezone: "America/Chicago", date_format: "iso", time_format: "12h", week_start: "sunday", language: "en", site_type: "formation" }, { site: A });
    assert.equal(r.status, 200, JSON.stringify(r.body)); assert.equal(r.body.ok, true); assert.equal(r.body.changed.length, 8);
    assert.equal(r.body.values.site_name, "Alpha Studio"); assert.equal(r.body.values.timezone, "America/Chicago");
    const site = one("SELECT * FROM mk_sites WHERE id = ?", A), st = settingsOf(A);
    assert.equal(site.name, "Alpha Studio"); assert.equal(site.site_type, "formation");
    assert.equal(st.identity.description, "Formations en ligne"); assert.equal(st.general.timezone, "America/Chicago"); assert.equal(st.general.dateFormat, "iso");
    assert.equal(st.general.timeFormat, "12h"); assert.equal(st.general.weekStart, "sunday"); assert.equal(st.extras.language, "en");
    const boot = bootOf((await boss.get(`${R}/sites/${A}/reglages`)).text);
    for (const [k, v] of Object.entries({ site_name: "Alpha Studio", description: "Formations en ligne", timezone: "America/Chicago", date_format: "iso", time_format: "12h", week_start: "sunday", language: "en", site_type: "formation" })) assert.equal(boot.fields[k].value, v, k);
    assert.ok(one("SELECT COUNT(*) n FROM audit_log WHERE action = 'settings.updated'").n >= 1, "journal d'activité");
  });

  test("validation côté serveur : fuseau inconnu, format inconnu, nom vide, identifiant invalide, domaine invalide, texte trop long, réglage étranger → refus et RIEN n'est écrit (même les champs valides du même envoi)", async () => {
    const before = JSON.stringify([one("SELECT name, slug FROM mk_sites WHERE id = ?", A), settingsOf(A)]);
    const bad = [{ timezone: "Mars/Olympus" }, { date_format: "zz" }, { time_format: "13h" }, { week_start: "friday" }, { site_name: "   " }, { site_slug: "Mauvais Slug!" }, { description: "x".repeat(400) }, { public_url: "http://non-https.example" }, { language: "klingon" }, { site_type: "inconnu" }, { site_note: ["tableau"] }, { homepage_page: 999999 }];
    for (const values of bad) { const r = await put(boss, values, { site: A, confirm: true }); assert.equal(r.status, 422, JSON.stringify(values) + " → " + JSON.stringify(r.body).slice(0, 120)); assert.ok(r.body.errors && r.body.errors.length, JSON.stringify(values)); }
    const mixed = await put(boss, { site_name: "Nom valide mais refusé", timezone: "Mars/Olympus" }, { site: A });
    assert.equal(mixed.status, 422); assert.equal(one("SELECT name FROM mk_sites WHERE id = ?", A).name, "Alpha Studio", "atomique : le nom valide n'est pas enregistré");
    const foreign = await put(boss, { search_visibility: "closed" }, { site: A }); assert.equal(foreign.status, 422); assert.match(foreign.body.errors[0], /étranger/);
    assert.equal(JSON.stringify([one("SELECT name, slug FROM mk_sites WHERE id = ?", A), settingsOf(A)]), before, "aucune écriture");
  });

  test("réglages sensibles (domaine, identifiant, page d'accueil) : refusés sans confirmation (409 + impact), enregistrés avec ; le domaine ne sert qu'un site", async () => {
    const r1 = await put(boss, { public_url: "https://www.alpha-general.example" }, { site: A });
    assert.equal(r1.status, 409); assert.ok(r1.body.confirmRequired[0].impact); assert.ok(!((settingsOf(A).seo || {}).publicUrl), "rien d'écrit sans confirmation");
    assert.equal((await put(boss, { public_url: "https://www.alpha-general.example", site_slug: "alpha-2" }, { site: A, confirm: true })).status, 200);
    assert.equal(settingsOf(A).seo.publicUrl, "https://www.alpha-general.example"); assert.equal(one("SELECT slug FROM mk_sites WHERE id = ?", A).slug, "alpha-2");
    const dup = await put(boss, { public_url: "https://www.alpha-general.example" }, { site: B, confirm: true });
    assert.ok([409, 422].includes(dup.status), `un domaine ne sert qu'un seul site : ${dup.status} ${JSON.stringify(dup.body).slice(0, 160)}`); assert.ok(!((settingsOf(B).seo || {}).publicUrl), "B garde son domaine vide");
    const slugDup = await put(boss, { site_slug: "alpha-2" }, { site: B, confirm: true }); assert.equal(slugDup.status, 422);
    const page = Number(db.prepare("INSERT INTO mk_landing_pages (organization_id, name, slug, title, sections, status, kind, site_id, published_at) VALUES (?, 'Accueil A', 'accueil-a', 'Accueil A', '[]', 'published', 'page', ?, datetime('now'))").run(orgId, A).lastInsertRowid);
    assert.equal((await put(boss, { homepage_page: String(page) }, { site: A })).status, 409);
    assert.equal((await put(boss, { homepage_page: String(page) }, { site: A, confirm: true })).status, 200); assert.equal(one("SELECT home_page_id FROM mk_sites WHERE id = ?", A).home_page_id, page);
    const other = Number(db.prepare("INSERT INTO mk_landing_pages (organization_id, name, slug, title, sections, status, kind, site_id, published_at) VALUES (?, 'Accueil B', 'accueil-b', 'Accueil B', '[]', 'published', 'page', ?, datetime('now'))").run(orgId, B).lastInsertRowid);
    assert.equal((await put(boss, { homepage_page: String(other) }, { site: A, confirm: true })).status, 422, "la page d'un autre site ne peut pas être l'accueil de A");
  });

  test("effet réel sur le site public : l'icône du site devient le favicon, le nom et la description sont repris par la page publiée ; retirer l'icône la retire ; une image hors médiathèque est refusée", async () => {
    db.prepare("INSERT INTO mk_media (organization_id, kind, type, path, name, mime, size) VALUES (?, 'image', 'image', '/uploads/marketing/1/favicon-alpha.png', 'favicon-alpha.png', 'image/png', 10)").run(orgId);
    const page = Number(db.prepare("INSERT INTO mk_landing_pages (organization_id, name, slug, title, sections, status, kind, site_id, published_at, indexable) VALUES (?, 'Vitrine A', 'vitrine-a', 'Vitrine A', ?, 'published', 'page', ?, datetime('now'), 1)").run(orgId, JSON.stringify([{ type: "text", markdown: "Bienvenue" }]), A).lastInsertRowid);
    assert.ok(page);
    assert.equal((await put(boss, { favicon: "https://evil.example/x.png" }, { site: A })).status, 422, "adresse arbitraire refusée");
    assert.equal((await put(boss, { favicon: "/uploads/marketing/1/inexistant.png" }, { site: A })).status, 422, "fichier absent de la médiathèque refusé");
    assert.equal((await put(boss, { favicon: "/uploads/marketing/1/favicon-alpha.png", description: "Description publique d'Alpha" }, { site: A })).status, 200);
    const html = (await anon.get("/p/vitrine-a")).text;
    assert.match(html, /<link rel="icon" href="\/uploads\/marketing\/1\/favicon-alpha\.png"/, "favicon du site");
    assert.match(html, /Description publique d'Alpha/, "description du site reprise par la page");
    assert.equal((await put(boss, { favicon: "" }, { site: A })).status, 200);
    assert.ok(!(await anon.get("/p/vitrine-a")).text.includes("favicon-alpha.png"), "icône retirée");
  });

  test("double envoi : le même enregistrement rejoué ne change rien (aucune écriture en double, réponse 200)", async () => {
    const v = { description: "Description stable" };
    const first = await put(boss, v, { site: A }); assert.equal(first.status, 200); assert.equal(first.body.changed.length, 1);
    const logs = one("SELECT COUNT(*) n FROM audit_log WHERE action = 'settings.updated'").n;
    const second = await put(boss, v, { site: A }); assert.equal(second.status, 200); assert.deepEqual(second.body.changed, []);
    assert.equal(one("SELECT COUNT(*) n FROM audit_log WHERE action = 'settings.updated'").n, logs, "rien n'est journalisé quand rien ne change");
  });

  test("droits et isolation : l'administrateur d'Alpha règle Alpha ; jamais Beta ni le principal, même en forgeant « ?site= » ou le corps ; le lecteur et l'inconnu sont refusés", async () => {
    assert.equal((await put(adminA, { description: "Par l'admin de A" }, { site: A })).status, 200);
    assert.equal(settingsOf(A).identity.description, "Par l'admin de A");
    const beforeB = JSON.stringify([one("SELECT * FROM mk_sites WHERE id = ?", B)]);
    for (const [label, r] of [["?site=B", await put(adminA, { description: "pirate" }, { site: B })], ["principal", await put(adminA, { description: "pirate" })], ["site=0", await put(adminA, { description: "pirate" }, { site: 0 })]]) assert.ok([403, 404].includes(r.status), `${label} : ${r.status}`);
    const forged = await adminA.request(`${API}?site=${A}`, { method: "PUT", json: { site: B, values: { description: "pirate" } } }); assert.ok(forged.status === 200 || forged.status === 403, "le site du corps ne l'emporte jamais sur l'adresse");
    assert.equal(JSON.stringify([one("SELECT * FROM mk_sites WHERE id = ?", B)]), beforeB, "Beta intact");
    assert.equal((await adminA.get(`${R}/sites/${B}/reglages`)).status === 200, false, "la page de Beta n'est pas ouverte à l'admin d'Alpha");
    assert.equal((await adminA.get(`${R}/parametres?site=${B}`)).status === 200, false);
    assert.ok([403, 404].includes((await viewerA.request(`${API}?site=${A}`, { method: "PUT", json: { values: { description: "lecteur" } } })).status), "le lecteur ne modifie pas");
    const viewPage = await viewerA.get(`${R}/sites/${A}/reglages`);
    if (viewPage.status === 200) assert.match(viewPage.text, /Lecture seule/);
    assert.notEqual(settingsOf(A).identity.description, "lecteur");
    assert.ok([302, 401, 403].includes((await outsider.request(`${API}?site=${A}`, { method: "PUT", json: { values: { description: "x" } } })).status));
    assert.ok([302, 401, 403].includes((await anon.request(`${API}?site=${A}`, { method: "PUT", json: { values: { description: "x" } } })).status));
    // le principal est réservé à l'équipe de l'organisation : un accès limité ne le règle pas
    assert.ok([403, 404].includes((await adminA.request(`${R}/parametres/api/general`, { method: "PUT", json: { values: { registration_open: false }, confirm: true } })).status));
  });

  test("inscriptions publiques : fermer = la page et l'envoi du formulaire sont refusés par le serveur (aucun compte créé) ; rouvrir les rétablit ; confirmation exigée pour fermer", async () => {
    assert.equal((await anon.get("/inscription")).status, 200);
    const closeNoConfirm = await put(boss, { registration_open: false }); assert.equal(closeNoConfirm.status, 409);
    assert.equal((await anon.get("/inscription")).status, 200, "pas fermé sans confirmation");
    assert.equal((await put(boss, { registration_open: false }, { confirm: true })).status, 200);
    const closed = await anon.get("/inscription"); assert.equal(closed.status, 403); assert.match(closed.text, /inscriptions sont fermées/); assert.ok(!closed.text.includes('name="password"'), "aucun formulaire");
    const before = one("SELECT COUNT(*) n FROM users").n;
    const post = await anon.post("/inscription", { username: "intrus", email: "intrus@example.com", password: "motdepasse123" });
    assert.equal(post.status, 403); assert.equal(one("SELECT COUNT(*) n FROM users").n, before, "aucun compte créé");
    assert.equal(boss.cookies.size > 0, true);
    assert.equal((await put(boss, { registration_open: true }, { confirm: true })).status, 200);
    assert.equal((await anon.get("/inscription")).status, 200);
    const ok = await anon.post("/inscription", { username: "nouvelle_personne", email: "nouvelle@example.com", password: "motdepasse123" });
    assert.ok([200, 302].includes(ok.status)); const u = one("SELECT role FROM users WHERE email = 'nouvelle@example.com'");
    assert.equal(u.role, "etudiant", "le rôle d'une inscription publique est fixé par le serveur : étudiant");
    const forgedRole = await new Client(srv.base).post("/inscription", { username: "malin", email: "malin@example.com", password: "motdepasse123", role: "formateur" });
    assert.ok([200, 302].includes(forgedRole.status)); assert.equal(one("SELECT role FROM users WHERE email = 'malin@example.com'").role, "etudiant", "un rôle envoyé dans le formulaire est ignoré");
  });

  test("formats de date et fuseaux : tous les formats s'appliquent à l'affichage ; l'heure d'été est gérée ; les dates enregistrées (UTC) ne sont jamais modifiées", () => {
    const f = require("../src/utils/format");
    const summer = Date.UTC(2026, 6, 14, 22, 30), winter = Date.UTC(2026, 0, 14, 22, 30), before = Date.UTC(2026, 2, 29, 0, 30), after = Date.UTC(2026, 2, 29, 1, 30);
    const cfg = (o) => ({ locale: "fr-FR", timeZone: "Europe/Paris", dateFormat: "long", timeFormat: "24h", ...o });
    assert.equal(f.formatInstant(summer, cfg({ dateFormat: "iso" }), { withTime: true }), "2026-07-15 00:30", "été : UTC+2, passage au lendemain");
    assert.equal(f.formatInstant(winter, cfg({ dateFormat: "iso" }), { withTime: true }), "2026-01-14 23:30", "hiver : UTC+1");
    assert.equal(f.formatInstant(before, cfg({ dateFormat: "dmy" }), { withTime: true }), "29/03/2026 01:30", "juste avant le changement d'heure (UTC+1)");
    assert.equal(f.formatInstant(after, cfg({ dateFormat: "dmy" }), { withTime: true }), "29/03/2026 03:30", "juste après : 02:30 n'existe pas, UTC+2");
    assert.equal(f.formatInstant(summer, cfg({ dateFormat: "mdy", timeZone: "America/Chicago", timeFormat: "12h" }), { withTime: true }), "07/14/2026 05:30 PM", "Chicago, 12 heures");
    assert.equal(f.formatInstant(summer, cfg({ dateFormat: "dots" })), "15.07.2026"); assert.equal(f.formatInstant(summer, cfg({ dateFormat: "long" })), "15 juillet 2026");
    assert.equal(f.formatInstant(summer, cfg({ dateFormat: "medium", locale: "en-US", timeZone: "UTC" })), "Jul 14, 2026");
    assert.equal(f.formatInstant("2026-07-14 22:30:00", cfg({ dateFormat: "iso" })), "2026-07-15", "texte UTC de la base");
    assert.ok(f.isValidDateFormat("iso") && !f.isValidDateFormat("zz"));
    assert.deepEqual(f.WEEK_STARTS, ["monday", "sunday", "saturday"]);
  });

  test("effet réel : le format et le fuseau choisis par un site sont ceux de ses dates affichées (siteDate), sans toucher aux dates enregistrées", async () => {
    assert.equal((await put(boss, { timezone: "Pacific/Auckland", date_format: "dots", time_format: "24h", language: "fr" }, { site: B })).status, 200);
    const site = require("../src/marketing/pages").getSite({ db, organizationId: orgId, can: () => true }, B);
    const g = site.settings.general;
    const cfg = { locale: "fr-FR", timeZone: g.timezone, dateFormat: g.dateFormat, timeFormat: g.timeFormat };
    assert.equal(require("../src/utils/format").formatInstant("2026-10-23 12:00:00", cfg, { withTime: true }), "24.10.2026 01:00", "Auckland (UTC+13 en octobre)");
    assert.equal(one("SELECT COUNT(*) n FROM mk_landing_pages WHERE site_id = ? AND published_at LIKE '%T%'", B).n, 0);
  });

  test("en-tête et pied de page : plus d'écrans autonomes, tout mène au Theme Builder ; le design system garde son formulaire", async () => {
    const r = await boss.get(`${R}/sites/${A}/reglages/design-system`); assert.equal(r.status, 200); assert.ok(r.text.includes('id="design"'));
    assert.ok(r.text.includes(`/sites/${A}/design`), "le formulaire du design system poste toujours sur la même route");
    const d = await boss.post(`${R}/sites/${A}/design`, { reset: "1" }); assert.equal(d.status, 302); assert.match(d.location, /\/reglages\/design-system$/);
    // anciennes adresses : redirection vers la section du Theme Builder (jamais d'écran vide) ; anciennes actions : supprimées
    for (const [old, type] of [["en-tete", "header"], ["pied-de-page", "footer"]]) {
      const x = await boss.get(`${R}/sites/${A}/reglages/${old}`); assert.equal(x.status, 301, old); assert.equal(x.location, `${R}/sites/${A}/constructeur-de-theme?type=${type}`);
    }
    for (const path of ["parties", "entete/creer", "entete/variante"]) assert.equal((await boss.post(`${R}/sites/${A}/${path}`, {})).status, 404, path);
    const old = await boss.get(`${R}/sites/${A}/reglages`); assert.ok(!old.text.includes('id="entete"') && !old.text.includes('id="design"'), "plus de doublon dans Général");
    assert.match(old.text, /constructeur-de-theme\?type=header/, "Général renvoie vers le Theme Builder"); assert.match(old.text, /constructeur-de-theme\?type=footer/); assert.match(old.text, /reglages\/design-system/);
    assert.doesNotMatch(old.text, /reglages\/en-tete|reglages\/pied-de-page/);
    const nav = require("../src/marketing/web/cmsNav");
    const space = { siteId: A, principal: false, base: `${R}/sites/${A}`, name: "Alpha", listHref: `${R}/sites` };
    const items = nav.projectSections(space).flatMap((s) => s.items);
    assert.equal(items.find((i) => i.key === "apparence/en-tete"), undefined, "absent du menu d'un site");
    assert.equal(items.find((i) => i.key === "apparence/pied-de-page"), undefined, "absent du menu d'un site");
    assert.ok(items.find((i) => i.key === "apparence/theme-builder"), "le Theme Builder reste dans le menu");
    assert.equal((await adminA.get(`${R}/sites/${B}/reglages/en-tete`)).status === 301, false, "la redirection ne s'ouvre pas à l'admin de A pour le site B");
  });

  test("principal : l'équipe règle le site principal (nom, fuseau, e-mail administratif) ; l'effet est celui du moteur (une seule source) ; l'e-mail est validé", async () => {
    const r = await put(boss, { site_name: "KOLAKISA Test", timezone: "Europe/Brussels", week_start: "saturday", admin_email: "Admin@Example.com", date_format: "dmy" });
    assert.equal(r.status, 200, JSON.stringify(r.body));
    assert.equal(r.body.values.admin_email, "admin@example.com");
    assert.equal((await put(boss, { admin_email: "pas-un-email" })).status, 422);
    assert.equal(bootOf((await boss.get(`${R}/parametres`)).text).fields.week_start.value, "saturday");
    const kv = (k) => (one("SELECT value FROM mk_settings WHERE organization_id = ? AND key = ?", orgId, `cms.${k}`) || {}).value;
    assert.equal(kv("timezone"), "Europe/Brussels"); assert.equal(kv("week_start"), "saturday"); assert.equal(kv("date_format"), "dmy"); assert.equal(kv("admin_email"), "admin@example.com");
  });
});
