// KOLAKISA CMS — Utilisateurs dans l'espace d'UN site : équipe locale, fiche, rôle, retrait, invitations de ce site, rôles et permissions (lecture).
// Sécurité testée : accès croisé entre sites (IDOR par identifiant de personne, d'invitation ou de site forgé), escalade de privilèges, auto-modification, statut de compte réservé au central,
// rôles insuffisants, site archivé en lecture seule, journal d'audit sans secret.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, Client, loginInstructor, newStudent } = require("./helpers");

describe("Utilisateurs d'un site", () => {
  let srv, boss, db, orgId, A, B, C, adminA, editorA, viewerA, outsider, adminB, teamAdmin, anon;
  const one = (sql, ...a) => db.prepare(sql).get(...a);
  const q = (sql, ...a) => db.prepare(sql).all(...a);
  const R = "/marketing/site-web";
  const S = (site, screen) => `${R}/sites/${site}/${screen}`;
  const EQ = `${R}/equipe-site`;
  const idOf = (c) => one("SELECT id FROM users WHERE email = ?", c.email).id;
  const flashOf = (html) => (html.match(/class="mk-flash[^"]*"[^>]*>[\s\S]*?<\/div>/) || [""])[0];
  const siteRole = (site, c) => (one("SELECT role FROM mk_site_members WHERE site_id = ? AND user_id = ?", site, idOf(c)) || {}).role || null;
  const member = (site, c, role) => db.prepare("INSERT INTO mk_site_members (site_id, user_id, role) VALUES (?, ?, ?)").run(site, idOf(c), role);
  const post = (client, path, form) => client.request(`${EQ}${path}`, { method: "POST", form, redirect: "manual" });
  const mkSite = (n) => Number(db.prepare("INSERT INTO mk_sites (organization_id, name, slug, tokens) VALUES (?, ?, ?, '{}')").run(orgId, n, n.toLowerCase()).lastInsertRowid);

  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv); db = srv.db(); anon = new Client(srv.base);
    orgId = one("SELECT id FROM mk_organizations").id;
    A = mkSite("Alpha"); B = mkSite("Beta"); C = mkSite("Gamma");
    [adminA, editorA, viewerA, outsider, adminB, teamAdmin] = await Promise.all([1, 2, 3, 4, 5, 6].map(() => newStudent(srv)));
    member(A, adminA, "admin"); member(A, editorA, "editor"); member(A, viewerA, "viewer"); member(B, adminB, "admin"); member(C, editorA, "viewer");
    db.prepare("INSERT INTO mk_org_members (organization_id, user_id, role) VALUES (?, ?, 'admin')").run(orgId, idOf(teamAdmin));
  });
  after(() => { db.close(); return srv.stop(); });

  test("le menu d'un site : Tous les utilisateurs, Inviter, Rôles, Permissions, Invitations sont des liens ; plus aucune entrée « Bientôt » dans Utilisateurs", async () => {
    const menu = (await adminA.get(S(A, "tableau-de-bord"))).text;
    for (const k of ["equipe", "equipe-inviter", "equipe-roles", "equipe-permissions", "equipe-invitations"]) assert.match(menu, new RegExp(`href="${S(A, k)}"`), k);
    const soon = ["Inviter", "Rôles", "Permissions", "Invitations"].filter((l) => new RegExp(`title="${l} \\(bientôt\\)"`).test(menu));
    assert.deepEqual(soon, [], "aucune entrée grisée");
    for (const k of ["equipe", "equipe-inviter", "equipe-roles", "equipe-permissions", "equipe-invitations"]) assert.equal((await adminA.get(S(A, k))).status, 200, k);
  });

  test("liste : uniquement les personnes de CE site (jamais celles d'un autre, jamais l'équipe centrale) ; recherche, filtres, tri, pagination sur les vraies données", async () => {
    const page = (await adminA.get(S(A, "equipe"))).text;
    assert.ok(page.includes(editorA.email) && page.includes(viewerA.email) && page.includes(adminA.email)); assert.ok(!page.includes(adminB.email), "personne de Beta"); assert.ok(!page.includes(teamAdmin.email), "équipe centrale non listée");
    assert.ok((await adminA.get(`${S(A, "equipe")}?q=${encodeURIComponent(viewerA.email.slice(0, 10))}`)).text.includes(viewerA.email));
    const byRole = (await adminA.get(`${S(A, "equipe")}?role=editor`)).text; assert.ok(byRole.includes(editorA.email) && !byRole.includes(viewerA.email), "filtre de rôle");
    assert.match((await adminA.get(`${S(A, "equipe")}?q=introuvable-xyz`)).text, /Aucun résultat/);
    for (let i = 0; i < 30; i++) { const c = await newStudent(srv); member(A, c, "viewer"); }
    assert.match((await adminA.get(S(A, "equipe"))).text, /Page 1 sur 2/); assert.match((await adminA.get(`${S(A, "equipe")}?page=2`)).text, /Page 2 sur 2/);
    assert.ok(!(await adminA.get(S(B, "equipe"))).text.includes(editorA.email), "Beta ne voit pas les personnes d'Alpha");
  });

  test("accès croisé : la fiche d'une personne d'un AUTRE site (ou inexistante) est « introuvable » — on ne révèle rien ; l'étranger, le lecteur et l'anonyme sont refusés", async () => {
    assert.equal((await adminA.get(`${S(A, "equipe")}?membre=${idOf(editorA)}`)).status, 200);
    for (const id of [idOf(adminB), idOf(teamAdmin), 999999, "abc"]) assert.equal((await adminA.get(`${S(A, "equipe")}?membre=${id}`)).status, 404, `membre ${id}`);
    assert.notEqual((await adminA.get(S(B, "equipe"))).status, 200, "Beta est fermé à l'admin d'Alpha"); assert.notEqual((await adminA.get(`${R}/equipe-site?site=${B}`)).status, 200, "idem par l'adresse centrale");
    assert.notEqual((await outsider.get(S(A, "equipe"))).status, 200); assert.notEqual((await anon.get(S(A, "equipe"))).status, 200);
    assert.notEqual((await viewerA.get(S(A, "equipe"))).status, 200, "le lecteur n'a pas « Voir l'équipe »");
    assert.equal((await editorA.get(S(A, "equipe"))).status, 200, "l'éditeur voit l'équipe"); assert.equal((await boss.get(S(A, "equipe"))).status, 200, "l'équipe de l'organisation aussi");
  });

  test("changer un rôle : réel et immédiat ; jamais plus de droits que soi, jamais soi-même, jamais une personne d'un autre site (même avec un « site » forgé) ; l'éditeur ne peut pas", async () => {
    const r1 = await post(adminA, `/${idOf(viewerA)}/role`, { site: A, role: "author" }); assert.equal(r1.status, 302); assert.equal(r1.headers.get("location"), S(A, "equipe") + `?membre=${idOf(viewerA)}`);
    assert.equal(siteRole(A, viewerA), "author"); assert.match(flashOf((await adminA.get(S(A, "equipe"))).text), /Rôle enregistré/);
    await post(adminA, `/${idOf(viewerA)}/role`, { site: A, role: "owner" }); assert.equal(siteRole(A, viewerA), "author", "le rôle propriétaire ne s'attribue pas");
    await post(adminA, `/${idOf(adminA)}/role`, { site: A, role: "viewer" }); assert.equal(siteRole(A, adminA), "admin", "pas de modification de son propre rôle");
    await post(adminA, `/${idOf(adminB)}/role`, { site: A, role: "viewer" }); assert.equal(siteRole(B, adminB), "admin", "la personne de Beta n'est pas touchée depuis Alpha");
    assert.equal(one("SELECT COUNT(*) AS n FROM mk_site_members WHERE site_id = ? AND user_id = ?", A, idOf(adminB)).n, 0, "et n'a pas été ajoutée à Alpha");
    const forged = await post(adminA, `/${idOf(adminB)}/role`, { site: B, role: "viewer" }); assert.notEqual(forged.status, 302 && siteRole(B, adminB) === "viewer", true); assert.equal(siteRole(B, adminB), "admin", "site forgé : refusé");
    await post(editorA, `/${idOf(viewerA)}/role`, { site: A, role: "viewer" }); assert.equal(siteRole(A, viewerA), "author", "l'éditeur n'a pas « Attribuer des rôles »");
    await post(anon, `/${idOf(viewerA)}/role`, { site: A, role: "viewer" }); assert.equal(siteRole(A, viewerA), "author");
    // escalade : une personne qui PEUT attribuer des rôles mais n'a que peu de droits ne donne jamais un rôle plus riche que le sien
    await boss.post(`${R}/utilisateurs/roles`, { name: "Gestionnaire d'accès", description: "t", perm: ["users.view", "users.manage_roles"] }); const mgrRole = one("SELECT key FROM mk_roles WHERE name = 'Gestionnaire d''accès'").key;
    await boss.post(`${R}/utilisateurs/roles`, { name: "Lecture équipe", description: "t", perm: ["users.view"] }); const readRole = one("SELECT key FROM mk_roles WHERE name = 'Lecture équipe'").key;
    const mgr = await newStudent(srv); member(A, mgr, mgrRole);
    const low = await newStudent(srv); member(A, low, readRole);
    await post(mgr, `/${idOf(low)}/role`, { site: A, role: "admin" }); assert.equal(siteRole(A, low), readRole, "ne peut pas donner « Administrateur » (droits qu'il n'a pas)");
    await post(mgr, `/${idOf(low)}/role`, { site: A, role: "editor" }); assert.equal(siteRole(A, low), readRole, "ni « Éditeur »");
    await post(mgr, `/${idOf(viewerA)}/role`, { site: A, role: readRole }); assert.equal(siteRole(A, viewerA), "author", "ne peut pas modifier quelqu'un qui a plus de droits que lui");
    await post(mgr, `/${idOf(adminA)}/role`, { site: A, role: readRole }); assert.equal(siteRole(A, adminA), "admin", "ni rétrograder un administrateur du site");
    await post(mgr, `/${idOf(low)}/role`, { site: A, role: mgrRole }); assert.equal(siteRole(A, low), mgrRole, "un rôle inclus dans ses propres droits : permis");
    await post(mgr, `/${idOf(adminA)}/retirer`, { site: A }); assert.equal(siteRole(A, adminA), "admin", "ni retirer un administrateur du site (même sans droit de retrait)");
    const log = q("SELECT metadata FROM mk_audit_logs WHERE action = 'site_access.granted'"); assert.ok(log.length >= 1); assert.ok(!JSON.stringify(log).includes("password"));
  });

  test("retirer l'accès : seulement CE site ; le compte, les autres sites et l'équipe restent ; pas soi-même ; pas une personne d'un autre site", async () => {
    await post(adminA, `/${idOf(adminB)}/retirer`, { site: A }); assert.equal(siteRole(B, adminB), "admin", "Beta intact");
    await post(adminA, `/${idOf(adminA)}/retirer`, { site: A }); assert.equal(siteRole(A, adminA), "admin", "pas soi-même");
    await post(editorA, `/${idOf(viewerA)}/retirer`, { site: A }); assert.equal(siteRole(A, viewerA), "author", "droit « Retirer » requis");
    const gone = await post(adminA, `/${idOf(editorA)}/retirer`, { site: A }); assert.equal(gone.status, 302);
    assert.equal(siteRole(A, editorA), null, "accès à Alpha retiré"); assert.equal(siteRole(C, editorA), "viewer", "accès à Gamma conservé"); assert.ok(one("SELECT 1 FROM users WHERE id = ?", idOf(editorA)), "compte conservé");
    await post(adminA, `/${idOf(teamAdmin)}/retirer`, { site: A }); assert.ok(one("SELECT 1 FROM mk_org_members WHERE user_id = ?", idOf(teamAdmin)), "l'équipe centrale n'est pas touchée");
  });

  test("le statut du COMPTE reste à l'administration centrale : un administrateur local ne peut ni suspendre, ni désactiver, ni supprimer un compte", async () => {
    for (const path of ["statut", "retirer", "role"]) { const r = await adminA.request(`${R}/utilisateurs/${idOf(viewerA)}/${path}`, { method: "POST", form: { statut: "suspended", status: "suspended", role: "viewer" }, redirect: "manual" }); assert.notEqual(r.status, 200, path); }
    assert.equal(one("SELECT status FROM users WHERE id = ?", idOf(viewerA)).status, "active"); assert.equal(siteRole(A, viewerA), "author");
    assert.notEqual((await adminA.get(`${R}/utilisateurs`)).status, 200, "la liste centrale lui est fermée");
  });

  test("inviter : toujours pour CE site (un « site » forgé ou « toute l'équipe » est ignoré) ; jamais un rôle supérieur au sien ; compte existant = accès immédiat à CE site seulement", async () => {
    const email = "nouvelle.personne@exemple.test";
    const r = await post(adminA, "/inviter", { site: A, site_id: B, email, role: "editor", name: "Nina", message: "Bienvenue" }); assert.equal(r.status, 302); assert.equal(r.headers.get("location"), S(A, "equipe-invitations"));
    const inv = one("SELECT * FROM mk_invitations WHERE email = ?", email); assert.equal(inv.site_id, A, "le site vient du serveur, pas du formulaire"); assert.equal(inv.invited_by, idOf(adminA)); assert.equal(inv.invited_name, "Nina");
    await post(adminA, "/inviter", { site: A, email: "trop.haut@exemple.test", role: "owner" }); assert.equal(one("SELECT COUNT(*) AS n FROM mk_invitations WHERE email = 'trop.haut@exemple.test'").n, 0, "rôle propriétaire refusé");
    await post(editorA, "/inviter", { site: A, email: "editeur.invite@exemple.test", role: "viewer" }); assert.equal(one("SELECT COUNT(*) AS n FROM mk_invitations WHERE email = 'editeur.invite@exemple.test'").n, 0, "l'éditeur ne peut pas inviter");
    await post(adminA, "/inviter", { site: B, email: "chez.beta@exemple.test", role: "viewer" }); assert.equal(one("SELECT COUNT(*) AS n FROM mk_invitations WHERE email = 'chez.beta@exemple.test'").n, 0, "pas d'invitation vers Beta");
    await post(adminA, "/inviter", { site: A, email: outsider.email, role: "viewer" }); assert.equal(siteRole(A, outsider), "viewer", "compte existant : accès immédiat à Alpha"); assert.equal(siteRole(B, outsider), null); assert.equal(one("SELECT COUNT(*) AS n FROM mk_org_members WHERE user_id = ?", idOf(outsider)).n, 0, "aucun rôle d'équipe");
    assert.match((await adminA.get(S(A, "equipe-invitations"))).text, /nouvelle\.personne@exemple\.test/); assert.match((await adminA.get(S(A, "equipe-inviter"))).text, /Alpha/);
  });

  test("invitations : la liste d'Alpha ne montre rien de Beta ; renvoyer / révoquer une invitation de Beta depuis Alpha échoue sans effet ; renvoi qui annule l'ancien lien", async () => {
    await post(adminB, "/inviter", { site: B, email: "secret.beta@exemple.test", role: "viewer" }); const ib = one("SELECT * FROM mk_invitations WHERE email = 'secret.beta@exemple.test'");
    const list = (await adminA.get(S(A, "equipe-invitations"))).text; assert.ok(!list.includes("secret.beta@exemple.test"), "invisible depuis Alpha"); assert.ok((await adminB.get(S(B, "equipe-invitations"))).text.includes("secret.beta@exemple.test"));
    await post(adminA, `/invitations/${ib.id}/revoquer`, { site: A }); await post(adminA, `/invitations/${ib.id}/renvoyer`, { site: A });
    const after = one("SELECT revoked_at, token_hash, send_count FROM mk_invitations WHERE id = ?", ib.id); assert.equal(after.revoked_at, null); assert.equal(after.token_hash, ib.token_hash, "jeton de Beta intact");
    assert.match(flashOf((await adminA.get(S(A, "equipe-invitations"))).text), /introuvable/);
    const mine = one("SELECT * FROM mk_invitations WHERE email = 'nouvelle.personne@exemple.test'"); db.prepare("UPDATE mk_invitations SET last_sent_at = datetime('now', '-3 minutes') WHERE id = ?").run(mine.id);
    const old = (await adminA.get(S(A, "equipe-invitations"))).text.match(/\/invitation\/([A-Za-z0-9_-]+)/); void old;
    const r = await post(adminA, `/invitations/${mine.id}/renvoyer`, { site: A }); assert.equal(r.status, 302); assert.notEqual(one("SELECT token_hash FROM mk_invitations WHERE id = ?", mine.id).token_hash, mine.token_hash, "nouveau jeton");
    await post(adminA, `/invitations/${mine.id}/revoquer`, { site: A }); assert.ok(one("SELECT revoked_at FROM mk_invitations WHERE id = ?", mine.id).revoked_at);
    assert.match((await adminA.get(`${S(A, "equipe-invitations")}?etat=revoked`)).text, /Révoquée/);
  });

  test("rôles et permissions : lecture seule ; aucune création ni modification de rôle depuis un site ; les droits de la personne sont ceux de CE site", async () => {
    const roles = (await adminA.get(S(A, "equipe-roles"))).text; for (const n of ["Administrateur", "Éditeur", "Auteur", "Lecteur"]) assert.ok(roles.includes(n), n); assert.ok(!/Nouveau rôle|name="perm"/.test(roles));
    const perms = (await adminA.get(`${S(A, "equipe-permissions")}?role=viewer`)).text; assert.match(perms, /Lecteur/); assert.match(perms, /permissions/);
    assert.ok((await adminA.get(`${S(A, "equipe-permissions")}?role=inconnu`)).status === 200, "rôle inconnu → rôle par défaut");
    for (const p of ["/roles", "/roles/nouveau"]) assert.equal((await post(adminA, p, { site: A, name: "Pirate", perm: ["users.view"] })).status, 404, `${p} n'existe pas côté site`);
    assert.equal(one("SELECT COUNT(*) AS n FROM mk_roles WHERE name = 'Pirate'").n, 0);
    assert.notEqual((await adminA.request(`${R}/utilisateurs/roles`, { method: "POST", form: { name: "Pirate2", perm: "users.view" }, redirect: "manual" })).status, 200);
    assert.equal(one("SELECT COUNT(*) AS n FROM mk_roles WHERE name = 'Pirate2'").n, 0, "le central reste fermé à un administrateur local");
    const detail = (await adminA.get(`${S(A, "equipe")}?membre=${idOf(adminA)}`)).text; assert.match(detail, /Permissions effectives sur ce site/);
  });

  test("site archivé : l'équipe est en lecture seule (aucune invitation, aucun changement de rôle)", async () => {
    const D = mkSite("Delta"); member(D, adminA, "admin"); const v = await newStudent(srv); member(D, v, "viewer");
    db.prepare("UPDATE mk_sites SET status = 'archived' WHERE id = ?").run(D);
    await post(adminA, "/inviter", { site: D, email: "archive@exemple.test", role: "viewer" }); assert.equal(one("SELECT COUNT(*) AS n FROM mk_invitations WHERE email = 'archive@exemple.test'").n, 0);
    await post(adminA, `/${idOf(v)}/role`, { site: D, role: "editor" }); assert.equal(siteRole(D, v), "viewer");
  });
});
