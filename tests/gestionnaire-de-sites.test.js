// Palier 1 — Site Manager : création, validation, liste, recherche, filtres, ouverture, réglages, duplication, archivage,
// suppression sécurisée (corbeille), permissions entre comptes — par les vraies routes d'un vrai serveur et la vraie base.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, Client, loginInstructor, newStudent } = require("./helpers");

let srv, boss, db, orgId;
const S = "/marketing/site-web/sites";
const one = (sql, ...a) => db.prepare(sql).get(...a);
const flashOf = (html) => (html.match(/class="mk-flash[^"]*"[^>]*>[\s\S]*?<\/div>/) || [""])[0];
const idFrom = (loc) => Number(loc.match(/(\d+)(#.*)?$/)[1]);
const site = (id) => one("SELECT * FROM mk_sites WHERE id = ?", id);

before(async () => {
  srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
  boss = await loginInstructor(srv);
  db = srv.db();
  orgId = one("SELECT id FROM mk_organizations").id;
});
after(() => srv.stop());

describe("accès, état vide, création", () => {
  test("T1/T18 : le gestionnaire s'ouvre et affiche l'état vide (aucune fausse carte)", async () => {
    const r = await boss.get(S);
    assert.equal(r.status, 200);
    assert.match(r.text, /<h1>Mes sites<\/h1>/);
    assert.match(r.text, /Aucun site actif/);
    assert.match(r.text, /Créer un site/);
  });
  test("T3 : validation du nom, de l'identifiant et du type", async () => {
    let r = await boss.post(S, { name: "  " });
    assert.match(flashOf((await boss.get(S)).text), /nom du site est obligatoire/);
    r = await boss.post(S, { name: "Valide", slug: "Pas Valide!" });
    assert.match(flashOf((await boss.get(S)).text), /Identifiant lisible invalide/);
    r = await boss.post(S, { name: "Valide", site_type: "inconnu" });
    assert.match(flashOf((await boss.get(S)).text), /Type de site inconnu/);
    assert.equal(one("SELECT COUNT(*) n FROM mk_sites").n, 0, "aucun site créé par une saisie invalide");
  });
  test("T2/T4/T5 : création réelle en base, visible dans la liste et après rechargement", async () => {
    const r = await boss.post(S, { name: "Académie Photo", description: "Cours de photo", site_type: "formation" });
    const id = idFrom(r.location);
    const s = site(id);
    assert.equal(s.name, "Académie Photo");
    assert.equal(s.slug, "academie-photo", "identifiant lisible généré");
    assert.equal(s.description, "Cours de photo");
    assert.equal(s.site_type, "formation");
    assert.equal(s.status, "active");
    const html = (await boss.get(S)).text;
    assert.match(html, /Académie Photo/);
    assert.match(html, /academie-photo/);
    assert.match((await boss.get(S)).text, /Académie Photo/, "toujours là après actualisation");
  });
  test("unicité du nom et de l'identifiant", async () => {
    await boss.post(S, { name: "académie photo" });
    assert.match(flashOf((await boss.get(S)).text), /porte déjà ce nom/);
    await boss.post(S, { name: "Autre", slug: "academie-photo" });
    assert.match(flashOf((await boss.get(S)).text), /déjà utilisé/);
    const r = await boss.post(S, { name: "Académie Photo 2", slug: "" });
    assert.notEqual(site(idFrom(r.location)).slug, "academie-photo");
  });
});

describe("recherche, filtres, ouverture, réglages", () => {
  let id;
  before(() => { id = one("SELECT id FROM mk_sites WHERE slug = 'academie-photo'").id; });
  test("T7 : recherche par nom, identifiant et description, sans modifier la base", async () => {
    const before_ = one("SELECT COUNT(*) n, MAX(updated_at) u FROM mk_sites");
    assert.match((await boss.get(`${S}?q=photo`)).text, /Académie Photo/);
    assert.match((await boss.get(`${S}?q=cours%20de`)).text, /Académie Photo/);
    const none = (await boss.get(`${S}?q=zzzz`)).text;
    assert.match(none, /Aucun site ne correspond/);
    assert.doesNotMatch(none, /<code>academie-photo<\/code>/);
    assert.match((await boss.get(`${S}?q=%25_%5C`)).text, /Aucun site ne correspond/, "caractères spéciaux sans effet de joker");
    assert.deepEqual(one("SELECT COUNT(*) n, MAX(updated_at) u FROM mk_sites"), before_);
  });
  test("T9/T10 : ouverture = espace du site identifié, avec retour à la liste", async () => {
    const html = (await boss.get(`${S}/${id}`)).text;
    assert.match(html, /Espace d'administration du site « Académie Photo »/);
    assert.match(html, new RegExp(`n° ${id}`));
    assert.match(html, /href="\/marketing\/site-web\/sites">← Mes sites/);
    assert.match(html, /À venir pour ce site/);
  });
  test("T11/T12 : modification des réglages, identifiant interne stable, persistance", async () => {
    await boss.post(`${S}/${id}`, { name: "Académie Photo Pro", slug: "photo-pro", description: "Nouveau texte", site_type: "blog" });
    const s = site(id);
    assert.deepEqual([s.id, s.name, s.slug, s.description, s.site_type], [id, "Académie Photo Pro", "photo-pro", "Nouveau texte", "blog"]);
    assert.match((await boss.get(`${S}/${id}`)).text, /value="photo-pro"/);
    await boss.post(`${S}/${id}`, { name: "Académie Photo Pro", slug: "x y" });
    assert.match(flashOf((await boss.get(`${S}/${id}`)).text), /Identifiant lisible invalide/);
    assert.equal(site(id).slug, "photo-pro");
  });
  test("anciens sites sans identifiant : attribué au premier affichage", async () => {
    const old = Number(db.prepare("INSERT INTO mk_sites (organization_id, name, tokens) VALUES (?, 'Ancien Site', '{}')").run(orgId).lastInsertRowid);
    assert.equal(site(old).slug, null);
    await boss.get(S);
    assert.equal(site(old).slug, "ancien-site");
  });
});

describe("duplication, archivage, suppression sécurisée", () => {
  let id, copyId;
  before(async () => {
    id = one("SELECT id FROM mk_sites WHERE slug = 'photo-pro'").id;
    await boss.post("/marketing/pages", { name: "Accueil Photo", site_id: String(id) });
  });
  test("T13 : dupliquer la configuration seule, puis avec les pages", async () => {
    let r = await boss.post(`${S}/${id}/dupliquer`, { contenu: "configuration" });
    copyId = idFrom(r.location);
    assert.equal(one("SELECT COUNT(*) n FROM mk_landing_pages WHERE site_id = ?", copyId).n, 0, "aucune page copiée");
    assert.equal(site(copyId).description, "Nouveau texte");
    assert.equal(site(copyId).site_type, "blog");
    assert.notEqual(site(copyId).slug, "photo-pro");
    r = await boss.post(`${S}/${id}/dupliquer`, { contenu: "pages" });
    const withPages = idFrom(r.location);
    assert.equal(one("SELECT COUNT(*) n FROM mk_landing_pages WHERE site_id = ?", withPages).n, 1);
    assert.equal(one("SELECT status FROM mk_landing_pages WHERE site_id = ?", withPages).status, "draft", "pages copiées en brouillon");
  });
  test("T8 : filtres Actifs / Archivés / Supprimés", async () => {
    await boss.post(`${S}/${copyId}/archiver`, {});
    const arch = (await boss.get(`${S}?vue=archives`)).text;
    assert.match(arch, new RegExp(`/sites/${copyId}"`));
    assert.doesNotMatch((await boss.get(`${S}?vue=actifs`)).text, new RegExp(`/sites/${copyId}"`));
    assert.match((await boss.get(`${S}?vue=tous`)).text, new RegExp(`/sites/${copyId}"`));
  });
  test("T14/T16 : suppression impossible sur un site actif, confirmation par le nom, corbeille et récupération", async () => {
    await boss.post(`${S}/${id}/supprimer`, { confirmation: "Académie Photo Pro" });
    assert.match(flashOf((await boss.get(S)).text), /Archivez d(?:'|&#39;)abord/);
    assert.equal(site(id).deleted_at, null);
    await boss.post(`${S}/${copyId}/supprimer`, { confirmation: "mauvais nom" });
    assert.match(flashOf((await boss.get(S)).text), /tapez son nom exact/);
    assert.equal(site(copyId).deleted_at, null);
    const pagesBefore = one("SELECT COUNT(*) n FROM mk_landing_pages").n;
    await boss.post(`${S}/${copyId}/supprimer`, { confirmation: site(copyId).name });
    assert.ok(site(copyId).deleted_at, "suppression logique");
    assert.equal(one("SELECT COUNT(*) n FROM mk_landing_pages").n, pagesBefore, "aucune page effacée");
    assert.doesNotMatch((await boss.get(`${S}?vue=tous`)).text, new RegExp(`/sites/${copyId}"`));
    assert.match((await boss.get(`${S}?vue=supprimes`)).text, new RegExp(`/sites/${copyId}"`));
    await boss.post(`${S}/${copyId}/recuperer`, {});
    assert.equal(site(copyId).deleted_at, null);
    assert.equal(site(copyId).status, "archived", "récupéré mais toujours archivé");
    await boss.post(`${S}/${copyId}/restaurer`, {});
    assert.equal(site(copyId).status, "active");
  });
});

describe("permissions entre comptes (T15)", () => {
  let id, other, member, outsider;
  before(async () => {
    id = one("SELECT id FROM mk_sites WHERE slug = 'photo-pro'").id;
    other = Number(db.prepare("INSERT INTO mk_sites (organization_id, name, slug, tokens) VALUES (?, 'Site Secret', 'secret', '{}')").run(orgId).lastInsertRowid);
    member = await newStudent(srv);
    outsider = await newStudent(srv);
    const uid = one("SELECT id FROM users WHERE email = ?", member.email).id;
    db.prepare("INSERT INTO mk_site_members (site_id, user_id, role) VALUES (?, ?, 'editor')").run(id, uid);
  });
  test("visiteur déconnecté : redirigé vers la connexion", async () => {
    const r = await new Client(srv.base).get(S);
    assert.equal(r.status, 302);
    assert.match(r.location, /connexion/);
  });
  test("compte sans aucun accès : refusé", async () => {
    assert.equal((await outsider.get(S)).status, 403);
    assert.equal((await outsider.post(S, { name: "Pirate" })).status, 403);
    assert.equal(one("SELECT COUNT(*) n FROM mk_sites WHERE name = 'Pirate'").n, 0);
  });
  test("membre d'un seul site : voit son site, pas les autres, ne peut ni créer ni supprimer", async () => {
    const list = await member.get(S);
    assert.equal(list.status, 302);
    assert.equal(list.location, "/marketing/site-web/mes-sites");
    assert.equal((await member.get(`${S}/${id}`)).status, 200);
    assert.equal((await member.get(`${S}/${other}`)).status, 403, "autre site : refusé côté serveur");
    assert.equal((await member.post(S, { name: "Pirate" })).status, 403);
    assert.equal((await member.post(`${S}/${other}/archiver`, {})).status, 403);
    assert.equal(site(other).status, "active");
    await boss.post(`${S}/${id}/archiver`, {});
    assert.equal((await member.post(`${S}/${id}/supprimer`, { confirmation: "Académie Photo Pro" })).status, 403, "suppression réservée à l'équipe");
    assert.equal(site(id).deleted_at, null);
  });
});
