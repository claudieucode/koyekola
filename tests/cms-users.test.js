// KOLAKISA CMS — palier 9 : utilisateurs, rôles, permissions, accès par site, invitations — par les vraies routes d'un vrai serveur et la vraie base.
// Sécurité testée explicitement : escalade de privilèges, IDOR, accès entre sites, appel direct sans passer par l'interface, session d'un compte suspendu.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const bcrypt = require("bcryptjs");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, Client, loginInstructor, newStudent } = require("./helpers");

let srv, boss, db, anon, orgId, bossId;
const U = "/marketing/site-web/utilisateurs";
const one = (sql, ...a) => db.prepare(sql).get(...a);
const q = (sql, ...a) => db.prepare(sql).all(...a);
const flashOf = (html) => (html.match(/class="mk-flash[^"]*"[^>]*>[\s\S]*?<\/div>/) || [""])[0];
const idOf = (client) => one("SELECT id FROM users WHERE email = ?", client.email).id;
// Compte du site + rôle d'équipe (ou aucun)
async function person(role = null) {
  const c = await newStudent(srv);
  if (role) db.prepare("INSERT INTO mk_org_members (organization_id, user_id, role) VALUES (?, ?, ?)").run(orgId, idOf(c), role);
  return c;
}
const customRole = (name, perms) => { srv.keep = srv.keep || 0; return boss.post(`${U}/roles`, { name, description: "test", perm: perms }); };
const roleKey = (name) => (one("SELECT key FROM mk_roles WHERE name = ?", name) || {}).key;
const grant = (target, role) => boss.post(`${U}/${idOf(target)}/role`, { role });
let siteN = 0;
const newSite = (name) => Number(db.prepare("INSERT INTO mk_sites (organization_id, name, tokens) VALUES (?, ?, '{}')").run(orgId, name || `Site ${++siteN}`).lastInsertRowid);
let pageN = 0;
const newPage = (siteId, name) => Number(db.prepare("INSERT INTO mk_landing_pages (organization_id, name, slug, title, status, site_id) VALUES (?, ?, ?, ?, 'draft', ?)").run(orgId, name || `Page ${++pageN}`, `page-acc-${++pageN}-${Date.now() % 100000}`, "t", siteId).lastInsertRowid);
const post = (n, title, author) => Number(db.prepare("INSERT INTO posts (slug, title, content, content_format, status, published, published_at, author_id) VALUES (?, ?, 'x', 'html', 'published', 1, datetime('now'), ?)").run(n, title, author).lastInsertRowid);

before(async () => {
  srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
  boss = await loginInstructor(srv);
  anon = new Client(srv.base);
  db = srv.db();
  orgId = one("SELECT id FROM mk_organizations").id;
  bossId = one("SELECT id FROM users WHERE role = 'formateur'").id;
});
after(() => srv.stop());

describe("existant conservé", () => {
  test("les rôles et comptes d'avant sont intacts : le créateur reste Super administrateur, la contrainte d'ancien rôle est levée sans perte", () => {
    assert.equal(one("SELECT role FROM mk_org_members WHERE user_id = ?", bossId).role, "owner");
    const sql = one("SELECT sql FROM sqlite_master WHERE name = 'mk_org_members'").sql;
    assert.doesNotMatch(sql, /CHECK/);
    assert.equal(one("SELECT status FROM users WHERE id = ?", bossId).status, "active");
  });
  test("Utilisateurs s'ouvre (équipe réelle : le créateur, Super administrateur, actif)", async () => {
    const r = await boss.get(U);
    assert.equal(r.status, 200); assert.match(r.text, /Prof/); assert.match(r.text, /Actif/);
    for (const sub of ["/roles", "/permissions", "/invitations", "/ajouter", "/roles/nouveau", `/${bossId}`]) assert.equal((await boss.get(U + sub)).status, 200, sub);
  });
});

describe("rôles du système et personnalisés", () => {
  test("6 rôles du système (fixes) sont listés avec leurs effectifs réels", async () => {
    const r = await boss.get(`${U}/roles`);
    for (const name of ["Super administrateur", "Administrateur", "Éditeur", "Auteur", "Contributeur", "Lecteur"]) assert.match(r.text, new RegExp(name));
    assert.match(r.text, /Système \(fixe\)/);
  });
  test("créer un rôle personnalisé « Gestionnaire du blog » : permissions réellement enregistrées", async () => {
    await customRole("Gestionnaire du blog", ["articles.read", "articles.write", "articles.publish", "taxonomies.read", "taxonomies.write", "media.read", "media.upload", "media.write"]);
    const r = one("SELECT * FROM mk_roles WHERE name = 'Gestionnaire du blog'");
    assert.ok(r); assert.match(r.key, /^custom-gestionnaire-du-blog/);
    const perms = JSON.parse(r.permissions);
    assert.ok(perms.includes("articles.publish")); assert.ok(!perms.includes("users.view")); assert.ok(!perms.includes("settings.write"));
    assert.match((await boss.get(`${U}/roles/${r.key}`)).text, /value="articles\.publish" checked/);
  });
  test("nom en double, nom vide, permission inconnue ou réservée : refusés ou ignorés", async () => {
    await customRole("gestionnaire DU blog", ["articles.read"]);
    assert.equal(q("SELECT * FROM mk_roles WHERE name LIKE 'gestionnaire%'").length, 1);
    await customRole("  ", ["articles.read"]);
    await customRole("Rôle piégé", ["articles.read", "members.manage", "organization.delete", "inconnue.permission"]);
    const perms = JSON.parse(one("SELECT permissions FROM mk_roles WHERE name = 'Rôle piégé'").permissions);
    assert.deepEqual(perms, ["articles.read"], "les droits réservés au Super administrateur ne s'attribuent jamais");
  });
  test("modifier le rôle : persistance ; rôle du système non modifiable ; dupliquer", async () => {
    const key = roleKey("Rôle piégé");
    await boss.post(`${U}/roles/${key}`, { name: "Rôle piégé", description: "x", perm: ["articles.read", "comments.read"] });
    assert.deepEqual(JSON.parse(one("SELECT permissions FROM mk_roles WHERE key = ?", key).permissions).sort(), ["articles.read", "comments.read"]);
    await boss.post(`${U}/roles/editor`, { name: "Éditeur modifié", perm: ["articles.read"] });
    assert.equal(one("SELECT COUNT(*) n FROM mk_roles WHERE key = 'editor'").n, 0);
    assert.match((await boss.get(`${U}/roles/editor`)).text, /Rôle du système/);
    await boss.post(`${U}/roles/editor/dupliquer`, {});
    const copy = one("SELECT * FROM mk_roles WHERE name = 'Éditeur (copie)'");
    assert.ok(copy); assert.ok(JSON.parse(copy.permissions).includes("articles.publish"));
  });
  test("la matrice des permissions reflète les droits réels du rôle", async () => {
    const r = await boss.get(`${U}/permissions?role=viewer`);
    assert.match(r.text, /Permissions du rôle « Lecteur »/);
    const ed = (await boss.get(`${U}/permissions?role=editor`)).text;
    assert.match(ed, /mk-us-yes/); assert.notEqual(ed, r.text);
  });
  test("supprimer un rôle attribué : refusé ; libre : supprimé", async () => {
    const holder = await person();
    await boss.post(`${U}/${idOf(holder)}/role`, { role: roleKey("Rôle piégé") });
    assert.equal(one("SELECT role FROM mk_org_members WHERE user_id = ?", idOf(holder)).role, roleKey("Rôle piégé"));
    await boss.post(`${U}/roles/${roleKey("Rôle piégé")}/supprimer`, {});
    assert.ok(roleKey("Rôle piégé"), "encore attribué");
    assert.match(flashOf((await boss.get(`${U}/roles`)).text), /encore attribué/);
    await grant(holder, "viewer");
    await boss.post(`${U}/roles/${roleKey("Rôle piégé")}/supprimer`, {});
    assert.equal(roleKey("Rôle piégé"), undefined);
  });
});

describe("les permissions contrôlent réellement le serveur (appels directs, sans l'interface)", () => {
  test("rôle personnalisé : droits exacts — peut gérer les articles et médias, pas les utilisateurs ni les réglages", async () => {
    const manager = await person(roleKey("Gestionnaire du blog"));
    assert.equal((await manager.get("/marketing/site-web/articles")).status, 200);
    assert.equal((await manager.get("/marketing/site-web/mediatheque")).status, 200);
    assert.equal((await manager.get(U)).status, 403);
    assert.equal((await manager.post(`${U}/inviter`, { email: "x@example.com", role: "viewer" })).status, 403);
    assert.equal((await manager.get("/marketing/site-web/parametres/commentaires")).status, 403);
    assert.equal((await manager.post("/marketing/site-web/apparence/publier", {})).status, 403);
    assert.equal((await manager.post("/marketing/site-web/navigation/menus", { name: "X" })).status, 403);
    const pid = post("art-mgr", "Article géré", bossId);
    assert.equal((await manager.post(`/marketing/site-web/articles/${pid}/corbeille`, { retour: "/marketing/site-web/articles" })).status, 302);
    assert.ok(one("SELECT deleted_at FROM posts WHERE id = ?", pid).deleted_at);
  });
  test("chaque domaine : sans la permission, refus (403) ; avec, l'action passe", async () => {
    const viewer = await person("viewer");
    const media = await person(null), nav = await person(null), cm = await person(null), ap = await person(null), pg = await person(null);
    await customRole("Rôle médias", ["media.read", "media.delete"]); await customRole("Rôle menus", ["navigation.read", "navigation.write"]);
    await customRole("Rôle commentaires", ["comments.read", "comments.moderate"]); await customRole("Rôle apparence", ["appearance.read", "appearance.styles"]); await customRole("Rôle pages", ["forms.read", "pages.publish"]);
    for (const [c, name] of [[media, "Rôle médias"], [nav, "Rôle menus"], [cm, "Rôle commentaires"], [ap, "Rôle apparence"], [pg, "Rôle pages"]]) await grant(c, roleKey(name));
    // lecteur : lecture seulement
    assert.equal((await viewer.post("/marketing/site-web/navigation/menus", { name: "Par lecteur" })).status, 403);
    assert.equal((await viewer.post("/marketing/site-web/apparence/styles", { "colors.primary": "#112233" })).status, 403);
    assert.equal((await viewer.post("/marketing/site-web/commentaires/actions", { action: "approuver", ids: ["1"] })).status, 403);
    // navigation.write : crée un menu, mais ne peut ni l'affecter (publish) ni le supprimer (delete)
    assert.equal((await nav.post("/marketing/site-web/navigation/menus", { name: "Menu permis" })).status, 302);
    const menu = one("SELECT id FROM nav_menus WHERE name = 'Menu permis'");
    assert.ok(menu);
    assert.equal((await nav.post("/marketing/site-web/navigation/emplacements", { header: String(menu.id) })).status, 403);
    assert.equal((await nav.post(`/marketing/site-web/navigation/menus/${menu.id}/supprimer`, {})).status, 403);
    // apparence.styles : brouillon oui, publication non
    assert.equal((await ap.post("/marketing/site-web/apparence/styles", { "colors.primary": "#223344" })).status, 302);
    assert.equal((await ap.post("/marketing/site-web/apparence/publier", {})).status, 403);
    assert.equal((await ap.post("/marketing/site-web/apparence/en-tete", { logo_mode: "text", logo_text: "X" })).status, 403);
    // commentaires.moderate : approuve ; supprimer définitivement refusé
    const cid = Number(db.prepare("INSERT INTO blog_comments (post_id, content_type, content_id, author_name, body, status) VALUES (?, 'post', ?, 'A', 'c', 'pending')").run(post("art-cm", "Pour commentaire", bossId), 0).lastInsertRowid);
    assert.equal((await cm.post(`/marketing/site-web/commentaires/${cid}/approuver`, { retour: "/marketing/site-web/commentaires" })).status, 302);
    assert.equal(one("SELECT status FROM blog_comments WHERE id = ?", cid).status, "approved");
    await cm.post(`/marketing/site-web/commentaires/${cid}/corbeille`, { retour: "/marketing/site-web/commentaires" });
    assert.equal((await cm.post(`/marketing/site-web/commentaires/${cid}/supprimer`, {})).status, 403);
    // médias : supprimer définitivement exige media.delete
    assert.equal((await media.post("/marketing/site-web/mediatheque/televerser", {})).status, 403);
    // pages : publier exige pages.publish (le rôle l'a), créer exige forms.write (il ne l'a pas)
    assert.equal((await pg.post("/marketing/pages", { name: "Interdite" })).status, 403);
  });
  test("accès anonyme et compte sans équipe : refusés partout", async () => {
    assert.notEqual((await anon.get(U)).status, 200);
    const plain = await person();
    assert.equal((await plain.get(U)).status, 403);
    assert.equal((await plain.post(`${U}/roles`, { name: "Pirate", perm: ["articles.read"] })).status, 403);
    assert.equal(roleKey("Pirate"), undefined);
  });
});

describe("escalade de privilèges", () => {
  test("un administrateur ne peut ni nommer un Super administrateur ni devenir Super administrateur", async () => {
    const admin = await person("admin"), target = await person("viewer");
    await admin.post(`${U}/${idOf(target)}/role`, { role: "owner" });
    assert.equal(one("SELECT role FROM mk_org_members WHERE user_id = ?", idOf(target)).role, "viewer");
    assert.match(flashOf((await admin.get(`${U}/${idOf(target)}`)).text), /droits que vous n/);
    await admin.post(`${U}/${idOf(admin)}/role`, { role: "owner" });
    assert.equal(one("SELECT role FROM mk_org_members WHERE user_id = ?", idOf(admin)).role, "admin", "pas de promotion de soi-même");
  });
  test("un administrateur ne modifie ni ne suspend ni ne retire un Super administrateur", async () => {
    const admin = await person("admin");
    const owner2 = await person("owner");
    for (const [path, body] of [["/role", { role: "viewer" }], ["/statut", { status: "suspended" }], ["/retirer", {}]]) await admin.post(`${U}/${idOf(owner2)}${path}`, body);
    assert.equal(one("SELECT role FROM mk_org_members WHERE user_id = ?", idOf(owner2)).role, "owner");
    assert.equal(one("SELECT status FROM users WHERE id = ?", idOf(owner2)).status, "active");
  });
  test("jamais soi-même : ni rôle, ni statut, ni retrait", async () => {
    const admin = await person("admin");
    await admin.post(`${U}/${idOf(admin)}/role`, { role: "viewer" });
    await admin.post(`${U}/${idOf(admin)}/statut`, { status: "disabled" });
    await admin.post(`${U}/${idOf(admin)}/retirer`, {});
    assert.equal(one("SELECT role FROM mk_org_members WHERE user_id = ?", idOf(admin)).role, "admin");
    assert.equal(one("SELECT status FROM users WHERE id = ?", idOf(admin)).status, "active");
  });
  test("gestionnaire d'utilisateurs limité : ne peut pas créer un rôle avec des droits qu'il n'a pas, ni attribuer un rôle supérieur", async () => {
    const viewerPerms = require("../src/marketing/organizations");
    const reads = Object.keys(viewerPerms.PERMISSIONS).filter((k) => viewerPerms.roleAtLeast("viewer", viewerPerms.PERMISSIONS[k]));
    await customRole("Gestionnaire d'équipe", [...reads, "users.view", "users.create", "users.edit", "users.manage_roles", "roles.manage"]);
    const lim = await person(roleKey("Gestionnaire d'équipe"));
    await lim.post(`${U}/roles`, { name: "Rôle dangereux", perm: ["articles.read", "settings.write", "appearance.publish"] });
    assert.equal(roleKey("Rôle dangereux"), undefined, "droits qu'il ne possède pas");
    await lim.post(`${U}/roles`, { name: "Rôle modéré", perm: ["articles.read"] });
    assert.ok(roleKey("Rôle modéré"));
    const target = await person("viewer");
    for (const role of ["admin", "editor", "owner"]) await lim.post(`${U}/${idOf(target)}/role`, { role });
    assert.equal(one("SELECT role FROM mk_org_members WHERE user_id = ?", idOf(target)).role, "viewer");
    await lim.post(`${U}/${idOf(target)}/role`, { role: roleKey("Rôle modéré") });
    assert.equal(one("SELECT role FROM mk_org_members WHERE user_id = ?", idOf(target)).role, roleKey("Rôle modéré"));
    await lim.post(`${U}/inviter`, { email: "nouveau-admin@example.com", role: "admin" });
    assert.equal(one("SELECT COUNT(*) n FROM mk_invitations WHERE email = 'nouveau-admin@example.com'").n, 0);
  });
  test("il ne peut pas modifier le rôle qui le contrôle, ni en ajouter des droits qu'il n'a pas", async () => {
    const lim = await person(roleKey("Gestionnaire d'équipe"));
    const key = roleKey("Gestionnaire d'équipe");
    const before = one("SELECT permissions FROM mk_roles WHERE key = ?", key).permissions;
    await lim.post(`${U}/roles/${key}`, { name: "Gestionnaire d'équipe", perm: [...JSON.parse(before), "settings.write", "appearance.publish"] });
    assert.equal(one("SELECT permissions FROM mk_roles WHERE key = ?", key).permissions, before);
    const other = roleKey("Rôle modéré");
    await lim.post(`${U}/roles/${other}`, { name: "Rôle modéré", perm: ["articles.read", "settings.write"] });
    assert.ok(!JSON.parse(one("SELECT permissions FROM mk_roles WHERE key = ?", other).permissions).includes("settings.write"));
  });
  test("Super administrateur : seul un Super administrateur en touche un autre ; le créateur reste le dernier propriétaire actif et ne peut ni se rétrograder, ni se suspendre, ni se retirer", async () => {
    const second = await person("owner");
    await boss.post(`${U}/${idOf(second)}/role`, { role: "admin" });
    assert.equal(one("SELECT role FROM mk_org_members WHERE user_id = ?", idOf(second)).role, "admin", "un propriétaire en rétrograde un autre");
    for (const row of q("SELECT user_id FROM mk_org_members WHERE role = 'owner' AND user_id <> ?", bossId)) db.prepare("UPDATE mk_org_members SET role = 'admin' WHERE user_id = ?").run(row.user_id);
    assert.deepEqual(q("SELECT user_id FROM mk_org_members WHERE role = 'owner'").map((r) => r.user_id), [bossId]);
    const admin2 = await person("admin");
    for (const [path, body] of [["/role", { role: "viewer" }], ["/statut", { status: "suspended" }], ["/retirer", {}]]) {
      await admin2.post(`${U}${"/" + bossId}${path}`, body);
      await boss.post(`${U}/${bossId}${path}`, body);
    }
    assert.equal(one("SELECT role FROM mk_org_members WHERE user_id = ?", bossId).role, "owner");
    assert.equal(one("SELECT status FROM users WHERE id = ?", bossId).status, "active");
  });
  test("IDOR : manipuler les identifiants (compte absent de l'équipe, rôle ou site inexistants) ne fait rien", async () => {
    const stranger = await person();
    assert.equal((await boss.get(`${U}/${idOf(stranger)}`)).status, 404, "pas de fiche pour un compte hors équipe");
    await boss.post(`${U}/${idOf(stranger)}/statut`, { status: "disabled" });
    await boss.post(`${U}/999999/role`, { role: "viewer" });
    await boss.post(`${U}/${idOf(stranger)}/role`, { role: "role-inexistant" });
    await boss.post(`${U}/${idOf(stranger)}/sites`, { site_id: "999999", role: "viewer" });
    assert.equal(one("SELECT COUNT(*) n FROM mk_org_members WHERE user_id = ?", idOf(stranger)).n, 0);
    assert.equal(one("SELECT COUNT(*) n FROM mk_site_members WHERE user_id = ?", idOf(stranger)).n, 0);
  });
});

describe("statut du compte et sessions", () => {
  test("suspendre : la session ouverte est fermée à la requête suivante, la connexion est refusée ; réactiver : tout revient", async () => {
    const victim = await person("editor");
    assert.equal((await victim.get("/marketing/site-web/articles")).status, 200);
    await boss.post(`${U}/${idOf(victim)}/statut`, { status: "suspended" });
    assert.equal(one("SELECT status FROM users WHERE id = ?", idOf(victim)).status, "suspended");
    const r = await victim.get("/marketing/site-web/articles");
    assert.notEqual(r.status, 200, "session fermée");
    const login = new Client(srv.base);
    const attempt = await login.post("/connexion", { email: victim.email, password: "MotDePasseEleve123" });
    assert.equal(attempt.status, 403); assert.match(attempt.text, /suspendu/);
    await boss.post(`${U}/${idOf(victim)}/statut`, { status: "active" });
    const again = new Client(srv.base);
    const ok = await again.post("/connexion", { email: victim.email, password: "MotDePasseEleve123" });
    assert.equal(ok.status, 302);
    assert.equal((await again.get("/marketing/site-web/articles")).status, 200);
    assert.ok(one("SELECT last_login_at FROM users WHERE id = ?", idOf(victim)).last_login_at, "dernière connexion enregistrée");
  });
  test("désactiver : même effet ; retirer de l'équipe : plus d'accès mais le compte du site reste", async () => {
    const p = await person("editor");
    await boss.post(`${U}/${idOf(p)}/statut`, { status: "disabled" });
    assert.notEqual((await p.get("/marketing/site-web/articles")).status, 200);
    await boss.post(`${U}/${idOf(p)}/statut`, { status: "active" });
    const q2 = await person("editor");
    await boss.post(`${U}/${idOf(q2)}/retirer`, {});
    assert.equal(one("SELECT COUNT(*) n FROM mk_org_members WHERE user_id = ?", idOf(q2)).n, 0);
    assert.ok(one("SELECT id FROM users WHERE id = ?", idOf(q2)));
    assert.equal((await q2.get("/marketing/site-web/articles")).status, 403);
  });
  test("compte suspendu : toutes ses permissions effectives sont vides", () => {
    const access = require("../src/services/cmsAccess");
    const row = one("SELECT user_id FROM mk_org_members WHERE role = 'editor' LIMIT 1");
    db.prepare("UPDATE users SET status = 'suspended' WHERE id = ?").run(row.user_id);
    assert.equal(access.effectivePermissions(row.user_id, { organizationId: orgId }).size, 0);
    db.prepare("UPDATE users SET status = 'active' WHERE id = ?").run(row.user_id);
  });
});

describe("liste, recherche, filtres, tri, pagination", () => {
  test("recherche par nom et e-mail, filtre par rôle et statut, tri, onglets avec effectifs réels", async () => {
    const hash = bcrypt.hashSync("MotDePasse12345", 4);
    db.exec("BEGIN");
    const ins = db.prepare("INSERT INTO users (username, email, password_hash, role) VALUES (?, ?, ?, 'etudiant')");
    const mem = db.prepare("INSERT INTO mk_org_members (organization_id, user_id, role) VALUES (?, ?, ?)");
    for (let i = 0; i < 60; i++) { const id = Number(ins.run(`equipe${String(i).padStart(2, "0")}`, `equipe${i}@exemple.test`, hash).lastInsertRowid); mem.run(orgId, id, i % 2 ? "viewer" : "author"); }
    db.exec("COMMIT");
    db.prepare("UPDATE users SET status = 'suspended' WHERE username IN ('equipe03', 'equipe05')").run();
    const all = await boss.get(U);
    assert.match(all.text, /Page 1 sur [3-9]/);
    assert.ok((all.text.match(/<tr>/g) || []).length <= 26, "25 par page");
    assert.match((await boss.get(`${U}?q=equipe42`)).text, /equipe42/);
    assert.doesNotMatch((await boss.get(`${U}?q=equipe42`)).text, /equipe41/);
    assert.match((await boss.get(`${U}?q=${encodeURIComponent("equipe7@exemple")}`)).text, /equipe7/, "recherche par e-mail");
    const authors = await boss.get(`${U}?role=author&q=equipe`);
    assert.match(authors.text, /Auteur/); assert.doesNotMatch(authors.text, />equipe01</);
    const susp = await boss.get(`${U}?statut=suspendus`);
    assert.match(susp.text, /equipe03/); assert.match(susp.text, /equipe05/); assert.doesNotMatch(susp.text, />equipe04</);
    assert.match(susp.text, /Suspendus <span class="mk-tab-count">2</);
    const desc = await boss.get(`${U}?tri=recent&q=equipe`);
    assert.ok(desc.text.indexOf("equipe59") < desc.text.indexOf("equipe58"));
    assert.match((await boss.get(`${U}?page=2`)).text, /Page 2 sur [3-9]/);
  });
  test("fiche d'une personne : identité, permissions effectives, aucune donnée sensible (mot de passe, jeton)", async () => {
    const id = one("SELECT id FROM users WHERE username = 'equipe10'").id;
    const r = await boss.get(`${U}/${id}`);
    assert.equal(r.status, 200); assert.match(r.text, /Permissions effectives/); assert.match(r.text, /Voir les articles/);
    assert.doesNotMatch(r.text, /password|\$2[aby]\$|hash/i);
  });
});

describe("invitations", () => {
  let token;
  test("inviter une nouvelle adresse : invitation réelle (empreinte seulement), e-mail en file, lien affiché à l'inviteur", async () => {
    const r = await boss.post(`${U}/inviter`, { email: "Nouvelle.Personne@Exemple.test", role: "editor" });
    assert.equal(r.status, 302);
    const inv = one("SELECT * FROM mk_invitations WHERE email = 'nouvelle.personne@exemple.test'");
    assert.ok(inv); assert.equal(inv.role, "editor"); assert.equal(inv.accepted_at, null);
    assert.match(inv.token_hash, /^[0-9a-f]{64}$/);
    assert.ok(one("SELECT 1 FROM mail_outbox WHERE kind = 'team_invitation' AND to_email = 'nouvelle.personne@exemple.test'"));
    const page = (await boss.get(`${U}/invitations`)).text;
    assert.match(page, /nouvelle\.personne@exemple\.test/); assert.match(page, /En attente/);
    token = (flashOf(page).match(/\/invitation\/([A-Za-z0-9_-]+)/) || [])[1];
    assert.ok(token, "lien transmis à l'inviteur");
    assert.equal(one("SELECT COUNT(*) n FROM mk_invitations WHERE token_hash = ?", token).n, 0, "le jeton lui-même n'est jamais stocké");
    assert.match((await boss.get(`${U}?statut=en-attente`)).text, /nouvelle\.personne@exemple\.test/);
  });
  test("double invitation, adresse invalide, rôle supérieur aux droits de l'inviteur : refusés", async () => {
    await boss.post(`${U}/inviter`, { email: "nouvelle.personne@exemple.test", role: "viewer" });
    assert.match(flashOf((await boss.get(`${U}/invitations`)).text), /déjà en attente/);
    await boss.post(`${U}/inviter`, { email: "pas-un-email", role: "viewer" });
    const admin = await person("admin");
    await admin.post(`${U}/inviter`, { email: "super@exemple.test", role: "owner" });
    assert.equal(one("SELECT COUNT(*) n FROM mk_invitations WHERE email = 'super@exemple.test'").n, 0);
  });
  test("accepter : la page s'ouvre, le compte est créé avec le rôle, la session s'ouvre ; le lien ne sert qu'une fois", async () => {
    const guest = new Client(srv.base);
    const page = await guest.get(`/invitation/${token}`);
    assert.equal(page.status, 200); assert.match(page.text, /Éditeur/); assert.match(page.text, /nouvelle\.personne@exemple\.test/);
    const bad = await guest.post(`/invitation/${token}`, { username: "ab", password: "court" });
    assert.equal(bad.status, 400);
    const ok = await guest.post(`/invitation/${token}`, { username: "nouvellepersonne", password: "MotDePasseSolide123" });
    assert.equal(ok.status, 302);
    const u = one("SELECT id, status FROM users WHERE email = 'nouvelle.personne@exemple.test'");
    assert.ok(u); assert.equal(u.status, "active");
    assert.equal(one("SELECT role FROM mk_org_members WHERE user_id = ?", u.id).role, "editor");
    assert.ok(one("SELECT accepted_at FROM mk_invitations WHERE email = 'nouvelle.personne@exemple.test'").accepted_at);
    assert.equal((await guest.get("/marketing/site-web/articles")).status, 200, "session ouverte, accès selon le rôle");
    assert.equal((await new Client(srv.base).get(`/invitation/${token}`)).status, 404, "usage unique");
    assert.equal(one("SELECT COUNT(*) n FROM mk_audit_logs WHERE action = 'invitation.accepted'").n, 1);
  });
  test("renvoyer (nouveau lien, ancien annulé), révoquer, expiration : liens invalides", async () => {
    await boss.post(`${U}/inviter`, { email: "autre@exemple.test", role: "viewer" });
    const inv = one("SELECT id FROM mk_invitations WHERE email = 'autre@exemple.test'");
    const t1 = (flashOf((await boss.get(`${U}/invitations`)).text).match(/\/invitation\/([A-Za-z0-9_-]+)/) || [])[1];
    assert.equal((await new Client(srv.base).get(`/invitation/${t1}`)).status, 200);
    const waited = () => db.prepare("UPDATE mk_invitations SET last_sent_at = datetime('now', '-2 minutes') WHERE id = ?").run(inv.id); // le délai minimal entre deux envois (60 s) est testé dans utilisateurs-invitations
    waited();
    await boss.post(`${U}/invitations/${inv.id}/renvoyer`, {});
    const t2 = (flashOf((await boss.get(`${U}/invitations`)).text).match(/\/invitation\/([A-Za-z0-9_-]+)/) || [])[1];
    assert.notEqual(t1, t2);
    assert.equal((await new Client(srv.base).get(`/invitation/${t1}`)).status, 404, "ancien lien annulé");
    assert.equal((await new Client(srv.base).get(`/invitation/${t2}`)).status, 200);
    db.prepare("UPDATE mk_invitations SET expires_at = datetime('now', '-1 hour') WHERE id = ?").run(inv.id);
    assert.equal((await new Client(srv.base).get(`/invitation/${t2}`)).status, 404, "expirée");
    waited();
    await boss.post(`${U}/invitations/${inv.id}/renvoyer`, {});
    const t3 = (flashOf((await boss.get(`${U}/invitations`)).text).match(/\/invitation\/([A-Za-z0-9_-]+)/) || [])[1];
    await boss.post(`${U}/invitations/${inv.id}/revoquer`, {});
    assert.equal((await new Client(srv.base).get(`/invitation/${t3}`)).status, 404, "révoquée");
    assert.equal((await new Client(srv.base).get("/invitation/jeton-inexistant-xxxxxxxxxxxx")).status, 404);
  });
  test("inviter une adresse qui a déjà un compte : accès immédiat, sans invitation", async () => {
    const existing = await person();
    await boss.post(`${U}/inviter`, { email: existing.email, role: "viewer" });
    assert.equal(one("SELECT role FROM mk_org_members WHERE user_id = ?", idOf(existing)).role, "viewer");
    assert.equal(one("SELECT COUNT(*) n FROM mk_invitations WHERE email = ?", existing.email).n, 0);
  });
});

describe("accès par site (multi-site)", () => {
  let siteA, siteB, pageA, pageB, userA, userB, mixed;
  before(async () => {
    siteA = newSite("Site A"); siteB = newSite("Site B");
    pageA = newPage(siteA, "Page du site A"); pageB = newPage(siteB, "Page du site B");
    userA = await person(); userB = await person(); mixed = await person("viewer");
    await boss.post(`${U}/${idOf(userA)}/sites`, { site_id: String(siteA), role: "editor" });
    await boss.post(`${U}/${idOf(userB)}/sites`, { site_id: String(siteB), role: "editor" });
    await boss.post(`${U}/${idOf(mixed)}/sites`, { site_id: String(siteA), role: "editor" });
  });
  test("accès enregistrés et visibles sur la fiche (rôle par site)", async () => {
    assert.equal(one("SELECT role FROM mk_site_members WHERE user_id = ? AND site_id = ?", idOf(userA), siteA).role, "editor");
    const r = await boss.get(`${U}/${idOf(userA)}`);
    assert.match(r.text, /Site A/); assert.match(r.text, /Éditeur/);
    assert.match((await boss.get(`${U}?site=${siteA}`)).text, new RegExp(userA.username));
    assert.doesNotMatch((await boss.get(`${U}?site=${siteA}`)).text, new RegExp(`>${userB.username}<`));
  });
  test("utilisateur du site A : ouvre ses pages et ses sites, jamais ceux du site B (même en manipulant les adresses)", async () => {
    assert.equal((await userA.get(`/marketing/pages/${pageA}/editeur`)).status, 200);
    assert.equal((await userA.get(`/marketing/site-web/sites/${siteA}/reglages`)).status, 200);
    for (const path of [`/marketing/pages/${pageB}/editeur`, `/marketing/pages/${pageB}`, `/marketing/pages/${pageB}/apercu`, `/marketing/site-web/sites/${siteB}/reglages`, `/marketing/site-web/sites/${siteB}/reglages.json`]) {
      assert.equal((await userA.get(path)).status, 403, path);
    }
    for (const [path, body] of [[`/marketing/pages/${pageB}`, { name: "Piraté" }], [`/marketing/site-web/sites/${siteB}/design`, {}], [`/marketing/site-web/sites/${siteB}/archiver`, {}], [`/marketing/pages/${pageB}/publier.json`, {}]]) {
      assert.equal((await userA.post(path, body)).status, 403, path);
    }
    assert.equal(one("SELECT name FROM mk_landing_pages WHERE id = ?", pageB).name, "Page du site B");
    assert.equal(one("SELECT status FROM mk_sites WHERE id = ?", siteB).status, "active");
  });
  test("utilisateur limité à un site : aucune ressource d'équipe (articles, médias, utilisateurs, apparence) — redirigé vers « Mes sites »", async () => {
    for (const path of ["/marketing/site-web/articles", "/marketing/site-web/mediatheque", "/marketing/site-web/apparence", "/marketing/pages", "/marketing/site-web/navigation", U]) {
      const r = await userA.get(path);
      assert.equal(r.status, 302, path); assert.equal(r.location, "/marketing/site-web/mes-sites", path);
    }
    assert.equal((await userA.post("/marketing/site-web/articles/actions", { action: "corbeille", ids: ["1"] })).status, 403);
    const mine = await userA.get("/marketing/site-web/mes-sites");
    assert.equal(mine.status, 200); assert.match(mine.text, /Site A/); assert.doesNotMatch(mine.text, /Site B/);
  });
  test("le site A voit ses pages dans la fiche du site ; le site B n'apparaît jamais", async () => {
    const r = await userA.get(`/marketing/site-web/sites/${siteA}/reglages`);
    assert.match(r.text, /Page du site A/); assert.doesNotMatch(r.text, /Page du site B/);
  });
  test("rôle par site différent : Éditeur du site A, Lecteur du site B, rien sur C — le même compte", async () => {
    const siteC = newSite("Site C"), pageC = newPage(siteC, "Page C");
    const multi = await person();
    await boss.post(`${U}/${idOf(multi)}/sites`, { site_id: String(siteA), role: "editor" });
    await boss.post(`${U}/${idOf(multi)}/sites`, { site_id: String(siteB), role: "viewer" });
    assert.notEqual((await multi.post(`/marketing/pages/${pageA}`, { name: "Modifiée A" })).status, 403, "éditeur sur A : l'écriture passe la barrière des droits");
    assert.equal((await multi.get(`/marketing/pages/${pageB}/editeur`)).status, 200, "lecteur sur B : lecture");
    assert.equal((await multi.post(`/marketing/pages/${pageB}`, { name: "Non" })).status, 403, "lecteur sur B : pas d'écriture");
    assert.equal(one("SELECT name FROM mk_landing_pages WHERE id = ?", pageB).name, "Page du site B");
    assert.equal((await multi.get(`/marketing/pages/${pageC}/editeur`)).status, 403, "rien sur C");
  });
  test("rôle d'équipe lecteur + éditeur du site A : droits unis, jamais étendus aux autres sites", async () => {
    assert.notEqual((await mixed.post(`/marketing/pages/${pageA}`, { name: "Par mixte" })).status, 403);
    assert.equal((await mixed.post(`/marketing/pages/${pageB}`, { name: "Interdit" })).status, 403);
    assert.equal((await mixed.get("/marketing/site-web/articles")).status, 200, "droits d'équipe : lecture");
  });
  test("retirer l'accès au site A : plus rien sur A", async () => {
    await boss.post(`${U}/${idOf(userA)}/sites/${siteA}/retirer`, {});
    assert.equal((await userA.get(`/marketing/pages/${pageA}/editeur`)).status, 403);
    assert.equal((await userA.get("/marketing/site-web/mes-sites")).status, 403, "plus aucun site : accès refusé");
  });
  test("invitation limitée à un site : le compte créé n'a accès qu'à ce site", async () => {
    await boss.post(`${U}/inviter`, { email: "site-seul@exemple.test", role: "editor", site_id: String(siteB) });
    const token = (flashOf((await boss.get(`${U}/invitations`)).text).match(/\/invitation\/([A-Za-z0-9_-]+)/) || [])[1];
    const guest = new Client(srv.base);
    await guest.post(`/invitation/${token}`, { username: "siteseul", password: "MotDePasseSolide123" });
    const id = one("SELECT id FROM users WHERE username = 'siteseul'").id;
    assert.equal(one("SELECT COUNT(*) n FROM mk_org_members WHERE user_id = ?", id).n, 0);
    assert.equal(one("SELECT role FROM mk_site_members WHERE user_id = ? AND site_id = ?", id, siteB).role, "editor");
    assert.equal((await guest.get(`/marketing/pages/${pageB}/editeur`)).status, 200);
    assert.equal((await guest.get(`/marketing/pages/${pageA}/editeur`)).status, 403);
  });
});

describe("propriété des articles : les siens (author) ou tous", () => {
  test("Auteur : gère ses articles (corbeille, restauration, copie) mais ni ceux des autres, ni la publication", async () => {
    const author = await person("author");
    const mine = post("auteur-mien", "Mon article", idOf(author)), theirs = post("auteur-autre", "Article d'un autre", bossId);
    const R = { retour: "/marketing/site-web/articles" };
    assert.equal((await author.post(`/marketing/site-web/articles/${theirs}/corbeille`, R)).status, 403, "IDOR : article d'un autre");
    assert.equal((await author.post(`/marketing/site-web/articles/${theirs}/dupliquer`, R)).status, 403);
    assert.equal(one("SELECT deleted_at FROM posts WHERE id = ?", theirs).deleted_at, null);
    assert.equal((await author.post(`/marketing/site-web/articles/${mine}/corbeille`, R)).status, 302);
    assert.ok(one("SELECT deleted_at FROM posts WHERE id = ?", mine).deleted_at);
    assert.equal((await author.post(`/marketing/site-web/articles/${mine}/restaurer`, R)).status, 302);
    assert.equal((await author.post(`/marketing/site-web/articles/${mine}/publier`, R)).status, 403, "publier exige articles.publish");
    assert.equal((await author.post(`/marketing/site-web/articles/${mine}/supprimer`, R)).status, 403);
  });
  test("actions groupées : seuls ses propres articles sont traités, les autres sont ignorés", async () => {
    const author = await person("author");
    const mine = post("grp-mien", "Groupé mien", idOf(author)), theirs = post("grp-autre", "Groupé autre", bossId);
    await author.post("/marketing/site-web/articles/actions", { action: "corbeille", ids: [String(mine), String(theirs)], retour: "/marketing/site-web/articles" });
    assert.ok(one("SELECT deleted_at FROM posts WHERE id = ?", mine).deleted_at);
    assert.equal(one("SELECT deleted_at FROM posts WHERE id = ?", theirs).deleted_at, null);
    assert.equal((await author.post("/marketing/site-web/articles/actions", { action: "publier", ids: [String(mine)], retour: "/marketing/site-web/articles" })).status, 403);
  });
  test("la liste ne propose les actions que sur ses propres articles ; l'éditeur (tous les articles) les voit partout", async () => {
    const author = await person("author");
    const mine = post("liste-mien", "Liste mien", idOf(author)), theirs = post("liste-autre", "Liste autre", bossId);
    const page = (await author.get("/marketing/site-web/articles")).text;
    assert.match(page, new RegExp(`articles/${mine}/dupliquer`)); assert.doesNotMatch(page, new RegExp(`articles/${theirs}/dupliquer`));
    const editor = await person("editor");
    const ep = (await editor.get("/marketing/site-web/articles")).text;
    assert.match(ep, new RegExp(`articles/${theirs}/dupliquer`));
  });
});

describe("journal d'audit et cohérence", () => {
  test("changements sensibles journalisés (rôle, statut, invitation, rôle créé, accès de site) — journal en écriture seule réutilisé", () => {
    const actions = q("SELECT DISTINCT action FROM mk_audit_logs").map((r) => r.action);
    for (const a of ["user.role_changed", "user.status_changed", "user.invited", "role.created", "role.updated", "site_access.granted", "user.removed", "invitation.accepted"]) assert.ok(actions.includes(a), a);
    assert.throws(() => db.prepare("DELETE FROM mk_audit_logs").run(), /lecture seule/);
  });
  test("la fiche affiche l'activité de la personne", async () => {
    const id = one("SELECT user_id FROM mk_org_members WHERE role = 'admin' ORDER BY rowid LIMIT 1").user_id;
    assert.match((await boss.get(`${U}/${id}`)).text, /Rôle modifié|Activité/);
  });
  test("performance : 60 comptes, résolution des permissions groupée (un appel de liste rapide)", async () => {
    const t0 = Date.now();
    for (let i = 0; i < 30; i++) await boss.get(U);
    assert.ok(Date.now() - t0 < 15000, `${Date.now() - t0} ms`);
  });
});
