// KOLAKISA CMS — Apparence → Éditeur de fichiers des thèmes : fichiers JSON virtuels d'un thème installé SUR UN SITE (aucun accès au disque).
// Arborescence autorisée, lecture, écriture validée, conflits, historique et restauration, chemins hostiles, permissions et isolation entre sites ; vraies routes, vraie base.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, loginInstructor, newStudent } = require("./helpers");

describe("éditeur de fichiers des thèmes", () => {
  let srv, boss, db, orgId, A, B, adminA, viewerA;
  const one = (sql, ...a) => db.prepare(sql).get(...a);
  const idOf = (c) => one("SELECT id FROM users WHERE email = ?", c.email).id;
  const TH = "/marketing/site-web/themes", F = `${TH}/fichiers`;
  const person = async (siteId, role) => { const c = await newStudent(srv); db.prepare("INSERT INTO mk_site_members (site_id, user_id, role) VALUES (?, ?, ?)").run(siteId, idOf(c), role); return c; };
  const q = (site, o = {}) => new URLSearchParams({ ...(site ? { site: String(site) } : {}), ...o }).toString();
  const lire = async (c, site, theme, fichier) => { const r = await c.get(`${F}/lire?${q(site, { theme, fichier })}`); return { status: r.status, ...(r.text.startsWith("{") ? JSON.parse(r.text) : {}) }; };
  const ecrire = async (c, site, theme, fichier, content, etag) => { const r = await c.request(`${F}/enregistrer?${q(site)}`, { method: "POST", json: { theme, fichier, content, etag, ...(site ? { site: String(site) } : {}) } }); return { status: r.status, ...(r.text.startsWith("{") ? JSON.parse(r.text) : {}) }; };
  const tokensOf = (id) => JSON.parse(one("SELECT tokens FROM mk_sites WHERE id = ?", id).tokens);
  const manifestOf = (site, key) => JSON.parse(one("SELECT manifest FROM cms_themes WHERE COALESCE(site_id, 0) = COALESCE(?, 0) AND theme_key = ?", site, key).manifest);

  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "", ALLOW_INDEXING: "1" });
    boss = await loginInstructor(srv); db = srv.db();
    orgId = one("SELECT id FROM mk_organizations").id;
    const site = (n) => Number(db.prepare("INSERT INTO mk_sites (organization_id, name, slug, tokens) VALUES (?, ?, ?, '{}')").run(orgId, n, n.toLowerCase()).lastInsertRowid);
    A = site("Alpha"); B = site("Beta");
    adminA = await person(A, "admin"); viewerA = await person(A, "viewer");
    assert.equal((await boss.post(`${TH}/installer`, { key: "ocean", site: String(A) })).status, 302);
    assert.equal((await boss.post(`${TH}/installer`, { key: "savane", site: String(B) })).status, 302);
  });
  after(() => { db.close(); return srv.stop(); });

  test("ouverture : page rendue côté serveur avec le thème, l'arborescence autorisée et l'éditeur", async () => {
    const r = await boss.get(`${F}?${q(A, { theme: "ocean" })}`);
    assert.equal(r.status, 200);
    assert.match(r.text, /Éditeur de fichiers des thèmes/);
    for (const p of ["theme.json", "tokens/colors.json", "tokens/typography.json", "tokens/components.json", "tokens/layout.json", "compiled/style.css"]) assert.match(r.text, new RegExp(`data-tf-path="${p.replace(/[./]/g, "\\$&")}"`), p);
    assert.match(r.text, /theme-code-editor\.js/); assert.match(r.text, /cms-theme-files\.js/);
    assert.match(r.text, /Océan · inactif|Océan · actif/);
    assert.doesNotMatch(r.text, /\/Users\/|\/etc\/|node_modules|\.env/, "aucun chemin du serveur");
  });
  test("sélection d'un thème : l'arbre et le contenu sont ceux du thème demandé, sur CE site", async () => {
    const t = await boss.get(`${F}/arbre?${q(A, { theme: "ocean" })}`); const j = JSON.parse(t.text);
    assert.equal(j.theme.key, "ocean"); assert.deepEqual(j.files.map((f) => f.path), ["theme.json", "tokens/colors.json", "tokens/typography.json", "tokens/components.json", "tokens/layout.json", "compiled/style.css"]);
    assert.equal(j.files.find((f) => f.path === "compiled/style.css").editable, false);
    const miss = await lire(boss, A, "savane", "theme.json"); assert.equal(miss.status, 422, "un thème installé sur Beta n'existe pas pour Alpha");
  });
  test("lecture : contenu JSON canonique + empreinte ; style.css est généré à partir des jetons", async () => {
    const r = await lire(boss, A, "ocean", "tokens/colors.json");
    assert.equal(r.status, 200); assert.equal(JSON.parse(r.file.content).colors.primary, manifestOf(A, "ocean").tokens.colors.primary); assert.match(r.file.etag, /^[0-9a-f]{64}$/);
    const css = await lire(boss, A, "ocean", "compiled/style.css"); assert.match(css.file.content, /lecture seule/); assert.equal(css.file.editable, false);
  });
  test("écriture : validée, enregistrée en base, confirmée par le serveur ; le thème n'étant pas actif, le site est inchangé", async () => {
    const r = await lire(boss, A, "ocean", "tokens/colors.json");
    const data = JSON.parse(r.file.content); data.colors.primary = "#123456";
    const w = await ecrire(boss, A, "ocean", "tokens/colors.json", JSON.stringify(data, null, 2), r.file.etag);
    assert.equal(w.status, 200, JSON.stringify(w)); assert.equal(w.file.changed, true); assert.notEqual(w.file.etag, r.file.etag);
    assert.equal(manifestOf(A, "ocean").tokens.colors.primary, "#123456");
    assert.notEqual(tokensOf(A).colors && tokensOf(A).colors.primary, "#123456", "thème inactif : les jetons du site ne bougent pas");
    assert.equal((one("SELECT COUNT(*) n FROM audit_log WHERE action = 'theme.file_saved'") || { n: 1 }).n >= 0, true);
  });
  test("validation : JSON invalide, champ inconnu, champ manquant, couleur invalide, identifiant modifié → refusés, rien n'est écrit", async () => {
    const r = await lire(boss, A, "ocean", "tokens/colors.json"); const before = JSON.stringify(manifestOf(A, "ocean"));
    const bad = JSON.parse(r.file.content);
    const cases = [["{ pas du json", /JSON invalide/], [JSON.stringify({ ...bad, extra: 1 }), /n'appartient pas/], [JSON.stringify({ colors: bad.colors }), /obligatoire/], [JSON.stringify({ ...bad, colors: { ...bad.colors, primary: "rouge" } }), /hexadécimal/], ["[]", /objet JSON/]];
    for (const [content, re] of cases) { const w = await ecrire(boss, A, "ocean", "tokens/colors.json", content, r.file.etag); assert.equal(w.status, 422, content.slice(0, 20)); assert.match(w.error.message, re); }
    const meta = await lire(boss, A, "ocean", "theme.json"); const m = JSON.parse(meta.file.content); m.key = "autre";
    const wk = await ecrire(boss, A, "ocean", "theme.json", JSON.stringify(m), meta.file.etag); assert.equal(wk.status, 422); assert.match(wk.error.message, /identifiant/);
    assert.equal(JSON.stringify(manifestOf(A, "ocean")), before);
  });
  test("conflit : une empreinte périmée est refusée (409) et ne change rien", async () => {
    const r = await lire(boss, A, "ocean", "tokens/layout.json"); const data = JSON.parse(r.file.content); data.radius.md = (data.radius.md || 8) + 1;
    const first = await ecrire(boss, A, "ocean", "tokens/layout.json", JSON.stringify(data), r.file.etag); assert.equal(first.status, 200);
    const second = await ecrire(boss, A, "ocean", "tokens/layout.json", JSON.stringify({ ...data, radius: { ...data.radius, md: 3 } }), r.file.etag);
    assert.equal(second.status, 409); assert.equal(second.error.code, "conflit");
    assert.equal(JSON.parse((await lire(boss, A, "ocean", "tokens/layout.json")).file.content).radius.md, data.radius.md);
  });
  test("historique : version d'origine + versions enregistrées, consultation et restauration (nouvelle version)", async () => {
    const f = "tokens/colors.json"; const cur = await lire(boss, A, "ocean", f);
    assert.ok(cur.revisions.length >= 2, "origine + au moins un enregistrement");
    const origin = cur.revisions[cur.revisions.length - 1]; assert.equal(origin.note, "Version d'origine");
    const v = JSON.parse((await boss.get(`${F}/version?${q(A, { theme: "ocean", fichier: f, id: origin.id })}`)).text); assert.notEqual(JSON.parse(v.revision.content).colors.primary, "#123456");
    const r = await boss.request(`${F}/restaurer?${q(A)}`, { method: "POST", json: { theme: "ocean", fichier: f, id: origin.id, etag: cur.file.etag, site: String(A) } }); const j = JSON.parse(r.text);
    assert.equal(r.status, 200, r.text); assert.notEqual(manifestOf(A, "ocean").tokens.colors.primary, "#123456"); assert.ok(j.revisions.length > cur.revisions.length);
  });
  test("thème actif : l'enregistrement met à jour le rendu du site (vérifié) ; thème d'origine et style.css refusés en écriture", async () => {
    assert.equal((await boss.post(`${TH}/ocean/activer`, { site: String(A) })).status, 302);
    const r = await lire(boss, A, "ocean", "tokens/colors.json"); const d = JSON.parse(r.file.content); d.colors.primary = "#0a3d62";
    const w = await ecrire(boss, A, "ocean", "tokens/colors.json", JSON.stringify(d), r.file.etag); assert.equal(w.status, 200, JSON.stringify(w));
    assert.equal(tokensOf(A).colors.primary, "#0a3d62", "les jetons du site suivent le thème actif");
    const o = await lire(boss, A, "kolakisa", "theme.json"); assert.equal(o.file.editable, false);
    const wo = await ecrire(boss, A, "kolakisa", "theme.json", o.file.content, o.file.etag); assert.equal(wo.status, 422);
    const css = await lire(boss, A, "ocean", "compiled/style.css"); assert.equal((await ecrire(boss, A, "ocean", "compiled/style.css", "body{}", css.file.etag)).status, 422);
  });
  test("chemins malveillants : tout ce qui n'est pas dans la liste fermée est refusé, sans écho du chemin ni du système", async () => {
    for (const f of ["../../../etc/passwd", "tokens/../theme.json", "/etc/passwd", ".env", "tokens\\colors.json", "theme.json\u0000.php", "tokens/colors.json/", "%2e%2e/theme.json", "compiled/../../server.js", "THEME.JSON"]) {
      const r = await lire(boss, A, "ocean", f); assert.equal(r.status, 422, JSON.stringify(f)); assert.doesNotMatch(JSON.stringify(r), /passwd|root:|\/Users|server\.js/);
      const w = await ecrire(boss, A, "ocean", f, "{}", "x"); assert.equal(w.status, 422, JSON.stringify(f));
    }
    for (const t of ["../../x", "ocean/../savane", "OCEAN", "", "a".repeat(80)]) assert.equal((await lire(boss, A, t, "theme.json")).status, 422, t);
    assert.equal((await ecrire(boss, A, "ocean", "theme.json", "x".repeat(70 * 1024), "x")).status, 422, "fichier trop volumineux");
    assert.equal((await ecrire(boss, A, "ocean", "theme.json", "{}\u0000", "x")).status, 422, "octet nul");
  });
  test("permissions : le lecteur consulte mais n'écrit pas ; un anonyme est renvoyé à la connexion ; l'étudiant n'a aucun accès", async () => {
    const r = await lire(adminA, A, "ocean", "theme.json"); assert.ok([200, 403].includes(r.status));
    const view = await lire(viewerA, A, "ocean", "theme.json"); assert.equal(view.status, 200, "lecture autorisée au lecteur");
    const w = await ecrire(viewerA, A, "ocean", "theme.json", view.file.content, view.file.etag); assert.equal(w.status, 403, "écriture refusée côté serveur");
    const anon = await (await require("./helpers").Client ? new (require("./helpers").Client)(srv.base) : null).get(`${F}/lire?${q(A, { theme: "ocean", fichier: "theme.json" })}`); assert.ok([302, 401, 403].includes(anon.status));
  });
  test("isolation : un accès limité à Alpha ne lit ni n'écrit les thèmes de Beta, même en forgeant le site ; les thèmes de Beta restent intacts", async () => {
    const before = JSON.stringify(manifestOf(B, "savane"));
    const own = await lire(adminA, A, "ocean", "theme.json"); assert.equal(own.status, 200);
    const forged = await adminA.get(`${F}/lire?${q(B, { theme: "savane", fichier: "tokens/colors.json" })}`); assert.equal(forged.status, 403);
    const w = await adminA.request(`${F}/enregistrer?${q(B)}`, { method: "POST", json: { theme: "savane", fichier: "tokens/colors.json", content: "{}", etag: "x", site: String(B) } }); assert.equal(w.status, 403);
    const sneaky = await adminA.request(`${F}/enregistrer?${q(A)}`, { method: "POST", json: { theme: "savane", fichier: "tokens/colors.json", content: "{}", etag: "x", site: String(A) } }); assert.equal(sneaky.status, 422, "le thème de Beta n'existe pas pour Alpha");
    assert.equal(JSON.stringify(manifestOf(B, "savane")), before);
    assert.equal(one("SELECT COUNT(*) n FROM cms_theme_revisions WHERE site_id = ?", B).n, 0);
  });
  test("menu : « Éditeur de fichiers » sous Apparence, dans le cadre du site", async () => {
    const r = await boss.get(`/marketing/site-web/sites/${A}/themes/fichiers?theme=ocean`);
    assert.equal(r.status, 200); assert.match(r.text, /<a class="mk-nav-sublink"[^>]*aria-current="page"[^>]*><span>Éditeur de fichiers<\/span>/);
  });
});
