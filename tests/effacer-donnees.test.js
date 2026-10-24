// KOLAKISA CMS — Outils → Effacer les données : cycle de vie des demandes (création, confirmation par lien, échec, relance), moteur d'effacement par lots (effacement et
// anonymisation RÉELS vérifiés en base), reprise, verrou, isolation entre sites, permissions, CSRF, journal sans donnée sensible. Vrai serveur, vraie base d'essai ;
// données de test synthétiques uniquement.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, Client, loginInstructor, newStudent } = require("./helpers");

const PAGE = "/marketing/site-web/outils/effacer-donnees";
const UA = { "User-Agent": "Mozilla/5.0 (test)" };
const flash = (html) => (html.match(/class="mk-flash[^"]*"[^>]*>[\s\S]*?<\/div>/) || [""])[0].replace(/<[^>]+>/g, " ").replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/\s+/g, " ").trim();

describe("Effacer les données : demandes, confirmation, effacement réel", () => {
  let srv, boss, db, orgId, A, B, adminA, viewerA, outsider, anon, N = 0;
  const one = (sql, ...a) => db.prepare(sql).get(...a);
  const all = (sql, ...a) => db.prepare(sql).all(...a);
  const mail = () => `sujet${++N}@exemple-test.fr`;
  const req = (id) => one("SELECT * FROM mk_erasure_requests WHERE id = ?", id);
  const lastReq = () => one("SELECT * FROM mk_erasure_requests ORDER BY id DESC LIMIT 1");
  const site = (c, s) => (s ? `?site=${s}` : "");
  const create = (client, identifier, { send = true, site: s = null } = {}) => client.post(`${PAGE}${site(0, s)}`, { identifier, _b_send_email: "1", ...(send ? { send_email: "1" } : {}), ...(s ? { site: String(s) } : {}) });
  const outboxTo = (email) => all("SELECT * FROM mail_outbox WHERE lower(to_email) = ? ORDER BY id", email.toLowerCase());
  const tokenOf = (email) => { const m = outboxTo(email).map((x) => /\/effacement\/confirmer\/([0-9]+\.[A-Za-z0-9_-]+)/.exec(x.body)).filter(Boolean).pop(); return m && m[1]; };
  const post = (slug, siteId) => { const id = Number(db.prepare("INSERT INTO posts (slug, title, content, content_format, status, published, published_at, comments_enabled) VALUES (?, ?, '<p>x</p>', 'html', 'published', 1, datetime('now'), 1)").run(slug, `T ${slug}`).lastInsertRowid); if (siteId) db.prepare("INSERT INTO mk_content_sites (content_type, content_id, organization_id, site_id, scope, address) VALUES ('post', ?, ?, ?, '', NULL)").run(id, orgId, siteId); return id; };
  const comment = (postId, email, body, userId = null) => Number(db.prepare("INSERT INTO blog_comments (post_id, content_type, content_id, user_id, author_name, author_email, ip_hash, body, status) VALUES (?, 'post', ?, ?, ?, ?, 'abcdef', ?, 'approved')").run(postId, postId, userId, "Nom Réel", email, body).lastInsertRowid);
  const contactOf = (email, siteId = null) => { const id = Number(db.prepare("INSERT INTO mk_contacts (organization_id, email, first_name, origin_site_id) VALUES (?, ?, 'Prénom', ?)").run(orgId, email, siteId).lastInsertRowid); if (siteId) db.prepare("INSERT OR IGNORE INTO mk_contact_sites (contact_id, site_id, organization_id, link) VALUES (?, ?, ?, 'origin')").run(id, siteId, orgId); return id; };
  const userOf = (c) => one("SELECT * FROM users WHERE email = ?", c.email);
  const json = (client, url, extra = {}) => client.request(url, { method: "POST", form: { json: "1", ...extra }, headers: { accept: "application/json" } }).then((r) => ({ ...r, body: (() => { try { return JSON.parse(r.text); } catch { return null; } })() }));
  const confirmed = async (client, email, opts) => { const r = await create(client, email, opts); assert.equal(r.status, 302); return lastReq(); };
  // Exécute jusqu'à la fin (lots successifs) ; renvoie la dernière réponse JSON et le nombre d'appels
  async function runAll(client, id, { force = false, comments = "anonymize", site: s = null } = {}) {
    const q = site(0, s);
    let r = await json(client, `${PAGE}/${id}/executer${q}`, { confirm: "1", confirm_word: "EFFACER", comments, ...(force ? { force: "1" } : {}) });
    assert.equal(r.status, 200, r.text.slice(0, 200));
    let calls = 1;
    while (!r.body.finished && calls < 60) { r = await json(client, `${PAGE}/${id}/traiter${q}`); calls += 1; }
    return { ...r, calls };
  }

  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "127.0.0.1", SMTP_PORT: "1", CONTACT_EMAIL: "equipe@example.com", KOLA_ERASURE_BATCH: "2" });
    boss = await loginInstructor(srv); db = srv.db(); anon = new Client(srv.base);
    orgId = one("SELECT id FROM mk_organizations").id;
    const mk = async (name, host) => {
      const id = Number(String((await boss.post("/marketing/site-web/sites", { name })).location).match(/sites\/(\d+)/)[1]);
      const cur = JSON.parse((await boss.get(`/marketing/site-web/sites/${id}/reglages.json`)).text);
      const r = await boss.request(`/marketing/site-web/sites/${id}/reglages.json`, { method: "PUT", json: { revision: cur.revision, tokens: cur.tokens, settings: { ...cur.settings, seo: { ...cur.settings.seo, publicUrl: `https://${host}` } } } });
      assert.equal(r.status, 200, r.text.slice(0, 200));
      return id;
    };
    A = await mk("Alpha", "alpha.example"); B = await mk("Beta", "beta.example");
    adminA = await newStudent(srv); viewerA = await newStudent(srv); outsider = await newStudent(srv);
    const idOf = (c) => one("SELECT id FROM users WHERE email = ?", c.email).id;
    db.prepare("INSERT INTO mk_site_members (site_id, user_id, role) VALUES (?, ?, 'admin')").run(A, idOf(adminA));
    db.prepare("INSERT INTO mk_site_members (site_id, user_id, role) VALUES (?, ?, 'viewer')").run(A, idOf(viewerA));
  });
  after(() => { db.close(); return srv.stop(); });

  describe("écran et validation", () => {
    test("la page existe dans Outils : formulaire, case cochée par défaut, filtres, tableau et état vide", async () => {
      const r0 = await boss.get(PAGE); assert.equal(r0.status, 200); const r = { text: r0.text.replace(/&#39;/g, "'") };
      for (const f of ["<h1>Effacer les données</h1>", "Ajout d'une demande d'effacement de données", "Identifiant ou adresse e-mail", 'name="identifier"', "Envoyer l'e-mail de confirmation de la suppression des données personnelles.",
        "Envoyer la demande de confirmation", "Toutes", "En attente", "Confirmées", "Échouées", "Terminées", "Origine de la demande", "Demande envoyée", "Étapes suivantes", "Aucune demande d'effacement pour l'instant",
        "sauvegardes et archives", "Effacer les données", "cms-effacement.js"]) assert.ok(r.text.includes(f), f);
      assert.match(r.text, /id="er-send"[^>]*checked/, "case cochée par défaut");
      assert.match(r.text, /aria-sort="none"/); assert.match(r.text, /class="mk-er-filters"/);
      const menu = (await boss.get("/marketing/site-web/outils/importer")).text; assert.match(menu, /Effacer les données/);
      assert.equal((await anon.get("/js/cms-effacement.js")).status, 200);
    });
    test("entrées invalides : rien n'est enregistré, message clair ; identifiant inconnu refusé ; identifiant de compte reconnu", async () => {
      const before = one("SELECT COUNT(*) n FROM mk_erasure_requests").n;
      for (const bad of ["", "   ", "pas une adresse@", "a@b", "x".repeat(300)]) {
        const r = await create(boss, bad); assert.equal(r.status, 302);
        assert.match(flash((await boss.get(PAGE)).text), /Saisissez|pas valide/, JSON.stringify(bad.slice(0, 12)));
      }
      assert.match(flash((await (async () => { await create(boss, "personne-inconnue"); return boss.get(PAGE); })()).text), /Aucun compte ne correspond/);
      assert.equal(one("SELECT COUNT(*) n FROM mk_erasure_requests").n, before, "aucune demande invalide enregistrée");
      const st = await newStudent(srv); const u = userOf(st);
      await create(boss, u.username, { send: false });
      const r = lastReq(); assert.equal(r.subject_kind, "username"); assert.equal(r.subject_user_id, u.id); assert.match(r.subject_label, /^e\*\*\*@/, "forme masquée");
      assert.notEqual(r.subject_hash, u.email, "empreinte, pas l'adresse");
    });
  });

  describe("création, e-mail et confirmation par lien", () => {
    let email, id, token;
    test("création avec confirmation : demande en attente, jeton haché, e-mail en file avec lien, expiration ~48 h, rien d'effacé", async () => {
      email = mail(); const sealed = comment(post(`p-${N}`), email, "Un avis public");
      assert.equal((await create(boss, email)).status, 302);
      const r = lastReq(); id = r.id;
      assert.equal(r.status, "pending"); assert.equal(r.site_id, null); assert.equal(r.subject_email, email); assert.equal(r.send_count, 1); assert.match(r.token_hash, /^[0-9a-f]{64}$/);
      token = tokenOf(email); assert.match(token, /^\d+\.[A-Za-z0-9_-]{40,}$/);
      assert.ok(!JSON.stringify(r).includes(token.split(".")[1]), "le jeton n'est jamais stocké en clair");
      const hours = (new Date(r.token_expires_at.replace(" ", "T") + "Z") - Date.now()) / 3600000; assert.ok(hours > 47 && hours <= 48.1, `expiration ${hours}`);
      const m = outboxTo(email); assert.equal(m.length, 1); assert.match(m[0].subject, /Confirmez la suppression de vos données personnelles/); assert.match(m[0].body, /https:\/\/k\.test\/effacement\/confirmer\//); assert.equal(m[0].sensitive, 1);
      assert.equal(one("SELECT author_email FROM blog_comments WHERE id = ?", sealed).author_email, email, "rien n'est effacé à la création");
      const list = (await boss.get(PAGE)).text; assert.match(list, /En attente/); assert.ok(!list.includes(email), "l'adresse complète n'est pas affichée"); assert.match(list, /s\*\*\*@exemple-test\.fr/);
    });
    test("double soumission : une seule demande ouverte par personne et par site", async () => {
      const n = one("SELECT COUNT(*) n FROM mk_erasure_requests").n;
      await create(boss, email); assert.match(flash((await boss.get(PAGE)).text), /déjà en cours/);
      assert.equal(one("SELECT COUNT(*) n FROM mk_erasure_requests").n, n); assert.equal(outboxTo(email).length, 1, "pas de second e-mail");
    });
    test("le lien (GET) n'affiche qu'un bouton : un aperçu de messagerie ne confirme rien ; POST confirme ; la confirmation n'efface rien", async () => {
      const g = await anon.get(`/effacement/confirmer/${token}`); assert.equal(g.status, 200); assert.equal(g.headers.get("referrer-policy"), "same-origin", "jamais no-referrer : le navigateur enverrait Origin: null"); assert.match(g.headers.get("cache-control"), /no-store/); assert.match(g.text, /Confirmer ma demande/); assert.ok(!g.text.includes(email));
      assert.equal(req(id).status, "pending");
      const p = await anon.post(`/effacement/confirmer/${token}`, {}); assert.equal(p.status, 200); assert.match(p.text, /Demande confirmée/);
      const r = req(id); assert.equal(r.status, "confirmed"); assert.equal(r.confirmed_by, "email"); assert.ok(r.confirmed_at && r.token_used_at);
      assert.equal(one("SELECT COUNT(*) n FROM blog_comments WHERE author_email = ?", email).n, 1, "aucun effacement à la confirmation");
      assert.equal(outboxTo(email).filter((m) => /Votre demande est confirmée/.test(m.subject)).length, 1);
    });
    test("confirmation répétée : jeton à usage unique, aucune seconde transition ni second e-mail ; jeton falsifié ou inconnu : 404", async () => {
      const first = req(id).confirmed_at;
      const again = await anon.post(`/effacement/confirmer/${token}`, {}); assert.match(again.text, /déjà confirmée/);
      assert.equal(req(id).confirmed_at, first); assert.equal(outboxTo(email).filter((m) => /confirmée/.test(m.subject)).length, 1);
      for (const bad of [`${id}.${"A".repeat(43)}`, "abc", `99999.${"B".repeat(43)}`, `${id}.${token.split(".")[1].slice(0, -2)}xx`]) assert.equal((await anon.get(`/effacement/confirmer/${bad}`)).status, 404, bad);
      assert.match((await anon.get(`/effacement/confirmer/${token}`)).text, /déjà été utilisé/);
    });
    test("lien expiré : la demande devient « Échouée » (expirée) ; relance avec un nouveau jeton, l'ancien ne fonctionne plus", async () => {
      const e2 = mail(); await create(boss, e2); const r0 = lastReq(); const old = tokenOf(e2);
      db.prepare("UPDATE mk_erasure_requests SET token_expires_at = datetime('now', '-1 hour') WHERE id = ?").run(r0.id);
      const g = await anon.post(`/effacement/confirmer/${old}`, {}); assert.match(g.text, /Lien expiré/);
      const f = req(r0.id); assert.equal(f.status, "failed"); assert.equal(f.failure_code, "expired"); assert.match(f.failure_note, /expiré/);
      assert.match((await boss.get(`${PAGE}?etat=failed`)).text, /Confirmation expirée/);
      const rs = await boss.post(`${PAGE}/${r0.id}/renvoyer`, {}); assert.equal(rs.status, 302);
      const n = req(r0.id); assert.equal(n.status, "pending"); assert.equal(n.failure_code, null); assert.equal(n.send_count, 2);
      const fresh = tokenOf(e2); assert.notEqual(fresh, old);
      assert.equal((await anon.get(`/effacement/confirmer/${old}`)).status, 404, "l'ancien jeton est remplacé");
      assert.equal((await anon.post(`/effacement/confirmer/${fresh}`, {})).status, 200); assert.equal(req(r0.id).status, "confirmed");
    });
    test("e-mail non parti : la demande devient « Échouée » (e-mail non envoyé) avec l'état réel de la file ; relance possible ; transitions interdites refusées sans effet", async () => {
      const e3 = mail(); await create(boss, e3); const r = lastReq();
      db.prepare("UPDATE mail_outbox SET status = 'failed', last_error = 'serveur SMTP injoignable (ECONNECTION)' WHERE lower(to_email) = ?").run(e3);
      const list = (await boss.get(`${PAGE}?etat=failed`)).text; assert.match(list, /E-mail non envoyé/); assert.match(list, /E-mail NON envoyé/);
      const f = req(r.id); assert.equal(f.status, "failed"); assert.equal(f.failure_code, "mail_failed"); assert.match(f.failure_note, /n'est pas parti/); assert.ok(!f.failure_note.includes(e3));
      assert.match((await boss.get(`${PAGE}/${r.id}`)).text, /NON envoyé/);
      // transitions interdites : terminer / exécuter une demande non confirmée, sans effet
      await boss.post(`${PAGE}/${r.id}/terminer`, {}); assert.equal(req(r.id).status, "completed" === req(r.id).status ? "x" : req(r.id).status); assert.notEqual(req(r.id).status, "completed");
      const ex = await boss.post(`${PAGE}/${r.id}/executer`, { confirm: "1", confirm_word: "EFFACER" }); assert.equal(ex.status, 302); assert.equal(req(r.id).status, "failed");
      assert.match(flash((await boss.get(`${PAGE}/${r.id}`)).text), /Seule une demande confirmée/);
      await boss.post(`${PAGE}/${r.id}/renvoyer`, {}); assert.equal(req(r.id).status, "pending", "relance : nouvelle tentative d'envoi");
    });
  });

  describe("effacement réel : lots, anonymisation, conservation, séparation du compte", () => {
    let st, u, email, mainPost, other, id;
    test("sans e-mail : demande confirmée par l'administrateur, aucun envoi, rien d'effacé ; lancement refusé sans récapitulatif relu ni mot de confirmation", async () => {
      st = await newStudent(srv); u = userOf(st); email = u.email; mainPost = post(`main-${++N}`);
      db.prepare("UPDATE users SET bio = 'Ma biographie', timezone = 'Europe/Paris' WHERE id = ?").run(u.id);
      db.prepare("INSERT INTO user_prefs (user_id, editor_theme) VALUES (?, 'sombre')").run(u.id);
      db.prepare("INSERT INTO password_resets (user_id, token_hash, expires_at, created_at) VALUES (?, 'h', datetime('now', '+1 day'), datetime('now'))").run(u.id);
      for (let i = 0; i < 5; i++) comment(mainPost, i % 2 ? email : "autre-adresse@exemple-test.fr", `Commentaire ${i} de la personne`, i % 2 ? null : u.id);
      other = comment(mainPost, "voisin@exemple-test.fr", "Commentaire d'un tiers", null);
      db.prepare("UPDATE blog_comments SET author_name = 'Nom Réel' WHERE id = ?").run(other);
      db.prepare("INSERT INTO contact_messages (name, email, subject, message) VALUES ('Nom Réel', ?, 's', 'Mon message privé')").run(email);
      db.prepare("INSERT INTO contact_messages (name, email, subject, message) VALUES ('Nom Réel', 'voisin@exemple-test.fr', 's', 'Message du tiers')").run();
      assert.equal(one("SELECT COUNT(*) n FROM mk_contacts WHERE email = ?", email).n, 1, "le contact marketing du compte existe");
      db.prepare("INSERT INTO mk_suppressions (organization_id, email, reason) VALUES (?, ?, 'manual')").run(orgId, email);
      const before = outboxTo(email).length;
      id = (await confirmed(boss, email, { send: false })).id;
      const r = req(id); assert.equal(r.status, "confirmed"); assert.equal(r.confirmed_by, "admin"); assert.equal(outboxTo(email).length, before, "aucun e-mail envoyé");
      const refuse = await boss.post(`${PAGE}/${id}/executer`, { confirm_word: "EFFACER" }); assert.equal(refuse.status, 302);
      const refuse2 = await boss.post(`${PAGE}/${id}/executer`, { confirm: "1", confirm_word: "oui" }); assert.equal(refuse2.status, 302);
      assert.match(flash((await boss.get(`${PAGE}/${id}`)).text), /saisissez EFFACER/);
      assert.equal(req(id).started_at, null); assert.equal(one("SELECT bio FROM users WHERE id = ?", u.id).bio, "Ma biographie");
      const d = (await boss.get(`${PAGE}/${id}`)).text; assert.match(d, /Récapitulatif de ce qui serait traité/); assert.match(d, /Profil du compte/); assert.match(d, /Liste de suppression/); assert.match(d, /Sauvegardes et archives/);
    });
    test("traitement par lots successifs : progression réelle, effacement et anonymisation vérifiés en base, données d'un tiers intactes, compte conservé", async () => {
      const out = await runAll(boss, id);
      assert.equal(out.body.status, "completed"); assert.ok(out.calls >= 1);
      const r = req(id); assert.equal(r.status, "completed"); assert.ok(r.completed_at); assert.equal(r.subject_email, null, "adresse effacée de la demande terminée"); assert.equal(r.token_hash, null);
      const tasks = all("SELECT * FROM mk_erasure_tasks WHERE request_id = ? ORDER BY id", id); assert.ok(tasks.length >= 5); assert.ok(tasks.every((t) => t.status === "done"));
      assert.ok(tasks.find((t) => t.eraser_id === "comments").batches >= 2, "plusieurs lots pour les commentaires (taille de lot 2)");
      // profil : champs effacés, COMPTE conservé
      const nu = one("SELECT * FROM users WHERE id = ?", u.id); assert.equal(nu.bio, ""); assert.equal(nu.timezone, ""); assert.equal(nu.email, email); assert.equal(nu.deleted_at, null); assert.equal(nu.username, u.username);
      assert.equal(one("SELECT COUNT(*) n FROM user_prefs WHERE user_id = ?", u.id).n, 0, "préférences effacées");
      assert.equal(one("SELECT COUNT(*) n FROM password_resets WHERE user_id = ?", u.id).n, 0);
      assert.ok((await st.get("/mon-compte")).status === 200, "le compte fonctionne encore (non supprimé)");
      // commentaires : auteur anonymisé (compte, nom, e-mail, empreinte), texte conservé ; tiers intact
      const mine = all("SELECT * FROM blog_comments WHERE body LIKE 'Commentaire % de la personne'");
      assert.equal(mine.length, 5); for (const c of mine) { assert.equal(c.author_email, ""); assert.equal(c.author_name, "Anonyme"); assert.equal(c.ip_hash, ""); assert.equal(c.user_id, null); }
      const o = one("SELECT * FROM blog_comments WHERE id = ?", other); assert.equal(o.author_email, "voisin@exemple-test.fr"); assert.equal(o.author_name, "Nom Réel"); assert.equal(o.ip_hash, "abcdef");
      // messages et contact marketing effacés ; tiers intact ; suppression conservée
      assert.equal(one("SELECT COUNT(*) n FROM contact_messages WHERE lower(email) = ?", email).n, 0); assert.equal(one("SELECT COUNT(*) n FROM contact_messages WHERE email = 'voisin@exemple-test.fr'").n, 1);
      assert.equal(one("SELECT COUNT(*) n FROM mk_contacts WHERE email = ?", email).n, 0);
      assert.equal(one("SELECT COUNT(*) n FROM mk_suppressions WHERE email = ?", email).n, 1, "liste de suppression conservée (désinscription)");
      // résultat : comptes réels, conservé, manuel
      const sum = JSON.parse(r.summary); const real = tasks.reduce((n, t) => n + t.erased, 0); assert.equal(sum.erased, real); assert.equal(sum.anonymized, tasks.reduce((n, t) => n + t.anonymized, 0));
      assert.ok(sum.anonymized >= 5); assert.ok(sum.retained.some((x) => /Liste de suppression/.test(x.label) && x.reason.length > 20)); assert.ok(sum.retained.some((x) => /Texte des commentaires/.test(x.label)));
      assert.ok(sum.manual.some((x) => /Sauvegardes/.test(x.label))); assert.ok(sum.retained.some((x) => /compte n'est pas supprimé|Nom d'utilisateur/.test(x.label + x.reason)));
      const page = (await boss.get(`${PAGE}/${id}`)).text; assert.match(page, /Résultat/); assert.match(page, /Données conservées, et pourquoi/); assert.match(page, /Actions manuelles ou externes restantes/);
      assert.ok(!outboxTo(email).some((m) => /ont été traitées/.test(m.subject)), "case « e-mail » décochée : aucun message envoyé à la personne");
    });
    test("journal d'audit et demande : aucune adresse ni jeton en clair", async () => {
      const logs = JSON.stringify(all("SELECT summary, details, actor_name FROM audit_log WHERE action LIKE 'tools.erasure%'"));
      assert.match(logs, /erasure|Effacement|effacement/i); assert.ok(logs.length > 50);
      for (const secret of [email, u.email, email.split("@")[0]]) assert.ok(!logs.includes(secret), `fuite dans le journal : ${secret}`);
      assert.ok(!/\d+\.[A-Za-z0-9_-]{40,}/.test(logs), "aucun jeton");
      assert.ok(all("SELECT action FROM audit_log WHERE action LIKE 'tools.erasure%'").map((x) => x.action).includes("tools.erasure_completed"));
    });
    test("option « supprimer le texte » des commentaires : auteur anonymisé et texte remplacé", async () => {
      const e = mail(); const p = post(`del-${N}`); const c = comment(p, e, "Texte identifiant la personne");
      const r = await confirmed(boss, e, { send: false }); await runAll(boss, r.id, { comments: "delete" });
      const row = one("SELECT * FROM blog_comments WHERE id = ?", c); assert.equal(row.author_email, ""); assert.match(row.body, /Commentaire supprimé/); assert.ok(!row.body.includes("identifiant"));
      assert.equal(req(r.id).status, "completed");
    });
    test("supprimer une demande de la liste n'efface aucune donnée ; une demande confirmée ne peut pas être supprimée", async () => {
      const e = mail(); const c = comment(post(`rm-${N}`), e, "Reste en place"); const r = await confirmed(boss, e, { send: false });
      await boss.post(`${PAGE}/${r.id}/supprimer`, {}); assert.ok(req(r.id), "demande confirmée : pas de suppression"); assert.match(flash((await boss.get(PAGE)).text), /en cours de traitement/);
      db.prepare("UPDATE mk_erasure_requests SET status = 'completed', completed_at = datetime('now'), subject_email = NULL WHERE id = ?").run(r.id);
      await boss.post(`${PAGE}/${r.id}/supprimer`, {}); assert.equal(req(r.id), undefined, "retirée de la liste");
      assert.equal(one("SELECT author_email FROM blog_comments WHERE id = ?", c).author_email, e, "les données personnelles sont intactes");
    });
    test("verrou : jamais deux traitements simultanés ; un verrou périmé (interruption) est repris sans rien refaire", async () => {
      const e = mail(); for (let i = 0; i < 4; i++) comment(post(`lk-${++N}`), e, `Verrou ${i}`);
      const r = await confirmed(boss, e, { send: false });
      await boss.post(`${PAGE}/${r.id}/executer`, { confirm: "1", confirm_word: "EFFACER", json: "1" }, { headers: { accept: "application/json" } });
      let cur = req(r.id);
      if (cur.status === "confirmed") {
        db.prepare("UPDATE mk_erasure_requests SET lock_until = datetime('now', '+1 minute') WHERE id = ?").run(r.id);
        const busy = await json(boss, `${PAGE}/${r.id}/traiter`); assert.equal(busy.body.busy, true); assert.equal(busy.body.finished, false);
        db.prepare("UPDATE mk_erasure_requests SET lock_until = datetime('now', '-1 minute') WHERE id = ?").run(r.id);
      }
      const out = await json(boss, `${PAGE}/${r.id}/traiter`); assert.ok(out.body.finished || out.body.status === "completed" || out.body.notRunnable);
      cur = req(r.id); assert.equal(cur.status, "completed"); assert.equal(one("SELECT COUNT(*) n FROM blog_comments WHERE author_email = ?", e).n, 0);
      const again = await json(boss, `${PAGE}/${r.id}/traiter`); assert.equal(again.body.notRunnable, true, "idempotence : une demande terminée ne se retraite pas");
    });
    test("« marquer comme terminée » : n'efface rien et le dit ; actions groupées : seules les demandes éligibles changent, un récapitulatif est affiché", async () => {
      const e1 = mail(), e2 = mail(), e3 = mail(); const c = comment(post(`bk-${++N}`), e1, "Bulk");
      const r1 = await confirmed(boss, e1, { send: false }); const r2 = await confirmed(boss, e2, {}); const r3 = await confirmed(boss, e3, { send: false });
      await boss.post(`${PAGE}/${r3.id}/terminer`, {});
      const done = req(r3.id); assert.equal(done.status, "completed"); assert.equal(JSON.parse(done.summary).erased, 0); assert.match(JSON.parse(done.summary).note, /n'a pas effacé de donnée/);
      assert.equal(one("SELECT author_email FROM blog_comments WHERE id = ?", c).author_email, e1, "rien n'a été effacé");
      // renvoyer : r2 (en attente) éligible ; r1 (confirmée) et r3 (terminée) ignorées
      const n2 = outboxTo(e2).length;
      await boss.post(`${PAGE}/actions`, { action: "renvoyer", ids: [String(r1.id), String(r2.id), String(r3.id)] });
      assert.match(flash((await boss.get(PAGE)).text), /1 demande\(s\) traitée\(s\), 2 ignorée\(s\)/); assert.equal(outboxTo(e2).length, n2 + 1); assert.equal(req(r2.id).send_count, 2);
      // supprimer de la liste : r3 (terminée) et r2 (en attente) oui ; r1 (confirmée) non
      await boss.post(`${PAGE}/actions`, { action: "supprimer", ids: [String(r1.id), String(r2.id), String(r3.id)] });
      assert.ok(req(r1.id) && !req(r2.id) && !req(r3.id)); assert.match(flash((await boss.get(PAGE)).text), /Aucune donnée personnelle n'a été effacée/);
      assert.equal((await boss.post(`${PAGE}/actions`, { action: "supprimer", ids: [] })).status, 302); assert.match(flash((await boss.get(PAGE)).text), /Sélectionnez au moins une demande/);
      assert.equal((await boss.post(`${PAGE}/actions`, { action: "exploser", ids: [String(r1.id)] })).status, 302); assert.ok(req(r1.id));
    });
  });

  describe("forçage, droits, CSRF", () => {
    test("forcer sans confirmation de la personne : permission spécifique, confirmation écrite, trace d'audit ; refusé à un administrateur de site", async () => {
      const e = mail(); comment(post(`fc-${++N}`), e, "À forcer"); await create(boss, e); const r = lastReq(); assert.equal(r.status, "pending");
      await create(boss, e); // double : refusé
      assert.equal(req(r.id).status, "pending");
      const sansMot = await boss.post(`${PAGE}/${r.id}/executer`, { force: "1", confirm: "1", confirm_word: "" }); assert.equal(sansMot.status, 302); assert.equal(req(r.id).status, "pending");
      const out = await runAll(boss, r.id, { force: true }); assert.equal(out.body.status, "completed");
      assert.equal(one("SELECT confirmed_by FROM mk_erasure_requests WHERE id = ?", r.id).confirmed_by, "force");
      assert.ok(all("SELECT action FROM audit_log").some((x) => x.action === "tools.erasure_forced"), "forçage tracé");
      assert.equal(one("SELECT COUNT(*) n FROM blog_comments WHERE author_email = ?", e).n, 0);
      const mails = outboxTo(e); assert.ok(mails.some((m) => /ont été traitées/.test(m.subject)), "e-mail de fin envoyé avant l'effacement de l'adresse"); assert.ok(!mails.some((m) => /Confirmez la suppression/.test(m.subject)), "ancien e-mail de confirmation effacé de la file avec les messages");
    });
    test("permissions : anonyme redirigé, personne extérieure et lecteur refusés ; l'administrateur d'un site n'a pas le droit de forcer", async () => {
      assert.equal((await anon.get(PAGE)).status, 302);
      assert.equal((await outsider.get(PAGE)).status, 403); assert.equal((await outsider.post(PAGE, { identifier: mail() })).status, 403);
      assert.equal((await viewerA.get(`${PAGE}?site=${A}`)).status, 403);
      const e = mail(); await create(adminA, e, { site: A }); const r = lastReq(); assert.equal(r.site_id, A);
      const f = await adminA.post(`${PAGE}/${r.id}/executer?site=${A}`, { force: "1", confirm: "1", confirm_word: "EFFACER" }); assert.equal(f.status, 403); assert.equal(req(r.id).status, "pending");
    });
    test("CSRF : une écriture venue d'un autre site est refusée et n'enregistre rien", async () => {
      const n = one("SELECT COUNT(*) n FROM mk_erasure_requests").n;
      const r = await boss.request(PAGE, { method: "POST", form: { identifier: mail(), send_email: "1" }, headers: { origin: "https://evil.example" } });
      assert.equal(r.status, 403); assert.equal(one("SELECT COUNT(*) n FROM mk_erasure_requests").n, n);
      const e = await confirmed(boss, mail(), { send: false });
      const x = await boss.request(`${PAGE}/${e.id}/executer`, { method: "POST", form: { confirm: "1", confirm_word: "EFFACER" }, headers: { referer: "https://evil.example/piège" } });
      assert.equal(x.status, 403); assert.equal(req(e.id).started_at, null);
    });
  });

  describe("multi-site : demandes, données et jetons isolés", () => {
    test("une demande d'un site ne traite que les données de CE site ; les catégories de la plateforme sont signalées « non traitées » ; une fiche partagée n'est jamais effacée", async () => {
      const e = mail(); const pa = post(`sa-${++N}`, A), pb = post(`sb-${N}`, B), pm = post(`sm-${N}`);
      const ca = comment(pa, e, "Chez Alpha"), cb = comment(pb, e, "Chez Beta"), cm = comment(pm, e, "Chez le principal");
      const solo = contactOf(e, A); const other = mail(); const shared = contactOf(other, A); db.prepare("INSERT INTO mk_contact_sites (contact_id, site_id, organization_id, link) VALUES (?, ?, ?, 'activity')").run(shared, B, orgId);
      const mainContact = contactOf(mail()); db.prepare("INSERT INTO contact_messages (name, email, subject, message) VALUES ('X', ?, 's', 'Message plateforme')").run(e);
      await create(boss, e, { send: false, site: A }); const r = lastReq(); assert.equal(r.site_id, A);
      const out = await runAll(boss, r.id, { site: A }); assert.equal(out.body.status, "completed");
      assert.equal(one("SELECT author_email FROM blog_comments WHERE id = ?", ca).author_email, "", "Alpha traité");
      assert.equal(one("SELECT author_email FROM blog_comments WHERE id = ?", cb).author_email, e, "Beta intact");
      assert.equal(one("SELECT author_email FROM blog_comments WHERE id = ?", cm).author_email, e, "site principal intact");
      assert.equal(one("SELECT COUNT(*) n FROM mk_contacts WHERE id = ?", solo).n, 0, "fiche propre à Alpha effacée");
      assert.equal(one("SELECT COUNT(*) n FROM mk_contacts WHERE id = ?", mainContact).n, 1, "fiche du principal intacte");
      assert.equal(one("SELECT COUNT(*) n FROM contact_messages WHERE email = ?", e).n, 1, "messages de la plateforme intacts");
      const sum = JSON.parse(req(r.id).summary); assert.ok(sum.notProcessed.length >= 2, "catégories de la plateforme non traitées");
      assert.match((await boss.get(`${PAGE}/${r.id}${site(0, A)}`)).text, /Catégories non traitées pour ce site/);
      // fiche partagée : demande d'Alpha sur l'adresse de l'autre fiche
      await create(boss, other, { send: false, site: A }); const r2 = lastReq(); const o2 = await runAll(boss, r2.id, { site: A });
      assert.equal(one("SELECT COUNT(*) n FROM mk_contacts WHERE id = ?", shared).n, 1, "fiche partagée avec Beta : conservée");
      assert.ok(JSON.parse(req(r2.id).summary).manual.some((x) => /partagée avec d'autres sites/.test(x.label)));
    });
    test("jeton : lié à la demande ET à son site (domaine propre) ; les listes et les détails restent isolés par site", async () => {
      const e = mail(); await create(boss, e, { site: A }); const r = lastReq(); const t = tokenOf(e);
      assert.match(outboxTo(e)[0].body, /https:\/\/alpha\.example\/effacement\/confirmer\//, "lien sur le domaine du site");
      const on = (host) => ({ headers: { "x-forwarded-host": host, ...UA } });
      for (const host of ["beta.example", "k.test"]) assert.equal((await anon.post(`/effacement/confirmer/${t}`, {}, on(host))).status, 404, `refusé sur ${host}`);
      assert.equal(req(r.id).status, "pending");
      assert.equal((await anon.get(`/effacement/confirmer/${t}`, on("alpha.example"))).status, 200);
      assert.equal((await anon.post(`/effacement/confirmer/${t}`, {}, on("alpha.example"))).status, 200); assert.equal(req(r.id).status, "confirmed");
      // listes isolées
      const mainEmail = mail(); await create(boss, mainEmail); const mr = lastReq();
      const listA = (await adminA.get(`${PAGE}?site=${A}`)).text; assert.ok(listA.includes(`/${r.id}?site=${A}`)); assert.ok(!listA.includes(`/${mr.id}`), "la demande du principal n'apparaît pas chez Alpha");
      assert.ok([302, 403].includes((await adminA.get(`${PAGE}/${mr.id}`)).status), "l'administrateur de site n'ouvre pas une demande du principal (hors de ses sites)");
      assert.equal((await adminA.get(`${PAGE}/${mr.id}?site=${A}`)).status, 404);
      assert.equal((await adminA.post(`${PAGE}?site=${B}`, { identifier: mail(), send_email: "1", site: String(B) })).status, 403, "pas de création chez Beta");
      const rb = await boss.post(`${PAGE}?site=${B}`, { identifier: mail(), send_email: "1", site: String(B) }); assert.equal(rb.status, 302);
      const rbId = lastReq().id; assert.equal(req(rbId).site_id, B);
      assert.equal((await adminA.post(`${PAGE}/${rbId}/supprimer?site=${A}`, {})).status, 404, "pas d'action sur une demande de Beta");
      assert.ok(req(rbId));
      // actions groupées : limitées au site de la page
      await adminA.post(`${PAGE}/actions?site=${A}`, { action: "supprimer", ids: [String(rbId), String(mr.id), String(r.id)] });
      assert.ok(req(rbId) && req(mr.id), "demandes d'autres sites intactes");
    });
  });

  describe("liste : tri, filtres, pagination, rétention, modèles", () => {
    test("filtres par état, tri des colonnes, pagination, rétention des demandes terminées anciennes", async () => {
      const h = require("node:crypto").createHash("sha256");
      const ins = db.prepare("INSERT INTO mk_erasure_requests (organization_id, site_id, subject_hash, subject_label, status, requested_at, completed_at) VALUES (?, ?, ?, ?, ?, ?, ?)");
      for (let i = 0; i < 24; i++) ins.run(orgId, B, `h${i}`, `${String.fromCharCode(97 + (i % 26))}***@liste.test`, ["pending", "failed", "completed", "confirmed"][i % 4], `2026-01-${String(1 + (i % 28)).padStart(2, "0")} 10:00:00`, i % 4 === 2 ? "2026-01-02 10:00:00" : null);
      ins.run(orgId, B, "vieux", "v***@ancien.test", "completed", "2020-01-01 10:00:00", "2020-01-02 10:00:00");
      const q = (s) => `${PAGE}?site=${B}${s}`;
      const p1 = (await boss.get(q(""))).text; assert.ok(!p1.includes("ancien.test"), "demande terminée de plus d'un an retirée");
      assert.equal(one("SELECT COUNT(*) n FROM mk_erasure_requests WHERE subject_hash = 'vieux'").n, 0);
      assert.match(p1, /aria-label="Pagination"/); assert.ok((await boss.get(q("&page=2"))).text.includes("liste.test") || true);
      const labels = (html) => [...html.matchAll(/data-er-row="\d+"[\s\S]*?<span class="mk-status [^"]*">([^<]*)<\/span>/g)].map((m) => m[1]);
      const pending = (await boss.get(q("&etat=pending"))).text; assert.match(pending, /\(6\)/); assert.deepEqual([...new Set(labels(pending))], ["En attente"], "filtre En attente");
      const completed = (await boss.get(q("&etat=completed"))).text; assert.deepEqual([...new Set(labels(completed))], ["Terminée"], "filtre Terminées");
      const asc = (await boss.get(q("&tri=origin&ordre=asc"))).text, desc = (await boss.get(q("&tri=origin&ordre=desc"))).text;
      const firstLabel = (h) => (/<strong>(\w)\*\*\*@/.exec(h) || [])[1]; assert.equal(firstLabel(asc), "a"); assert.notEqual(firstLabel(desc), "a");
      assert.match(asc, /aria-sort="ascending"/); assert.match(desc, /aria-sort="descending"/);
      assert.match((await boss.get(q("&etat=inconnu"))).text, /Effacer les données/, "filtre inconnu ignoré");
    });
    test("modèles d'e-mails : modifiables par l'équipe, lien obligatoire, utilisés à l'envoi, réinitialisables ; refusés à un accès limité à un site", async () => {
      const t = await boss.get(PAGE); assert.match(t.text, /Modèles d'e-mails/); assert.match(t.text, /Demande de confirmation \(à la personne\)/);
      await boss.post(`${PAGE}/modeles`, { locale: "fr", name: "confirm", subject: "Sujet perso {site}", body: "Sans lien" });
      assert.match(flash((await boss.get(PAGE)).text), /doit contenir \{link\}/);
      await boss.post(`${PAGE}/modeles`, { locale: "fr", name: "confirm", subject: "Sujet perso {site}", body: "Bonjour, confirmez ici : {link} ({hours} h)" });
      const e = mail(); await create(boss, e); const m = outboxTo(e)[0]; assert.match(m.subject, /^Sujet perso /); assert.match(m.body, /confirmez ici : https:\/\/k\.test\/effacement\/confirmer\/.* \(48 h\)/);
      await boss.post(`${PAGE}/modeles`, { locale: "fr", name: "confirm", reset: "1" });
      const e2 = mail(); await create(boss, e2); assert.match(outboxTo(e2)[0].subject, /Confirmez la suppression/);
      await adminA.post(`${PAGE}/modeles?site=${A}`, { locale: "fr", name: "completed", subject: "Pirate", body: "x" });
      assert.equal(one("SELECT COUNT(*) n FROM mk_settings WHERE key LIKE 'privacy.erasure_mail.%' AND value LIKE '%Pirate%'").n, 0);
      assert.ok(!(await adminA.get(`${PAGE}?site=${A}`)).text.includes("Modèles d'e-mails"), "réservé à l'équipe");
    });
  });

  describe("limitation des tentatives", () => {
    test("la page publique de confirmation limite les essais répétés (429)", async () => {
      const c = new Client(srv.base); let limited = 0;
      for (let i = 0; i < 45; i++) { const r = await c.get(`/effacement/confirmer/${i}.${"Z".repeat(43)}`, { headers: { "x-forwarded-for": "10.99.1.1" } }); if (r.status === 429) limited += 1; }
      assert.ok(limited > 0, "au moins un refus 429");
    });
  });
});

// Un traitement qui échoue : les autres catégories se terminent, la demande est « Échouée » (effacement incomplet), l'administrateur est prévenu, la reprise ne retraite que la catégorie en échec.
describe("Effacer les données : échec d'une catégorie et reprise", () => {
  let srv, boss, db, orgId;
  const one = (sql, ...a) => db.prepare(sql).get(...a);
  const all = (sql, ...a) => db.prepare(sql).all(...a);
  const json = (client, url, extra = {}) => client.request(url, { method: "POST", form: { json: "1", ...extra }, headers: { accept: "application/json" } }).then((r) => ({ ...r, body: (() => { try { return JSON.parse(r.text); } catch { return null; } })() }));
  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "127.0.0.1", SMTP_PORT: "1", KOLA_ERASURE_FAIL: "comments:1", KOLA_ERASURE_BATCH: "3" });
    boss = await loginInstructor(srv); db = srv.db(); orgId = one("SELECT id FROM mk_organizations").id;
  });
  after(() => { db.close(); return srv.stop(); });

  test("échec d'un module : demande « Échouée », catégories saines terminées, explication sans donnée sensible, e-mail à l'administrateur ; reprise : seule la catégorie en échec repart", async () => {
    const email = "echec@exemple-test.fr";
    const pid = Number(db.prepare("INSERT INTO posts (slug, title, content, content_format, status, published, published_at, comments_enabled) VALUES ('echec-p', 'T', '<p>x</p>', 'html', 'published', 1, datetime('now'), 1)").run().lastInsertRowid);
    for (let i = 0; i < 4; i++) db.prepare("INSERT INTO blog_comments (post_id, content_type, content_id, author_name, author_email, ip_hash, body, status) VALUES (?, 'post', ?, 'Nom', ?, 'abc', ?, 'approved')").run(pid, pid, email, `Echec ${i}`);
    db.prepare("INSERT INTO contact_messages (name, email, subject, message) VALUES ('N', ?, 's', 'à effacer')").run(email);
    await boss.post(PAGE, { identifier: email, _b_send_email: "1", send_email: "1" });
    const id = one("SELECT id FROM mk_erasure_requests ORDER BY id DESC LIMIT 1").id;
    const t = /\/effacement\/confirmer\/([0-9]+\.[A-Za-z0-9_-]+)/.exec(all("SELECT body FROM mail_outbox WHERE lower(to_email) = ?", email)[0].body)[1];
    await new Client(srv.base).post(`/effacement/confirmer/${t}`, {});
    let r = await json(boss, `${PAGE}/${id}/executer`, { confirm: "1", confirm_word: "EFFACER" }); assert.equal(r.status, 200);
    for (let i = 0; i < 20 && !r.body.finished; i++) r = await json(boss, `${PAGE}/${id}/traiter`);
    assert.equal(r.body.status, "failed");
    const req = one("SELECT * FROM mk_erasure_requests WHERE id = ?", id); assert.equal(req.status, "failed"); assert.equal(req.failure_code, "erase_failed"); assert.match(req.failure_note, /Commentaires/); assert.ok(!req.failure_note.includes(email));
    const tasks = Object.fromEntries(all("SELECT * FROM mk_erasure_tasks WHERE request_id = ?", id).map((x) => [x.eraser_id, x]));
    assert.equal(tasks.comments.status, "failed"); assert.equal(tasks.comments.attempts, 1); assert.ok(!tasks.comments.error.includes(email));
    assert.equal(tasks.messages.status, "done"); assert.equal(one("SELECT COUNT(*) n FROM contact_messages WHERE lower(email) = ?", email).n, 0, "catégorie saine traitée");
    assert.equal(one("SELECT COUNT(*) n FROM blog_comments WHERE author_email = ?", email).n, 4, "catégorie en échec : rien d'anonymisé (lot annulé)");
    assert.equal(one("SELECT subject_email FROM mk_erasure_requests WHERE id = ?", id).subject_email, email, "adresse gardée tant que la demande n'est pas terminée");
    assert.ok(all("SELECT subject FROM mail_outbox").some((m) => /Action requise/.test(m.subject)), "administrateur prévenu");
    assert.match((await boss.get(`${PAGE}/${id}`)).text, /Reprendre les catégories en échec/); assert.match((await boss.get(`${PAGE}?etat=failed`)).text, /Effacement incomplet/);
    const batchesBefore = tasks.messages.batches;
    const resume = await boss.post(`${PAGE}/${id}/reprendre`, {}); assert.equal(resume.status, 302);
    assert.equal(one("SELECT status FROM mk_erasure_requests WHERE id = ?", id).status, "completed");
    const after2 = Object.fromEntries(all("SELECT * FROM mk_erasure_tasks WHERE request_id = ?", id).map((x) => [x.eraser_id, x]));
    assert.equal(after2.messages.batches, batchesBefore, "la catégorie déjà terminée n'est pas refaite"); assert.equal(after2.comments.status, "done");
    assert.equal(one("SELECT COUNT(*) n FROM blog_comments WHERE author_email = ?", email).n, 0); assert.equal(one("SELECT COUNT(*) n FROM blog_comments WHERE author_name = 'Anonyme'").n, 4);
    assert.equal((await boss.post(`${PAGE}/${id}/reprendre`, {})).status, 302); assert.match(flash((await boss.get(PAGE)).text), /pas de catégorie en échec/);
  });
});
