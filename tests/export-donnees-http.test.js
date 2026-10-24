// Outils → Exporter les données : parcours HTTP réel (écrans d'administration, droits, e-mails, liens publics, archive ZIP, isolation entre sites).
// Données exclusivement synthétiques ; le serveur de test n'a pas de SMTP : la file d'envoi est relue en base (statut réel, jamais supposé).
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, Client, loginInstructor, newStudent } = require("./helpers");
const access = require("../src/services/cmsAccess");
const zip = require("../src/services/privacy/exportEngine/zip");

describe("Exporter les données personnelles : HTTP réel", () => {
  let srv, boss, db, A, B, adminA, viewerA, adminB, outsider, anon;
  const one = (sql, ...a) => db.prepare(sql).get(...a);
  const all = (sql, ...a) => db.prepare(sql).all(...a);
  const SP = "/marketing/site-web/sites";
  const P = "/marketing/site-web/outils/donnees";
  const can = (role, perm) => access.permissionsOf(role).has(perm);
  const idOf = (c) => one("SELECT id FROM users WHERE email = ?", c.email).id;
  const mkSite = async (name) => Number(String((await boss.post(SP, { name })).location).match(/sites\/(\d+)/)[1]);
  const member = async (site, role) => { const c = await newStudent(srv); db.prepare("INSERT INTO mk_site_members (site_id, user_id, role) VALUES (?, ?, ?)").run(site, idOf(c), role); return c; };
  // Texte « lisible » d'une page : les apostrophes et esperluettes sont échappées par les gabarits (&#39;, &amp;)
  const decode = (t) => String(t).replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">");
  const follow = async (client, r) => { const out = r.location ? await client.get(r.location) : r; return { ...out, text: decode(out.text) }; };
  const flashOf = (t) => (String(t).match(/class="mk-flash[^"]*"[^>]*>.*?<p>([^<]*)<\/p>/s) || [])[1] || "(aucun message)";
  const row = (id) => one("SELECT * FROM cms_privacy_requests WHERE id = ?", id);
  const mailOf = (id, col) => one("SELECT * FROM mail_outbox WHERE id = ?", row(id)[col]);
  const tokenIn = (mail, kind) => mail.body.match(new RegExp(`/donnees-personnelles/${kind}/([A-Za-z0-9_-]+)`))[1];
  const EMAIL = "personne.synthetique@exemple.org";
  let orgId;

  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv); db = srv.db(); anon = new Client(srv.base);
    orgId = one("SELECT id FROM mk_organizations").id;
    A = await mkSite("Alpha Export"); B = await mkSite("Bravo Export");
    // La personne a un commentaire (invité) sur un contenu du site A et un contact rattaché à A ; rien sur B
    const post = Number(db.prepare("INSERT INTO posts (slug, title, content, published, status, published_at) VALUES ('article-export', 'Article export', '<p>x</p>', 1, 'published', datetime('now'))").run().lastInsertRowid);
    db.prepare("INSERT INTO mk_content_sites (content_type, content_id, organization_id, site_id) VALUES ('post', ?, ?, ?)").run(post, orgId, A);
    db.prepare("INSERT INTO blog_comments (post_id, content_type, content_id, author_name, author_email, body, status) VALUES (?, 'post', ?, 'Personne', ?, 'Commentaire synthétique du site Alpha', 'approved')").run(post, post, EMAIL);
    db.prepare("INSERT INTO mk_contacts (organization_id, email, first_name, source, status, origin_site_id) VALUES (?, ?, 'Personne', 'form', 'subscribed', ?)").run(orgId, EMAIL, A);
    adminA = await member(A, "admin"); viewerA = await member(A, "viewer"); adminB = await member(B, "admin"); outsider = await newStudent(srv);
  });
  after(() => { db.close(); return srv.stop(); });

  test("menu et page : « Exporter les données » est ouvert dans l'espace du site, avec formulaire, tableau et état vide", async () => {
    const framed = { ...(await adminA.get(`${SP}/${A}/outils/donnees`)) };
    assert.equal(framed.status, 200);
    assert.match(framed.text, /Exporter les données/);
    assert.doesNotMatch(framed.text, /Exporter les données[^<]{0,60}Bientôt/);
    const central = await boss.get(`${P}?site=${A}`); central.text = decode(central.text);
    assert.equal(central.status, 200);
    for (const re of [/Ajouter une demande d'exportation de données/, /Identifiant ou adresse e-mail/, /Envoyer un e-mail de confirmation d'exportation des données personnelles/, /checked/, /Envoyer la demande de confirmation/, /Toutes\s*<span[^>]*>\(0\)/, /Aucune demande d'exportation pour ce site/]) assert.match(central.text, re, String(re));
    assert.match(central.text, /cms-privacy-export\.js/);
  });

  test("droits : anonyme redirigé ; sans accès, autre site et lecteur refusés — en lecture comme en écriture", async () => {
    for (const url of [`${P}?site=${A}`, `${SP}/${A}/outils/donnees`]) {
      const a = await anon.get(url); assert.equal(a.status, 302); assert.match(a.location, /connexion/);
      assert.equal((await outsider.get(url)).status, 403, `sans accès ${url}`);
      assert.equal((await adminB.get(url)).status, 403, `autre site ${url}`);
      assert.equal((await viewerA.get(url)).status, can("viewer", "tools.export") ? 200 : 403, `lecteur ${url}`);
    }
    assert.equal((await anon.post(`${P}?site=${A}`, { identifiant: EMAIL, envoyer_email: "1" })).status, 302);
    for (const c of [outsider, adminB]) assert.equal((await c.post(`${P}?site=${A}`, { identifiant: EMAIL, envoyer_email: "1" })).status, 403);
    if (!can("viewer", "tools.export")) assert.equal((await viewerA.post(`${P}?site=${A}`, { identifiant: EMAIL, envoyer_email: "1" })).status, 403);
    assert.equal(one("SELECT COUNT(*) n FROM cms_privacy_requests").n, 0, "aucun refus n'a créé de demande");
  });

  test("création : entrée invalide expliquée, valide enregistrée et affichée ; e-mail de confirmation à la seule adresse saisie", async () => {
    for (const [input, re] of [["", /Saisissez un identifiant/], ["pas une adresse@", /pas valide|n'est pas valide/], ["compte-inexistant-xyz", /Aucun compte/]]) {
      const r = await adminA.post(`${P}?site=${A}`, { identifiant: input, envoyer_email: "1" });
      assert.equal(r.status, 302);
      assert.match((await follow(adminA, r)).text, re, input);
    }
    assert.equal(one("SELECT COUNT(*) n FROM cms_privacy_requests").n, 0);
    const created = await adminA.post(`${P}?site=${A}`, { identifiant: EMAIL, envoyer_email: "1" });
    assert.equal(created.status, 302);
    const page = (await follow(adminA, created)).text;
    assert.match(page, /Demande enregistrée/);
    assert.match(page, new RegExp(EMAIL.replace(/\./g, "\\.")));
    assert.match(page, /En attente de confirmation/);
    assert.match(page, /Toutes\s*<span[^>]*>\(1\)/);
    for (const re of [/Origine de la demande/, /Demande envoyée/, /Étapes suivantes/, /Renvoyer l'e-mail de confirmation/]) assert.match(page, re, String(re));
    const r = one("SELECT * FROM cms_privacy_requests");
    assert.equal(r.site_id, A); assert.equal(r.status, "pending_confirmation");
    const mail = mailOf(r.id, "confirm_mail_id");
    assert.equal(mail.to_email, EMAIL);
    assert.ok(!r.confirm_token_hash.includes(tokenIn(mail, "confirmer")));
    assert.equal((await adminA.post(`${P}?site=${A}`, { identifiant: EMAIL, envoyer_email: "1" })).status, 302);
    assert.equal(one("SELECT COUNT(*) n FROM cms_privacy_requests").n, 1, "une seule demande ouverte par personne");
  });

  test("sans e-mail : la confirmation explicite est exigée côté serveur, puis la demande est enregistrée comme confirmée par l'administrateur", async () => {
    const no = await boss.post(`${P}?site=${B}`, { identifiant: EMAIL });
    assert.match((await follow(boss, no)).text, /confirmez explicitement|explicitement/);
    assert.equal(one("SELECT COUNT(*) n FROM cms_privacy_requests WHERE site_id = ?", B).n, 0);
    const yes = await boss.post(`${P}?site=${B}`, { identifiant: EMAIL, confirmer_admin: "1" });
    assert.equal(yes.status, 302);
    const r = one("SELECT * FROM cms_privacy_requests WHERE site_id = ?", B);
    assert.equal(r.status, "confirmed"); assert.equal(r.confirm_mode, "admin"); assert.ok(r.confirmed_by);
    assert.equal(one("SELECT COUNT(*) n FROM mail_outbox WHERE to_email = ? AND kind = 'privacy_confirm' AND id > ?", EMAIL, one("SELECT confirm_mail_id c FROM cms_privacy_requests WHERE site_id = ?", A).c).n, 0, "aucun e-mail pour la demande directe");
  });

  test("confirmation publique : ouvrir le lien ne confirme rien, le bouton confirme une fois, le lien réutilisé ou inventé est refusé, les essais invalides sont limités", async () => {
    const req = one("SELECT * FROM cms_privacy_requests WHERE site_id = ?", A);
    const token = tokenIn(mailOf(req.id, "confirm_mail_id"), "confirmer");
    const get = await anon.get(`/donnees-personnelles/confirmer/${token}`);
    assert.equal(get.status, 200); assert.match(get.text, /Alpha Export/); assert.match(get.text, /Oui, je confirme/);
    assert.equal(get.headers.get("referrer-policy"), "same-origin", "le jeton ne part jamais vers un autre site"); assert.match(String(get.headers.get("cache-control")), /no-store/); assert.match(String(get.headers.get("x-robots-tag")), /noindex/);
    assert.equal(row(req.id).status, "pending_confirmation", "un GET ne confirme jamais");
    const ok = await anon.post(`/donnees-personnelles/confirmer/${token}`, {});
    assert.equal(ok.status, 200); assert.match(ok.text, /Demande confirmée/);
    assert.equal(row(req.id).status, "confirmed");
    assert.ok(!ok.text.includes(EMAIL), "la page publique ne révèle pas l'identité");
    const again = await anon.post(`/donnees-personnelles/confirmer/${token}`, {}); assert.equal(again.status, 404); assert.match(decode(again.text), /n'est plus valable/);
    const page = decode((await adminA.get(`${P}?site=${A}`)).text);
    assert.match(page, /Confirmée/); assert.match(page, /Générer l'export/);
  });

  test("génération : archive ZIP réelle, état « Export prêt », téléchargement réservé à l'administrateur du site, archive hors dossier public", async () => {
    const req = one("SELECT * FROM cms_privacy_requests WHERE site_id = ?", A);
    const notYet = one("SELECT * FROM cms_privacy_requests WHERE site_id = ?", B);
    const refused = await adminA.post(`${P}/${notYet.id}/generer?site=${A}`, {});
    assert.match((await follow(adminA, refused)).text, /introuvable/i, "la demande du site B n'est pas gérable depuis A");
    const gen = await adminA.post(`${P}/${req.id}/generer?site=${A}`, {});
    assert.equal(gen.status, 302);
    assert.match((await follow(adminA, gen)).text, /Export prêt/);
    const r = row(req.id);
    assert.equal(r.status, "ready"); assert.match(r.archive_file, /^[a-f0-9]{48}\.zip$/);
    const full = path.join(srv.dir, "data", "private-exports", `site-${A}`, r.archive_file);
    assert.ok(fs.existsSync(full));
    for (const url of [`/private-exports/site-${A}/${r.archive_file}`, `/uploads/private-exports/site-${A}/${r.archive_file}`, `/data/private-exports/site-${A}/${r.archive_file}`, `/${r.archive_file}`]) assert.equal((await anon.get(url)).status, 404, url);
    const dl = await adminA.get(`${P}/${req.id}/archive?site=${A}`);
    assert.equal(dl.status, 200); assert.equal(dl.headers.get("content-type"), "application/zip");
    assert.match(String(dl.headers.get("content-disposition")), /attachment; filename="donnees-personnelles-\d+\.zip"/); assert.match(String(dl.headers.get("cache-control")), /no-store/);
    const bytes = fs.readFileSync(full);
    const entries = Object.fromEntries(zip.read(bytes).map((e) => [e.name, e.data.toString("utf8")]));
    assert.match(entries["donnees-personnelles.html"], /Commentaire synthétique du site Alpha/);
    assert.equal(JSON.parse(entries["donnees.json"]).personne.adresse_email, EMAIL);
    // Accès refusés
    assert.equal((await anon.get(`${P}/${req.id}/archive?site=${A}`)).status, 302);
    assert.equal((await outsider.get(`${P}/${req.id}/archive?site=${A}`)).status, 403);
    assert.equal((await adminB.get(`${P}/${req.id}/archive?site=${A}`)).status, 403, "administrateur d'un autre site");
    assert.equal((await adminB.get(`${P}/${req.id}/archive?site=${B}`)).status, 404, "même identifiant depuis son propre site : introuvable");
    assert.equal((await boss.get(`${P}/${req.id}/archive?site=${B}`)).status, 404, "même l'équipe : l'archive du site A n'est pas lisible depuis le site B");
    if (!can("viewer", "tools.export")) assert.equal((await viewerA.get(`${P}/${req.id}/archive?site=${A}`)).status, 403);
  });

  test("isolation : la liste, le détail et l'état du site B ne montrent rien du site A", async () => {
    const listB = (await boss.get(`${P}?site=${B}`)).text;
    const listA = (await boss.get(`${P}?site=${A}`)).text;
    const reqA = one("SELECT id FROM cms_privacy_requests WHERE site_id = ?", A).id;
    const reqB = one("SELECT id FROM cms_privacy_requests WHERE site_id = ?", B).id;
    assert.ok(listA.includes(`data-px-row="${reqA}"`) && !listA.includes(`data-px-row="${reqB}"`));
    assert.ok(listB.includes(`data-px-row="${reqB}"`) && !listB.includes(`data-px-row="${reqA}"`));
    assert.equal((await boss.get(`${P}/${reqA}?site=${B}`)).status, 404);
    const stateB = JSON.parse((await boss.get(`${P}/etat.json?site=${B}`)).text);
    assert.deepEqual(stateB.requests.map((r) => r.id), [reqB]);
    assert.ok(!JSON.stringify(stateB).includes(EMAIL), "l'état ne contient aucune adresse");
    const detail = await adminA.get(`${P}/${reqA}?site=${A}`);
    assert.equal(detail.status, 200); assert.match(detail.text, /Résultat de l'export/); assert.match(detail.text, /Commentaires/); assert.match(detail.text, /Non applicable à ce site/);
    assert.equal((await adminB.get(`${P}/${reqA}?site=${A}`)).status, 403);
  });

  test("envoi du lien : e-mail à l'adresse vérifiée ; sans SMTP la demande n'est PAS « Envoyée » et l'erreur est visible ; lien personnel, temporaire, limité à son archive", async () => {
    const req = one("SELECT * FROM cms_privacy_requests WHERE site_id = ?", A);
    const send = await adminA.post(`${P}/${req.id}/envoyer?site=${A}`, {});
    const sentPage = (await follow(adminA, send)).text; assert.match(sentPage, /Le lien de téléchargement est en cours d'envoi/, flashOf(sentPage));
    const r = row(req.id);
    const mail = one("SELECT * FROM mail_outbox WHERE id = ?", r.delivery_mail_id);
    assert.equal(mail.to_email, EMAIL); assert.match(mail.body, /Alpha Export/);
    await new Promise((res) => setTimeout(res, 700));
    const page = (await adminA.get(`${P}?site=${A}`)).text;
    assert.doesNotMatch(page, /mk-px-st-ok">Envoyée/, "l'e-mail n'est pas parti : pas « Envoyée »");
    assert.match(page, /E-mail non envoyé/);
    assert.match(page, /Envoyer le lien à la personne/, "réessai possible sans régénérer");
    const sha = row(req.id).archive_sha256;
    const token = tokenIn(one("SELECT * FROM mail_outbox WHERE id = ?", row(req.id).delivery_mail_id), "telecharger");
    const g = await anon.get(`/donnees-personnelles/telecharger/${token}`);
    assert.equal(g.status, 200); assert.match(g.text, /Alpha Export/); assert.match(g.text, /Télécharger l'archive/);
    assert.equal(row(req.id).download_count, 0, "un GET ne télécharge ni ne compte rien");
    const f = await anon.post(`/donnees-personnelles/telecharger/${token}`, {});
    assert.equal(f.status, 200); assert.equal(f.headers.get("content-type"), "application/zip");
    assert.equal(row(req.id).download_count, 1); assert.equal(row(req.id).archive_sha256, sha);
    assert.equal((await new Client(srv.base).get(`/donnees-personnelles/telecharger/${"y".repeat(43)}`)).status, 404);
    assert.equal((await anon.get(`/donnees-personnelles/telecharger/${token}x`)).status, 404);
    // lien expiré
    db.prepare("UPDATE cms_privacy_requests SET download_expires_at = '2020-01-01 00:00:00' WHERE id = ?").run(req.id);
    assert.equal((await anon.post(`/donnees-personnelles/telecharger/${token}`, {})).status, 404);
  });

  test("actions groupées : récapitulatif, états contrôlés un par un, jamais de contournement", async () => {
    const reqA = one("SELECT id FROM cms_privacy_requests WHERE site_id = ?", A).id;
    const reqB = one("SELECT id FROM cms_privacy_requests WHERE site_id = ?", B).id;
    const none = await adminA.post(`${P}/groupe?site=${A}`, { action_groupee: "supprimer" });
    assert.match((await follow(adminA, none)).text, /Sélectionnez au moins une demande/);
    const r = await adminA.post(`${P}/groupe?site=${A}`, [["action_groupee", "supprimer"], ["ids", String(reqA)], ["ids", String(reqB)], ["ids", "999"]]);
    const text = (await follow(adminA, r)).text;
    assert.match(text, /0 demande\(s\) traitée\(s\), 3 refusée\(s\)/, flashOf(text));
    assert.ok(row(reqA) && row(reqB), "rien n'a été supprimé : état non terminal / autre site / inconnu");
    const bad = await adminA.post(`${P}/groupe?site=${A}`, [["action_groupee", "pirate"], ["ids", String(reqA)]]);
    assert.match((await follow(adminA, bad)).text, /Choisissez une action groupée/);
  });

  test("états terminaux : relancer, supprimer (archive comprise) et durées réglables ; tout reste borné au site", async () => {
    const reqA = one("SELECT id FROM cms_privacy_requests WHERE site_id = ?", A).id;
    const file = path.join(srv.dir, "data", "private-exports", `site-${A}`, row(reqA).archive_file);
    assert.ok(fs.existsSync(file));
    const tooEarly = await adminA.post(`${P}/${reqA}/supprimer?site=${A}`, {});
    assert.match((await follow(adminA, tooEarly)).text, /terminée/);
    db.prepare("UPDATE cms_privacy_requests SET status = 'sent' WHERE id = ?").run(reqA);
    assert.equal((await adminB.post(`${P}/${reqA}/supprimer?site=${A}`, {})).status, 403);
    assert.ok(row(reqA));
    const del = await adminA.post(`${P}/${reqA}/supprimer?site=${A}`, {});
    assert.match((await follow(adminA, del)).text, /Demande supprimée avec son archive/);
    assert.equal(row(reqA), undefined); assert.ok(!fs.existsSync(file));
    assert.ok(one("SELECT 1 FROM mk_contacts WHERE email = ?", EMAIL), "les données sources sont intactes");
    const bad = await adminA.post(`${P}/reglages?site=${A}`, { confirm_hours: "0", link_hours: "72", archive_days: "7", keep_days: "180" });
    assert.match((await follow(adminA, bad)).text, /entre 1 et 720/);
    const good = await adminA.post(`${P}/reglages?site=${A}`, { confirm_hours: "24", link_hours: "48", archive_days: "3", keep_days: "90" });
    assert.match((await follow(adminA, good)).text, /Durées enregistrées/);
    assert.match((await adminA.get(`${P}?site=${A}`)).text, /id="px-s-archive_days" name="archive_days" type="number" inputmode="numeric" min="1" value="3"/);
    assert.match((await boss.get(`${P}?site=${B}`)).text, /name="archive_days" type="number" inputmode="numeric" min="1" value="7"/, "l'autre site garde ses durées");
  });

  test("journal : les actions sont tracées sans adresse e-mail, sans jeton ni lien", async () => {
    const entries = all("SELECT action, summary, details FROM audit_log WHERE action LIKE 'tools.privacy_%'");
    assert.ok(entries.length >= 5);
    const blob = JSON.stringify(entries);
    assert.ok(!blob.includes(EMAIL) && !/donnees-personnelles\/(confirmer|telecharger)/.test(blob) && !/telecharger\/[A-Za-z0-9_-]{30}/.test(blob));
    assert.ok(entries.some((e) => e.action === "tools.privacy_confirm"), "confirmation publique tracée");
    assert.ok(entries.some((e) => e.action === "tools.privacy_download"));
  });
  test("essais invalides limités par adresse : après 10 refus, blocage temporaire (429) pour les deux liens", async () => {
    const flood = new Client(srv.base);
    let last; for (let i = 0; i < 12; i++) last = await flood.get(`/donnees-personnelles/confirmer/${"z".repeat(43)}`);
    assert.equal(last.status, 429);
    assert.equal((await flood.get(`/donnees-personnelles/telecharger/${"z".repeat(43)}`)).status, 429);
  });
});
