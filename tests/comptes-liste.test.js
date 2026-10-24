// KOLAKISA CMS → Comptes → Tous les comptes : liste réelle (colonnes, recherche, filtre et compteurs par rôle, tri, pagination) et actions groupées.
// Les actions groupées appellent les MÊMES fonctions que la fiche individuelle : garde-fous testés ici (jamais soi-même, jamais plus de droits que soi, jamais le
// dernier Super administrateur, confirmation du retrait, droits exigés côté serveur, personne hors équipe).
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, Client, loginInstructor, newStudent } = require("./helpers");

let srv, boss, db, orgId;
const U = "/marketing/site-web/utilisateurs";
const one = (sql, ...a) => db.prepare(sql).get(...a);
const idOf = (client) => one("SELECT id FROM users WHERE email = ?", client.email).id;
const flashOf = (html) => (html.match(/class="mk-flash[^"]*"[^>]*>[\s\S]*?<\/div>/) || [""])[0].replace(/&#39;/g, "'");
const orgRole = (c) => (one("SELECT role FROM mk_org_members WHERE user_id = ?", idOf(c)) || {}).role;
const person = async (role) => { const c = await newStudent(srv); if (role) db.prepare("INSERT INTO mk_org_members (organization_id, user_id, role) VALUES (?, ?, ?)").run(orgId, idOf(c), role); return c; };
// Champs répétés comme le fait un vrai formulaire (ids=1&ids=2) : une liste de couples, jamais une valeur jointe par des virgules
const bulk = (client, action, targets, extra = {}) => client.post(`${U}/groupe`, [["action", action], ...targets.map((t) => ["ids", String(typeof t === "number" ? t : idOf(t))]), ...Object.entries(extra)], { headers: { referer: `${srv.base}${U}` } });

before(async () => {
  srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
  boss = await loginInstructor(srv); db = srv.db();
  orgId = one("SELECT id FROM mk_organizations").id;
});
after(() => srv.stop());

describe("Tous les comptes : liste", () => {
  test("colonnes réelles : identifiant, nom, e-mail, rôle, statut, articles, inscription ; aucun compte inventé", async () => {
    const a = await person("editor"), id = idOf(a);
    db.prepare("INSERT INTO mk_user_profiles (user_id, first_name, last_name, nickname, display_name) VALUES (?, 'Jeanne', 'Durand', 'jeannette', 'jeannette')").run(id);
    db.prepare("INSERT INTO posts (slug, title, content, content_format, status, published, published_at, author_id) VALUES ('a-1', 'A', 'x', 'html', 'published', 1, datetime('now'), ?)").run(id);
    const html = (await boss.get(U)).text;
    for (const h of ["Identifiant", "Nom", "E-mail", "Rôle", "Statut", "Articles", "Inscription"]) assert.match(html, new RegExp(`<th scope="col"[^>]*>(?:<a [^>]*>)?${h}`), h);
    const row = html.split("<tr>").find((r) => r.includes(a.email));
    assert.ok(row, "la personne est listée");
    assert.match(row, /Jeanne Durand/); assert.match(row, /jeannette/); assert.match(row, /Éditeur/); assert.match(row, /mk-us-num">1</);
    const names = [...html.matchAll(/data-label="E-mail"><a href="mailto:([^"]+)"/g)].map((m) => m[1]);
    const real = db.prepare("SELECT email FROM users u WHERE EXISTS (SELECT 1 FROM mk_org_members m WHERE m.user_id = u.id) OR EXISTS (SELECT 1 FROM mk_site_members s WHERE s.user_id = u.id)").all().map((r) => r.email);
    assert.deepEqual([...names].sort(), [...real].sort(), "la liste = exactement les comptes de l'équipe en base");
  });
  test("recherche par identifiant, nom (e-mail) et e-mail ; filtre par rôle ; compteurs par rôle exacts", async () => {
    const a = await person("author"), b = await person("author"), c = await person("viewer");
    const q = async (qs) => (await boss.get(`${U}?${qs}`)).text;
    assert.ok((await q(`q=${encodeURIComponent(a.email)}`)).includes(a.email));
    assert.ok(!(await q(`q=${encodeURIComponent(a.email)}`)).includes(b.email));
    const byRole = await q("role=viewer");
    assert.ok(byRole.includes(c.email) && !byRole.includes(a.email));
    const html = await q("");
    const n = (key) => one("SELECT COUNT(*) n FROM mk_org_members WHERE role = ?", key).n + one("SELECT COUNT(*) n FROM mk_site_members WHERE role = ? AND user_id NOT IN (SELECT user_id FROM mk_org_members WHERE role = ?)", key, key).n;
    assert.match(html, new RegExp(`Auteur <span>\\(${n("author")}\\)</span>`));
    assert.match(html, new RegExp(`Lecteur <span>\\(${n("viewer")}\\)</span>`));
    assert.match(html, /<a href="[^"]*role=viewer[^"]*">Lecteur/);
  });
  test("tri par e-mail et pagination serveur : les critères sont conservés d'une page à l'autre", async () => {
    for (let i = 0; i < 27; i++) await person("contributor");
    const total = one("SELECT COUNT(*) n FROM users u WHERE EXISTS (SELECT 1 FROM mk_org_members m WHERE m.user_id = u.id)").n;
    const p1 = (await boss.get(`${U}?tri=email&role=contributor`)).text, p2 = (await boss.get(`${U}?tri=email&role=contributor&page=2`)).text;
    const emails = (h) => [...h.matchAll(/data-label="E-mail"><a href="mailto:([^"]+)"/g)].map((m) => m[1]);
    assert.equal(emails(p1).length, 25); assert.ok(emails(p2).length >= 2 && total > 25);
    const sorted = [...emails(p1)].sort((x, y) => x.localeCompare(y, "en", { sensitivity: "base" }));
    assert.deepEqual(emails(p1), sorted, "trié par e-mail");
    assert.match(p1, /href="[^"]*(?=[^"]*tri=email)(?=[^"]*role=contributor)[^"]*page=2"/, "le lien « Suivant » garde tri et rôle");
    assert.ok(!emails(p1).some((e) => emails(p2).includes(e)), "aucun doublon entre les pages");
  });
  test("« Ajouter un compte » mène au formulaire existant (invitation sécurisée)", async () => {
    const html = (await boss.get(U)).text;
    assert.match(html, /href="\/marketing\/site-web\/utilisateurs\/ajouter"[^>]*>[\s\S]*?Ajouter un compte/);
    const form = await boss.get(`${U}/ajouter`);
    assert.equal(form.status, 200); assert.match(form.text, /name="email"/);
  });
  test("sans la permission « voir les utilisateurs », la liste et les actions groupées sont refusées", async () => {
    const v = await person("viewer");
    assert.equal((await v.get(U)).status, 403);
    const t = await person("author");
    assert.equal((await bulk(v, "suspended", [t])).status, 403);
    assert.equal(one("SELECT status FROM users WHERE id = ?", idOf(t)).status, "active");
  });
});

describe("Tous les comptes : actions groupées", () => {
  test("changement de rôle groupé : appliqué à chaque compte coché, journalisé", async () => {
    const a = await person("viewer"), b = await person("viewer"), c = await person("viewer");
    const r = await bulk(boss, "role", [a, b], { role: "editor" });
    assert.equal(r.status, 302);
    assert.deepEqual([orgRole(a), orgRole(b), orgRole(c)], ["editor", "editor", "viewer"]);
    assert.match(flashOf((await boss.get(U)).text), /Changer de rôle : 2 comptes/);
    assert.ok(one("SELECT 1 x FROM mk_audit_logs WHERE action = 'user.role_changed' AND resource_id = ?", String(idOf(a))));
  });
  test("rôle inconnu ou absent : rien n'est modifié", async () => {
    const a = await person("viewer");
    await bulk(boss, "role", [a], { role: "dieu" }); await bulk(boss, "role", [a], {});
    assert.equal(orgRole(a), "viewer");
  });
  test("suspension groupée : statut changé, sessions fermées ; réactivation", async () => {
    const a = await person("author"), b = await person("author");
    assert.equal((await a.get("/marketing/site-web/profil")).status, 200);
    await bulk(boss, "suspended", [a, b]);
    assert.equal(one("SELECT status FROM users WHERE id = ?", idOf(a)).status, "suspended");
    assert.notEqual((await a.get("/marketing/site-web/profil")).status, 200, "la session d'un compte suspendu est fermée");
    await bulk(boss, "active", [a, b]);
    assert.equal(one("SELECT status FROM users WHERE id = ?", idOf(b)).status, "active");
  });
  test("retrait de l'équipe : exige la confirmation ; le compte du site reste", async () => {
    const a = await person("author");
    await bulk(boss, "retirer", [a]);
    assert.equal(orgRole(a), "author", "sans confirmation, rien ne se passe");
    assert.match(flashOf((await boss.get(U)).text), /Confirmez le retrait/);
    await bulk(boss, "retirer", [a], { confirm: "1" });
    assert.equal(orgRole(a), undefined);
    assert.ok(one("SELECT 1 x FROM users WHERE id = ?", idOf(a)), "le compte n'est pas supprimé");
  });
  test("garde-fous : soi-même, plus de droits que soi, dernier Super administrateur, personne hors équipe — les autres comptes cochés sont quand même traités", async () => {
    const admin = await person("admin"), editor = await person("editor"), outsider = await newStudent(srv);
    const bossId = one("SELECT id FROM users WHERE role = 'formateur'").id;
    // un Administrateur ne peut ni se modifier, ni modifier un Super administrateur, ni rendre quelqu'un Super administrateur
    const r = await bulk(admin, "suspended", [admin, bossId, editor, outsider]);
    assert.equal(r.status, 302);
    assert.equal(one("SELECT status FROM users WHERE id = ?", idOf(admin)).status, "active", "pas soi-même");
    assert.equal(one("SELECT status FROM users WHERE id = ?", bossId).status, "active", "pas un niveau supérieur");
    assert.equal(one("SELECT status FROM users WHERE id = ?", idOf(editor)).status, "suspended", "les autres sont traités");
    assert.equal(one("SELECT status FROM users WHERE id = ?", idOf(outsider)).status, "active", "personne hors équipe : intacte");
    const detail = (await admin.get(U)).text;
    assert.match(flashOf(detail), /3?\s*(?:compte|refusé)/);
    await bulk(admin, "role", [editor], { role: "owner" });
    assert.equal(orgRole(editor), "editor", "jamais plus de droits que soi");
    // le seul Super administrateur ne peut ni se suspendre ni se retirer lui-même (et personne d'autre ne peut le faire : voir plus haut)
    await bulk(boss, "suspended", [bossId]); await bulk(boss, "retirer", [bossId], { confirm: "1" });
    assert.equal(one("SELECT status FROM users WHERE id = ?", bossId).status, "active");
    assert.equal(one("SELECT role FROM mk_org_members WHERE user_id = ?", bossId).role, "owner");
    assert.equal(db.prepare("SELECT COUNT(*) n FROM mk_org_members WHERE role = 'owner'").get().n, 1, "il reste toujours un Super administrateur");
  });
  test("droits par action : sans « modifier le statut » ou « attribuer un rôle », l'action est refusée côté serveur", async () => {
    const t = await person("author");
    await boss.post(`${U}/roles`, { name: "Lecture équipe", description: "test", perm: ["users.view"] });
    const key = one("SELECT key FROM mk_roles WHERE name = 'Lecture équipe'").key;
    const lecteur = await person(key);
    const get = await lecteur.get(U);
    assert.equal(get.status, 200, "il voit la liste");
    assert.doesNotMatch(get.text, /data-us-bulk/, "sans droit, la barre d'actions groupées n'est pas proposée");
    for (const [action, extra] of [["suspended", {}], ["role", { role: "editor" }], ["retirer", { confirm: "1" }]]) {
      assert.equal((await bulk(lecteur, action, [t], extra)).status, 403, action);
    }
    assert.equal(orgRole(t), "author"); assert.equal(one("SELECT status FROM users WHERE id = ?", idOf(t)).status, "active");
  });
  test("un compte qui n'a accès qu'à un site ne peut pas utiliser les actions groupées de l'organisation", async () => {
    const siteId = Number(db.prepare("INSERT INTO mk_sites (organization_id, name, tokens) VALUES (?, 'Site groupé', '{}')").run(orgId).lastInsertRowid);
    const so = await person(null), t = await person("author");
    db.prepare("INSERT INTO mk_site_members (site_id, user_id, role) VALUES (?, ?, 'admin')").run(siteId, idOf(so));
    assert.equal((await bulk(so, "suspended", [t])).status, 403);
    assert.equal(one("SELECT status FROM users WHERE id = ?", idOf(t)).status, "active");
  });
  test("saisie hors norme : identifiants non numériques ignorés, liste vide refusée, action inconnue refusée", async () => {
    const t = await person("author");
    for (const body of [[["action", "suspended"]], [["action", "supprimer-tout"], ["ids", String(idOf(t))]], [["action", "suspended"], ["ids", "abc"], ["ids", "1; DROP TABLE users"], ["ids", ""]]]) {
      const r = await boss.post(`${U}/groupe`, body, { headers: { referer: `${srv.base}${U}` } });
      assert.equal(r.status, 302);
    }
    assert.equal(one("SELECT status FROM users WHERE id = ?", idOf(t)).status, "active");
    assert.ok(one("SELECT COUNT(*) n FROM users").n > 0);
  });
});
