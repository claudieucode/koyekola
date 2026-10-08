// KOLAKISA CMS — palier 6 : moteur de commentaires, de bout en bout par les vraies routes d'un vrai serveur et la vraie base :
// commentaires invités et membres, réponses imbriquées, modération (statuts réels), actions groupées, recherche/filtres/tri,
// réglages, sécurité (XSS, liens, robots, débit, droits), confidentialité, intégration aux articles, reprise de l'existant.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, Client, loginInstructor, newStudent } = require("./helpers");

let srv, boss, db, anon, orgId, postId, slug;
const ADMIN = "/marketing/site-web/commentaires";
const SETTINGS = "/marketing/site-web/parametres/commentaires";
const q = (sql, ...a) => db.prepare(sql).all(...a);
const one = (sql, ...a) => db.prepare(sql).get(...a);
const flashOf = (html) => (html.match(/class="mk-flash[^"]*"[^>]*>[\s\S]*?<\/div>/) || [""])[0];
const byBody = (b) => one("SELECT * FROM blog_comments WHERE body = ?", b);
async function setSettings(fields) {
  const base = { enabled_default: "1", guests_allowed: "", moderation: "none", replies_allowed: "1", max_depth: "3", links_allowed: "1" };
  return boss.post(SETTINGS, { ...base, ...fields });
}
let ipN = 0;
// Chaque invité a sa propre adresse (X-Forwarded-For, proxy de confiance) : les limites de débit sont par adresse
async function guest(body, extra = {}, client = new Client(srv.base), ip = `10.9.${Math.floor(++ipN / 250)}.${ipN % 250}`) {
  await client.get(`/blog/${slug}`);
  // jeton d'heure d'affichage vieux de 5 s (un humain met plus de 2 s à écrire) ; la page publique en contient un vrai (test dédié)
  return client.post(`/blog/${slug}/commentaires`, { author_name: "Camille", author_email: "camille@example.com", body, form_token: srv.formToken(), ...extra }, { headers: { "x-forwarded-for": ip } });
}
async function member(role) {
  const c = await newStudent(srv);
  db.prepare("INSERT INTO mk_org_members (organization_id, user_id, role) VALUES (?, (SELECT id FROM users WHERE email = ?), ?)").run(orgId, c.email, role);
  return c;
}

before(async () => {
  srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
  boss = await loginInstructor(srv);
  anon = new Client(srv.base);
  db = srv.db();
  orgId = db.prepare("SELECT id FROM mk_organizations").get().id;
  postId = Number(db.prepare("INSERT INTO posts (slug, title, content, content_format, status, published, published_at, comments_enabled) VALUES ('article-test', 'Article test', '<p>Contenu</p>', 'html', 'published', 1, datetime('now'), 1)").run().lastInsertRowid);
  slug = "article-test";
});
after(() => srv.stop());

describe("reprise de l'existant et structure", () => {
  test("blog_comments est étendue (pas doublée) : contenu générique, réponses, invités, statut", () => {
    const cols = q("PRAGMA table_info(blog_comments)").map((c) => c.name);
    for (const c of ["content_type", "content_id", "parent_id", "user_id", "author_name", "author_email", "ip_hash", "status", "approved_at", "approved_by", "deleted_at", "metadata"]) assert.ok(cols.includes(c), c);
    assert.equal(one("SELECT COUNT(*) n FROM sqlite_master WHERE name LIKE '%comment%' AND type = 'table'").n, 1);
  });
  test("écriture historique (post_id seul) : contenu générique déduit, statut approuvé", () => {
    const u = one("SELECT id FROM users LIMIT 1").id;
    const id = Number(db.prepare("INSERT INTO blog_comments (post_id, user_id, body) VALUES (?, ?, 'Ancien commentaire')").run(postId, u).lastInsertRowid);
    const r = one("SELECT * FROM blog_comments WHERE id = ?", id);
    assert.equal(r.content_type, "post"); assert.equal(r.content_id, postId); assert.equal(r.status, "approved");
    db.prepare("DELETE FROM blog_comments WHERE id = ?").run(id);
  });
});

describe("public : formulaire, invités, statut, persistance", () => {
  test("section commentaires d'un article publié : « Aucun commentaire », invitation à se connecter (invités fermés)", async () => {
    const r = await anon.get(`/blog/${slug}`);
    assert.match(r.text, /id="commentaires"/); assert.match(r.text, /Aucun commentaire pour l'instant/); assert.match(r.text, /Se connecter/);
    assert.doesNotMatch(r.text, /name="author_email"/);
  });
  test("invités fermés : un envoi anonyme est renvoyé vers la connexion, rien n'est enregistré", async () => {
    const r = await guest("Je suis un invité fermé");
    assert.match(r.location, /^\/connexion/);
    assert.equal(q("SELECT * FROM blog_comments WHERE body = 'Je suis un invité fermé'").length, 0);
  });
  test("invités autorisés + modération totale : le commentaire est créé EN ATTENTE, invisible, message honnête", async () => {
    await setSettings({ guests_allowed: "1", moderation: "all" });
    const form = (await anon.get(`/blog/${slug}`)).text;
    assert.match(form, /name="author_email"/); assert.match(form, /jamais affiché/);
    const c = new Client(srv.base);
    await guest("Premier commentaire invité", {}, c);
    const row = byBody("Premier commentaire invité");
    assert.equal(row.status, "pending"); assert.equal(row.user_id, null); assert.equal(row.author_name, "Camille"); assert.equal(row.author_email, "camille@example.com");
    assert.equal(row.content_type, "post"); assert.equal(row.content_id, postId); assert.equal(row.approved_at, null);
    const after = (await c.get(`/blog/${slug}`)).text;
    assert.match(after, /en attente de modération/);
    assert.doesNotMatch(after, /Premier commentaire invité/);
    assert.doesNotMatch((await anon.get(`/blog/${slug}`)).text, /Premier commentaire invité/);
  });
  test("e-mail et empreinte d'adresse : jamais dans la page publique ; l'adresse IP n'est pas stockée en clair", async () => {
    const row = byBody("Premier commentaire invité");
    assert.match(row.ip_hash, /^[0-9a-f]{32}$/);
    await boss.post(`${ADMIN}/${row.id}/approuver`, { retour: ADMIN });
    const page = (await anon.get(`/blog/${slug}`)).text;
    assert.match(page, /Premier commentaire invité/); assert.match(page, /Camille/);
    assert.doesNotMatch(page, /camille@example\.com/); assert.doesNotMatch(page, new RegExp(row.ip_hash));
  });
  test("approbation : statut, date et approbateur réels ; persistance au rechargement ; compteur", async () => {
    const row = byBody("Premier commentaire invité");
    assert.equal(row.status, "approved"); assert.ok(row.approved_at); assert.ok(row.approved_by);
    assert.match((await anon.get(`/blog/${slug}`)).text, /Commentaires <span class="article-comments-count">\(1\)<\/span>/);
  });
  test("validation invité : nom, e-mail, texte vides ou invalides refusés avec message", async () => {
    const c = new Client(srv.base);
    await guest("Sans nom valide", { author_name: "" }, c);
    assert.match((await c.get(`/blog/${slug}`)).text, /Indiquez votre nom/);
    await guest("Mauvais e-mail", { author_email: "pas-un-email" }, c);
    assert.match((await c.get(`/blog/${slug}`)).text, /adresse e-mail valide/);
    assert.equal(q("SELECT * FROM blog_comments WHERE body IN ('Sans nom valide','Mauvais e-mail')").length, 0);
  });
  test("commentaire d'un membre connecté : lié à son compte, nom du compte, pas de champs nom/e-mail", async () => {
    await setSettings({ guests_allowed: "1", moderation: "none" });
    const s = await newStudent(srv);
    assert.doesNotMatch((await s.get(`/blog/${slug}`)).text, /name="author_email"/);
    await s.post(`/blog/${slug}/commentaires`, { body: "Commentaire de membre" });
    const row = byBody("Commentaire de membre");
    assert.ok(row.user_id); assert.equal(row.status, "approved"); assert.equal(row.author_email, "");
  });
});

describe("réponses imbriquées", () => {
  let a, a1, a11;
  test("répondre : parent_id réel, affichage imbriqué, bouton « Répondre »", async () => {
    a = byBody("Commentaire de membre");
    const s = await newStudent(srv);
    const page = (await s.get(`/blog/${slug}?repondre=${a.id}`)).text;
    assert.match(page, new RegExp(`name="parent_id" value="${a.id}"`)); assert.match(page, /Réponse à/);
    await s.post(`/blog/${slug}/commentaires`, { body: "Réponse A1", parent_id: String(a.id) });
    a1 = byBody("Réponse A1");
    assert.equal(a1.parent_id, a.id);
    const html = (await anon.get(`/blog/${slug}`)).text;
    assert.match(html, /comment-replies/); assert.match(html, /Réponse A1/);
    assert.ok(html.indexOf("Commentaire de membre") < html.indexOf("Réponse A1"));
  });
  test("plusieurs niveaux jusqu'à la limite (3), au-delà refusé avec message ; plus de bouton Répondre au dernier niveau", async () => {
    const s = await newStudent(srv);
    await s.post(`/blog/${slug}/commentaires`, { body: "Réponse A1.1", parent_id: String(a1.id) });
    a11 = byBody("Réponse A1.1");
    assert.equal(a11.parent_id, a1.id);
    await s.post(`/blog/${slug}/commentaires`, { body: "Trop profond", parent_id: String(a11.id) });
    assert.equal(byBody("Trop profond"), undefined);
    assert.match((await s.get(`/blog/${slug}`)).text, /ne peut pas être prolongé/);
    const html = (await anon.get(`/blog/${slug}`)).text;
    assert.doesNotMatch(html, new RegExp(`repondre=${a11.id}`)); assert.match(html, new RegExp(`repondre=${a1.id}`));
  });
  test("profondeur réglable : à 1 niveau, plus aucun bouton Répondre ; réponses désactivées refusées", async () => {
    await setSettings({ guests_allowed: "1", max_depth: "1" });
    assert.doesNotMatch((await anon.get(`/blog/${slug}`)).text, /\?repondre=/);
    const s = await newStudent(srv);
    await s.post(`/blog/${slug}/commentaires`, { body: "Refusé niveau 1", parent_id: String(a.id) });
    assert.equal(byBody("Refusé niveau 1"), undefined);
    await setSettings({ guests_allowed: "1", max_depth: "3", replies_allowed: "" });
    await s.post(`/blog/${slug}/commentaires`, { body: "Refusé sans réponses", parent_id: String(a.id) });
    assert.equal(byBody("Refusé sans réponses"), undefined);
    await setSettings({ guests_allowed: "1" });
  });
  test("réponse à un commentaire d'un autre article : refusée", async () => {
    db.prepare("INSERT INTO posts (slug, title, content, content_format, status, published, published_at, comments_enabled) VALUES ('autre', 'Autre', 'x', 'html', 'published', 1, datetime('now'), 1)").run();
    const s = await newStudent(srv);
    await s.post("/blog/autre/commentaires", { body: "Mauvais parent", parent_id: String(a.id) });
    assert.equal(byBody("Mauvais parent"), undefined);
  });
  test("un commentaire parent mis à la corbeille masque ses réponses publiques sans les détruire", async () => {
    await boss.post(`${ADMIN}/${a1.id}/corbeille`, { retour: ADMIN });
    const html = (await anon.get(`/blog/${slug}`)).text;
    assert.doesNotMatch(html, /Réponse A1\.1/); assert.doesNotMatch(html, /Réponse A1</);
    assert.ok(byBody("Réponse A1.1"));
    await boss.post(`${ADMIN}/${a1.id}/restaurer`, { retour: ADMIN });
    assert.match((await anon.get(`/blog/${slug}`)).text, /Réponse A1\.1/);
  });
});

describe("modération (CMS → Commentaires)", () => {
  test("les 5 vues s'ouvrent avec leurs effectifs réels", async () => {
    for (const [sub, re] of [["", /Tous/], ["/en-attente", /En attente/], ["/approuves", /Approuvés/], ["/indesirables", /Indésirables/], ["/corbeille", /Corbeille/]]) {
      const r = await boss.get(ADMIN + sub);
      assert.equal(r.status, 200, sub); assert.match(r.text, re);
    }
    const all = (await boss.get(ADMIN)).text;
    const n = one("SELECT COUNT(*) n FROM blog_comments WHERE status <> 'trash'").n;
    assert.match(all, new RegExp(`Tous <span class="mk-tab-count">${n}</span>`));
  });
  test("actions : indésirable, restauration, corbeille, suppression définitive — statuts réels et exclusion du public", async () => {
    await setSettings({ guests_allowed: "1", moderation: "all" });
    await guest("À traiter");
    const c = byBody("À traiter");
    assert.equal(c.status, "pending");
    assert.match((await boss.get(`${ADMIN}/en-attente`)).text, /À traiter/);
    await boss.post(`${ADMIN}/${c.id}/indesirable`, { retour: ADMIN });
    assert.equal(byBody("À traiter").status, "spam");
    assert.match((await boss.get(`${ADMIN}/indesirables`)).text, /À traiter/);
    assert.doesNotMatch((await boss.get(`${ADMIN}/en-attente`)).text, /À traiter/);
    await boss.post(`${ADMIN}/${c.id}/restaurer`, { retour: ADMIN });
    assert.equal(byBody("À traiter").status, "pending");
    await boss.post(`${ADMIN}/${c.id}/corbeille`, { retour: ADMIN });
    const t = byBody("À traiter");
    assert.equal(t.status, "trash"); assert.ok(t.deleted_at);
    assert.match((await boss.get(`${ADMIN}/corbeille`)).text, /À traiter/);
    assert.doesNotMatch((await boss.get(ADMIN)).text, /À traiter/);
    await boss.post(`${ADMIN}/${c.id}/restaurer`, { retour: ADMIN });
    assert.equal(byBody("À traiter").status, "pending");
    await boss.post(`${ADMIN}/${c.id}/supprimer`, { retour: ADMIN });
    assert.ok(byBody("À traiter"), "la suppression définitive exige la corbeille");
    await boss.post(`${ADMIN}/${c.id}/corbeille`, { retour: ADMIN });
    await boss.post(`${ADMIN}/${c.id}/supprimer`, { retour: ADMIN });
    assert.equal(byBody("À traiter"), undefined);
  });
  test("actions groupées : exécutées pour de vrai, compte honnête (ignorés signalés)", async () => {
    await setSettings({ guests_allowed: "1", moderation: "all" });
    for (const t of ["Lot 1", "Lot 2", "Lot 3"]) await guest(t, {}, new Client(srv.base));
    const ids = ["Lot 1", "Lot 2", "Lot 3"].map((t) => byBody(t).id);
    assert.ok(ids.every((id) => one("SELECT status FROM blog_comments WHERE id = ?", id).status === "pending"));
    await boss.post(`${ADMIN}/actions`, { action: "approuver", ids, retour: ADMIN });
    assert.ok(ids.every((id) => one("SELECT status FROM blog_comments WHERE id = ?", id).status === "approved"));
    assert.match(flashOf((await boss.get(ADMIN)).text), /3 commentaires approuvés/);
    await boss.post(`${ADMIN}/actions`, { action: "approuver", ids, retour: ADMIN });
    assert.match(flashOf((await boss.get(ADMIN)).text), /Aucun commentaire n(?:'|&#39;)a été modifié/);
    await boss.post(`${ADMIN}/actions`, { action: "indesirable", ids: ids.slice(0, 2), retour: ADMIN });
    assert.deepEqual(ids.map((id) => one("SELECT status FROM blog_comments WHERE id = ?", id).status), ["spam", "spam", "approved"]);
    await boss.post(`${ADMIN}/actions`, { action: "corbeille", ids, retour: ADMIN });
    await boss.post(`${ADMIN}/actions`, { action: "supprimer", ids, retour: ADMIN });
    assert.equal(q(`SELECT * FROM blog_comments WHERE id IN (${ids.join(",")})`).length, 0);
  });
  test("réponse d'un modérateur : publiée, parent_id réel, le parent en attente est approuvé", async () => {
    await guest("Question en attente", {}, new Client(srv.base));
    const p = byBody("Question en attente");
    assert.equal(p.status, "pending");
    await boss.post(`${ADMIN}/${p.id}/repondre`, { body: "Voici la réponse officielle", retour: ADMIN });
    const rep = byBody("Voici la réponse officielle");
    assert.equal(rep.parent_id, p.id); assert.equal(rep.status, "approved"); assert.ok(rep.user_id);
    assert.equal(byBody("Question en attente").status, "approved");
    const html = (await anon.get(`/blog/${slug}`)).text;
    assert.match(html, /Voici la réponse officielle/); assert.match(html, /Auteur/);
  });
  test("recherche (texte, auteur, contenu), filtres (contenu, auteur, période), tri, e-mail selon le droit", async () => {
    let r = await boss.get(`${ADMIN}?q=Question+en+attente`);
    assert.match(r.text, /Question en attente/); assert.doesNotMatch(r.text, /Premier commentaire invité/);
    assert.match((await boss.get(`${ADMIN}?q=Article+test`)).text, /Question en attente/);
    assert.match((await boss.get(`${ADMIN}?auteur=Camille`)).text, /Question en attente/);
    assert.doesNotMatch((await boss.get(`${ADMIN}?auteur=Zorglub`)).text, /Question en attente/);
    assert.match((await boss.get(`${ADMIN}?contenu=post:${postId}`)).text, /Question en attente/);
    assert.match((await boss.get(`${ADMIN}?contenu=post:99999`)).text, /Aucun commentaire trouvé/);
    assert.match((await boss.get(`${ADMIN}?periode=7`)).text, /Question en attente/);
    r = await boss.get(`${ADMIN}?tri=ancien`);
    assert.ok(r.text.indexOf("Premier commentaire invité") < r.text.indexOf("Question en attente"));
    r = await boss.get(`${ADMIN}?tri=recent`);
    assert.ok(r.text.indexOf("Premier commentaire invité") > r.text.indexOf("Question en attente"));
    assert.match((await boss.get(`${ADMIN}?q=camille%40example.com`)).text, /Question en attente/, "propriétaire : recherche par e-mail");
    assert.match((await boss.get(ADMIN)).text, /camille@example\.com/);
  });
  test("pagination : 30 par page, pas de chargement massif", async () => {
    db.exec("BEGIN");
    const ins = db.prepare("INSERT INTO blog_comments (post_id, content_type, content_id, author_name, author_email, body, status) VALUES (?, 'post', ?, 'Masse', 'masse@example.com', ?, 'approved')");
    for (let i = 0; i < 70; i++) ins.run(postId, postId, `Volume ${i}`);
    db.exec("COMMIT");
    const r = await boss.get(`${ADMIN}/approuves`);
    assert.match(r.text, /Page 1 sur/);
    assert.ok((r.text.match(/data-cms-row/g) || []).length <= 30);
    const p2 = await boss.get(`${ADMIN}/approuves?page=2`);
    assert.match(p2.text, /Page 2 sur/);
    const pub = await anon.get(`/blog/${slug}`);
    assert.ok((pub.text.match(/class="comment"/g) || []).length <= 30, "page publique paginée");
    assert.match(pub.text, /Commentaires suivants/);
    db.prepare("DELETE FROM blog_comments WHERE author_name = 'Masse'").run();
  });
});

describe("droits d'accès et confidentialité", () => {
  test("anonyme : refusé ; lecteur : voit sans e-mail ni boutons ; éditeur : modère, ne supprime pas, sans e-mail ; admin : tout", async () => {
    assert.notEqual((await anon.get(ADMIN)).status, 200);
    const viewer = await member("viewer"), editor = await member("editor"), admin = await member("admin");
    await guest("Pour les droits", {}, new Client(srv.base));
    const c = byBody("Pour les droits");
    const v = await viewer.get(ADMIN);
    assert.equal(v.status, 200); assert.doesNotMatch(v.text, /camille@example\.com/); assert.doesNotMatch(v.text, /data-cms-bulk/);
    assert.equal((await viewer.post(`${ADMIN}/${c.id}/approuver`, { retour: ADMIN })).status, 403);
    assert.equal(byBody("Pour les droits").status, "pending");
    const e = await editor.get(ADMIN);
    assert.doesNotMatch(e.text, /camille@example\.com/); assert.match(e.text, /data-cms-bulk/);
    await editor.post(`${ADMIN}/${c.id}/approuver`, { retour: ADMIN });
    assert.equal(byBody("Pour les droits").status, "approved");
    await editor.post(`${ADMIN}/${c.id}/corbeille`, { retour: ADMIN });
    await editor.post(`${ADMIN}/${c.id}/supprimer`, { retour: ADMIN });
    assert.ok(byBody("Pour les droits"), "l'éditeur ne supprime pas définitivement");
    assert.match((await admin.get(`${ADMIN}/corbeille`)).text, /camille@example\.com/);
    await admin.post(`${ADMIN}/${c.id}/supprimer`, { retour: ADMIN });
    assert.equal(byBody("Pour les droits"), undefined);
  });
  test("un simple membre (auteur d'article ou non) n'a aucun pouvoir de modération", async () => {
    const s = await newStudent(srv);
    assert.notEqual((await s.get(ADMIN)).status, 200);
    const id = one("SELECT id FROM blog_comments LIMIT 1").id;
    await s.post(`${ADMIN}/${id}/corbeille`, { retour: ADMIN });
    assert.notEqual(one("SELECT status FROM blog_comments WHERE id = ?", id).status, "trash");
  });
  test("réglages : l'éditeur ne modifie pas ; l'administrateur oui", async () => {
    const editor = await member("editor"), admin = await member("admin");
    await setSettings({ guests_allowed: "1", moderation: "none" });
    await editor.post(SETTINGS, { moderation: "all", guests_allowed: "1" });
    assert.notEqual(JSON.parse(one("SELECT value FROM mk_settings WHERE key = 'comments.settings'").value).moderation, "all");
    assert.equal((await admin.get(SETTINGS)).status, 200);
    await admin.post(SETTINGS, { enabled_default: "1", guests_allowed: "1", moderation: "none", replies_allowed: "1", max_depth: "3", links_allowed: "1" });
  });
});

describe("sécurité du contenu et anti-spam", () => {
  test("XSS : HTML, script, javascript:, gestionnaires d'événements restent du texte inerte", async () => {
    await setSettings({ guests_allowed: "1", moderation: "none" });
    const s = await newStudent(srv);
    const payload = "<script>alert(1)</script> <img src=x onerror=alert(2)> [clic](javascript:alert(3)) <a href=\"javascript:alert(4)\">x</a>";
    await s.post(`/blog/${slug}/commentaires`, { body: payload });
    const page = (await anon.get(`/blog/${slug}`)).text;
    assert.doesNotMatch(page, /<script>alert\(1\)<\/script>/); assert.doesNotMatch(page, /<img src=x/); assert.doesNotMatch(page, /<a href="javascript:/i);
    assert.match(page, /&lt;script&gt;alert\(1\)&lt;\/script&gt;/);
    const admin = (await boss.get(ADMIN)).text;
    assert.doesNotMatch(admin, /<script>alert\(1\)<\/script>/); assert.doesNotMatch(admin, /<img src=x/);
  });
  test("liens : seules les adresses http(s) deviennent cliquables (rel sécurisé) ; javascript:/data: jamais", async () => {
    const s = await newStudent(srv);
    await s.post(`/blog/${slug}/commentaires`, { body: "Voir https://exemple.org/page?a=1&b=2 et javascript:alert(9) et data:text/html,<b>x</b>" });
    const page = (await anon.get(`/blog/${slug}`)).text;
    assert.match(page, /<a href="https:\/\/exemple\.org\/page\?a=1&amp;b=2" rel="nofollow ugc noopener" target="_blank">/);
    assert.doesNotMatch(page, /href="javascript:/i); assert.doesNotMatch(page, /href="data:/i);
  });
  test("liens interdits (réglage) : commentaire refusé ; 3 liens ou plus : retenu pour modération", async () => {
    await setSettings({ guests_allowed: "1", links_allowed: "" });
    const s = await newStudent(srv);
    await s.post(`/blog/${slug}/commentaires`, { body: "Voyez http://spam.example" });
    assert.equal(byBody("Voyez http://spam.example"), undefined);
    assert.match((await s.get(`/blog/${slug}`)).text, /liens ne sont pas autorisés/);
    await setSettings({ guests_allowed: "1", links_allowed: "1" });
    const text = "Liens http://a.example http://b.example http://c.example";
    await s.post(`/blog/${slug}/commentaires`, { body: text });
    assert.equal(byBody(text).status, "pending");
  });
  test("piège à robots et envoi trop rapide : conservés comme indésirables, jamais publiés", async () => {
    await guest("Robot piège", { contact_url: "http://bot.example" }, new Client(srv.base));
    assert.equal(byBody("Robot piège").status, "spam");
    const d = new Client(srv.base);
    await d.get(`/blog/${slug}`);
    await d.post(`/blog/${slug}/commentaires`, { author_name: "Bot", author_email: "bot@example.com", body: "Robot rapide", form_token: "1.invalide" }, { headers: { "x-forwarded-for": "10.78.0.3" } });
    assert.equal(byBody("Robot rapide").status, "spam");
    assert.doesNotMatch((await anon.get(`/blog/${slug}`)).text, /Robot piège|Robot rapide/);
  });
  test("débit : un invité ne peut pas envoyer de rafale (1 envoi toutes les 5 s)", async () => {
    const c = new Client(srv.base);
    await guest("Rafale 1", {}, c, "10.77.0.1");
    await guest("Rafale 2", {}, c, "10.77.0.1");
    assert.equal(byBody("Rafale 2"), undefined, "deux envois en moins de 5 secondes");
    assert.match((await c.get(`/blog/${slug}`)).text, /réessayez dans quelques minutes/);
    assert.equal(q("SELECT * FROM blog_comments WHERE body = 'Rafale 1'").length, 1);
  });
  test("le formulaire public contient un jeton signé valide (accepté après 2 secondes d'affichage)", async () => {
    const c = new Client(srv.base);
    const token = ((await c.get(`/blog/${slug}`)).text.match(/name="form_token" value="([^"]+)"/) || [])[1];
    assert.match(token, /^\d{13}\.[A-Za-z0-9_-]{22}$/);
    await new Promise((r) => setTimeout(r, 2200));
    await c.post(`/blog/${slug}/commentaires`, { author_name: "Humain", author_email: "humain@example.com", body: "Écrit par un humain", form_token: token }, { headers: { "x-forwarded-for": "10.78.0.2" } });
    assert.notEqual(byBody("Écrit par un humain").status, "spam");
  });
  test("envoi direct sans jeton (curl) : traité comme robot", async () => {
    const c = new Client(srv.base);
    await c.post(`/blog/${slug}/commentaires`, { author_name: "Curl", author_email: "curl@example.com", body: "Sans jeton" }, { headers: { "x-forwarded-for": "10.78.0.1" } });
    assert.equal(byBody("Sans jeton").status, "spam");
  });
});

describe("ouverture / fermeture, article, nettoyage", () => {
  test("commentaires fermés : section absente, envoi sans effet, anciens commentaires conservés en base", async () => {
    const before = one("SELECT COUNT(*) n FROM blog_comments WHERE content_id = ?", postId).n;
    db.prepare("UPDATE posts SET comments_enabled = 0 WHERE id = ?").run(postId);
    const s = await newStudent(srv);
    assert.doesNotMatch((await s.get(`/blog/${slug}`)).text, /id="commentaires"/);
    await s.post(`/blog/${slug}/commentaires`, { body: "Fermé" });
    assert.equal(byBody("Fermé"), undefined);
    assert.equal(one("SELECT COUNT(*) n FROM blog_comments WHERE content_id = ?", postId).n, before);
    db.prepare("UPDATE posts SET comments_enabled = 1 WHERE id = ?").run(postId);
  });
  test("liste des articles : compteurs réels de commentaires et lien de gestion par article", async () => {
    const r = await boss.get("/marketing/site-web/articles");
    assert.match(r.text, new RegExp(`/marketing/site-web/commentaires\\?contenu=post:${postId}`));
    const approved = one("SELECT COUNT(*) n FROM blog_comments WHERE content_id = ? AND status = 'approved'", postId).n;
    assert.match(r.text, new RegExp(`contenu=post:${postId}">${approved}</a>`));
  });
  test("réglage « ouverts par défaut » : appliqué aux nouveaux articles", async () => {
    await setSettings({ guests_allowed: "1", enabled_default: "" });
    await boss.post("/marketing/site-web/articles", { title: "Article fermé par défaut" });
    assert.equal(one("SELECT comments_enabled FROM posts WHERE title = 'Article fermé par défaut'").comments_enabled, 0);
    await setSettings({ guests_allowed: "1", enabled_default: "1" });
    await boss.post("/marketing/site-web/articles", { title: "Article ouvert par défaut" });
    assert.equal(one("SELECT comments_enabled FROM posts WHERE title = 'Article ouvert par défaut'").comments_enabled, 1);
  });
  test("suppression d'un article : ses commentaires disparaissent avec lui (cascade)", () => {
    const pid = Number(db.prepare("INSERT INTO posts (slug, title, content_format, status, published) VALUES ('ephemere', 'Éphémère', 'html', 'draft', 0)").run().lastInsertRowid);
    db.prepare("INSERT INTO blog_comments (post_id, content_type, content_id, author_name, body) VALUES (?, 'post', ?, 'X', 'Lié')").run(pid, pid);
    db.prepare("DELETE FROM posts WHERE id = ?").run(pid);
    assert.equal(one("SELECT COUNT(*) n FROM blog_comments WHERE body = 'Lié'").n, 0);
  });
  test("suppression d'un commentaire parent : ses réponses remontent d'un niveau", () => {
    const mk = (parent, body) => Number(db.prepare("INSERT INTO blog_comments (post_id, content_type, content_id, parent_id, author_name, body) VALUES (?, 'post', ?, ?, 'T', ?)").run(postId, postId, parent, body).lastInsertRowid);
    const g = mk(null, "Grand-parent"), p = mk(g, "Parent"), e = mk(p, "Enfant");
    db.prepare("DELETE FROM blog_comments WHERE id = ?").run(p);
    assert.equal(one("SELECT parent_id FROM blog_comments WHERE id = ?", e).parent_id, g);
    db.prepare("DELETE FROM blog_comments WHERE id IN (?, ?)").run(g, e);
  });
  test("journal d'activité et tableau de bord CMS : s'ouvrent, sans commentaire indésirable", async () => {
    assert.equal((await boss.get("/formateur/gestion/journal")).status, 200);
    const r = await boss.get("/marketing/site-web");
    assert.equal(r.status, 200); assert.doesNotMatch(r.text, /Robot piège/);
  });
  test("suppression par l'auteur depuis le site public toujours possible", async () => {
    const s = await newStudent(srv);
    await s.post(`/blog/${slug}/commentaires`, { body: "À retirer moi-même" });
    const c = byBody("À retirer moi-même");
    assert.equal((await s.post(`/blog/commentaires/${c.id}/supprimer`, {})).status, 302);
    assert.equal(byBody("À retirer moi-même"), undefined);
  });
  test("réglages enregistrés et relus", async () => {
    await setSettings({ guests_allowed: "1", moderation: "first", max_depth: "2" });
    const saved = JSON.parse(one("SELECT value FROM mk_settings WHERE key = 'comments.settings'").value);
    assert.equal(saved.moderation, "first"); assert.equal(saved.max_depth, 2); assert.equal(saved.guests_allowed, true);
    assert.match((await boss.get(SETTINGS)).text, /value="first" selected/);
  });
  test("modération « premier commentaire » : relu la première fois, libre ensuite", async () => {
    await setSettings({ guests_allowed: "1", moderation: "first" });
    const e = "premier@example.com";
    await guest("Mon premier mot", { author_email: e }, new Client(srv.base));
    assert.equal(byBody("Mon premier mot").status, "pending");
    await boss.post(`${ADMIN}/${byBody("Mon premier mot").id}/approuver`, { retour: ADMIN });
    await guest("Mon second mot", { author_email: e }, new Client(srv.base));
    assert.equal(byBody("Mon second mot").status, "approved");
  });
});
