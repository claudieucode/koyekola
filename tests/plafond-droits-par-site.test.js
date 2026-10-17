// R3 (A-06) — plafond de droits par site, de bout en bout : vrai serveur, vraie base d'essai, vraies routes (/marketing/pages/…, /marketing/site-web/utilisateurs/…).
// Témoins sans plafond (comportement historique inchangé) ; avec plafond : écriture refusée sur le site plafonné, intacte sur les autres sites et sur l'organisation ;
// un plafond ne peut jamais élever ; attribution réservée à qui gère les rôles ; accès limité à un site inchangé.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, loginInstructor, newStudent } = require("./helpers");

describe("plafond de droits par site : bout en bout", () => {
  let srv, boss, db, orgId, A, B;
  const U = "/marketing/site-web/utilisateurs";
  const one = (sql, ...a) => db.prepare(sql).get(...a);
  const idOf = (client) => one("SELECT id FROM users WHERE email = ?", client.email).id;
  let pageN = 0;
  const mkSite = (name) => Number(db.prepare("INSERT INTO mk_sites (organization_id, name, slug, tokens) VALUES (?, ?, ?, '{}')").run(orgId, name, name.toLowerCase()).lastInsertRowid);
  const mkPage = (site) => Number(db.prepare("INSERT INTO mk_landing_pages (organization_id, name, slug, title, status, site_id) VALUES (?, ?, ?, ?, 'draft', ?)").run(orgId, `P${++pageN}`, `plafond-p${pageN}`, `P${pageN}`, site).lastInsertRowid);
  // Archiver une page pose archived_at (le statut de publication ne change pas) : « archived » = la page est à la corbeille
  const status = (page) => (one("SELECT archived_at a FROM mk_landing_pages WHERE id = ?", page).a ? "archived" : "draft");
  const person = async (teamRole) => {
    const c = await newStudent(srv);
    if (teamRole) db.prepare("INSERT INTO mk_org_members (organization_id, user_id, role) VALUES (?, ?, ?)").run(orgId, idOf(c), teamRole);
    return c;
  };
  const giveSite = (client, site, role, mode) => boss.post(`${U}/${idOf(client)}/sites`, { site_id: String(site), role, ...(mode ? { mode } : {}) });
  const modeOf = (client, site) => one("SELECT mode FROM mk_site_members WHERE user_id = ? AND site_id = ?", idOf(client), site).mode;
  // Une écriture protégée par « forms.write » : archiver une page
  const archive = (client, page) => client.post(`/marketing/pages/${page}/archiver`, {});

  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv);
    db = srv.db();
    orgId = one("SELECT id FROM mk_organizations").id;
    A = mkSite("Alpha"); B = mkSite("Beta");
  });
  after(() => srv.stop());

  test("témoin : sans plafond, un éditeur d'équipe écrit sur tous les sites (comportement historique inchangé)", async () => {
    const editor = await person("editor");
    await giveSite(editor, B, "viewer"); // aucun mode : « add » par défaut, l'union historique
    assert.equal(modeOf(editor, B), "add");
    const p = mkPage(B);
    assert.notEqual((await archive(editor, p)).status, 403);
    assert.equal(status(p), "archived");
  });

  test("avec plafond « lecteur » sur B : l'éditeur d'équipe ne peut plus écrire sur B, mais lit toujours ; A et l'organisation sont intacts", async () => {
    const editor = await person("editor");
    assert.ok((await giveSite(editor, B, "viewer", "limit")).status < 400);
    assert.equal(modeOf(editor, B), "limit");
    const pB = mkPage(B), pA = mkPage(A), pOrg = mkPage(null);
    const refused = await archive(editor, pB);
    assert.equal(refused.status, 403);
    assert.equal(status(pB), "draft", "rien n'a changé sur le site plafonné");
    assert.equal((await editor.get(`/marketing/pages/${pB}`)).status, 200, "la lecture reste permise par le rôle de site");
    assert.notEqual((await archive(editor, pA)).status, 403);
    assert.equal(status(pA), "archived", "le site A, sans plafond, est intact");
    assert.notEqual((await archive(editor, pOrg)).status, 403);
    assert.equal(status(pOrg), "archived", "le site principal est intact");
    assert.equal((await editor.get("/marketing/site-web/articles")).status, 200, "les écrans de l'organisation sont intacts");
  });

  test("un plafond ne peut jamais élever : équipe lecteur + éditeur de site plafonné reste lecteur ; sans plafond, l'union historique élève toujours (témoin)", async () => {
    const capped = await person("viewer"), uncapped = await person("viewer");
    await giveSite(capped, A, "editor", "limit");
    await giveSite(uncapped, A, "editor");
    const p1 = mkPage(A), p2 = mkPage(A);
    assert.equal((await archive(capped, p1)).status, 403);
    assert.equal(status(p1), "draft");
    assert.notEqual((await archive(uncapped, p2)).status, 403);
    assert.equal(status(p2), "archived");
  });

  test("retirer le plafond rend les droits historiques ; le replacer les retire de nouveau", async () => {
    const editor = await person("editor");
    await giveSite(editor, B, "viewer", "limit");
    const p = mkPage(B);
    assert.equal((await archive(editor, p)).status, 403);
    await boss.post(`${U}/${idOf(editor)}/sites/${B}/mode`, { mode: "add" });
    assert.equal(modeOf(editor, B), "add");
    assert.notEqual((await archive(editor, p)).status, 403);
    assert.equal(status(p), "archived");
    await boss.post(`${U}/${idOf(editor)}/sites/${B}/mode`, { mode: "limit" });
    const p2 = mkPage(B);
    assert.equal((await archive(editor, p2)).status, 403);
    assert.equal(status(p2), "draft");
  });

  test("seule une personne qui gère les rôles peut poser ou retirer un plafond ; un Super administrateur ne peut pas être plafonné", async () => {
    const target = await person("editor"), lesser = await person("editor");
    await giveSite(target, B, "viewer", "limit");
    assert.equal((await lesser.post(`${U}/${idOf(target)}/sites/${B}/mode`, { mode: "add" })).status, 403);
    assert.equal(modeOf(target, B), "limit", "le plafond est resté");
    const other = await person("owner");
    await giveSite(other, B, "viewer", "limit"); // refusé : Super administrateur
    assert.equal(one("SELECT COUNT(*) n FROM mk_site_members WHERE user_id = ? AND site_id = ?", idOf(other), B).n, 0);
    assert.equal((await lesser.post(`${U}/${idOf(target)}/sites`, { site_id: String(A), role: "viewer", mode: "limit" })).status, 403);
  });

  test("accès limité à un site (sans rôle d'équipe) : inchangé, avec ou sans le mode « limit » ; l'autre site reste fermé", async () => {
    const siteOnly = await person(null), siteOnlyLimit = await person(null);
    await giveSite(siteOnly, A, "editor");
    await giveSite(siteOnlyLimit, A, "editor", "limit");
    const a1 = mkPage(A), a2 = mkPage(A), b1 = mkPage(B);
    assert.notEqual((await archive(siteOnly, a1)).status, 403);
    assert.notEqual((await archive(siteOnlyLimit, a2)).status, 403);
    assert.equal(status(a1), "archived");
    assert.equal(status(a2), "archived");
    assert.equal((await archive(siteOnly, b1)).status, 403);
    assert.equal(status(b1), "draft");
  });

  test("la fiche de la personne indique le plafond et propose de le retirer", async () => {
    const editor = await person("editor");
    await giveSite(editor, B, "viewer", "limit");
    const html = (await boss.get(`${U}/${idOf(editor)}`)).text;
    assert.match(html, /droits plafonnés sur ce site/);
    assert.match(html, /Retirer le plafond/);
  });
});
