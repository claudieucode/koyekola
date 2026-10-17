// KOLAKISA CMS — palier 15 : Contact Core de bout en bout (vrai serveur, vraie base) : inscription, commentaires, formulaires,
// permissions, masquage des données sensibles, isolation entre sites (IDOR), fusion, archivage, export, XSS, performance.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, Client, loginInstructor, newStudent } = require("./helpers");

let srv, boss, db, anon, orgId, slug;
const one = (sql, ...a) => db.prepare(sql).get(...a);
const all = (sql, ...a) => db.prepare(sql).all(...a);
const count = (sql, ...a) => one(sql, ...a).n;
const C = "/marketing/contacts";
const U = "/marketing/site-web/utilisateurs";
const O = "/marketing/site-web/outils";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const idOf = (c) => one("SELECT id FROM users WHERE email = ?", c.email).id;
async function member(role) {
  const c = await newStudent(srv);
  db.prepare("INSERT INTO mk_org_members (organization_id, user_id, role) VALUES (?, ?, ?)").run(orgId, idOf(c), role);
  return c;
}
async function customMember(name, perms) {
  const r = await boss.post(`${U}/roles`, { name, description: "test", perm: perms });
  assert.ok([200, 302].includes(r.status), r.text.slice(0, 200));
  return member(one("SELECT key FROM mk_roles WHERE name = ?", name).key);
}
let seq = 0;
function addContact(fields = {}) {
  seq += 1;
  const f = { email: `c${seq}@ex.fr`, first_name: "", last_name: "", ...fields };
  const info = db.prepare("INSERT INTO mk_contacts (organization_id, email, first_name, last_name, phone, company, source, origin_site_id, lifecycle_stage, record_status, normalized_phone) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)")
    .run(orgId, f.email, f.first_name, f.last_name, f.phone || "", f.company || "", f.source || "manual", f.site || null, f.lifecycle || "contact", f.record || "active", f.nphone || "");
  return Number(info.lastInsertRowid);
}
async function waitRun(client, id, ms = 40000) {
  const end = Date.now() + ms;
  for (;;) {
    const p = JSON.parse((await client.get(`${O}/operations/${id}.json`)).text);
    if (["done", "failed", "cancelled"].includes(p.status)) return p;
    if (Date.now() > end) throw new Error("délai dépassé");
    await sleep(120);
  }
}

before(async () => {
  srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
  boss = await loginInstructor(srv);
  anon = new Client(srv.base);
  db = srv.db();
  orgId = one("SELECT id FROM mk_organizations").id;
});
after(() => srv.stop());

describe("inscription : un compte n'est pas un consentement", () => {
  test("créer un compte crée/associe la fiche (membre), lie le compte, journalise user.registered, sans aucun consentement", async () => {
    const s = await newStudent(srv);
    const uid = idOf(s);
    const c = one("SELECT * FROM mk_contacts WHERE email = ?", s.email);
    assert.ok(c, "fiche créée");
    assert.equal(c.lms_user_id, uid); assert.equal(c.lifecycle_stage, "member"); assert.equal(c.status, "unknown"); assert.equal(c.record_status, "active");
    assert.equal(count("SELECT COUNT(*) n FROM mk_consents WHERE contact_id = ?", c.id), 0);
    assert.equal(count("SELECT COUNT(*) n FROM mk_list_members WHERE contact_id = ?", c.id), 0);
    const ev = one("SELECT * FROM mk_events WHERE contact_id = ? AND name = 'user.registered'", c.id);
    assert.ok(ev); assert.equal(ev.object_type, "user"); assert.equal(ev.object_id, String(uid)); assert.equal(ev.source, "registration");
  });
  test("seule la case cochée enregistre un consentement (une preuve)", async () => {
    const email = "optin@test.local";
    const r = await new Client(srv.base).post("/inscription", { username: "optin1", email, password: "MotDePasseEleve123", marketing_optin: "on" });
    assert.equal(r.status, 302);
    const c = one("SELECT * FROM mk_contacts WHERE email = ?", email);
    assert.equal(c.status, "subscribed");
    assert.equal(count("SELECT COUNT(*) n FROM mk_consents WHERE contact_id = ?", c.id), 1);
  });
  test("un compte dont l'adresse est déjà une fiche s'y rattache sans changer son statut", async () => {
    const id = addContact({ email: "deja@test.local", first_name: "Déjà" });
    const r = await new Client(srv.base).post("/inscription", { username: "deja1", email: "deja@test.local", password: "MotDePasseEleve123" });
    assert.equal(r.status, 302);
    assert.equal(count("SELECT COUNT(*) n FROM mk_contacts WHERE email = 'deja@test.local'"), 1);
    const c = one("SELECT * FROM mk_contacts WHERE id = ?", id);
    assert.equal(c.lms_user_id, one("SELECT id FROM users WHERE email = 'deja@test.local'").id); assert.equal(c.status, "unknown");
  });
});

describe("commentaires : un commentaire n'abonne personne", () => {
  let post;
  before(async () => {
    post = one("INSERT INTO posts (slug, title, content, content_format, status, published, published_at, comments_enabled) VALUES ('cc-article', 'Article CC', '<p>x</p>', 'html', 'published', 1, datetime('now'), 1) RETURNING id, slug");
    await boss.post("/marketing/site-web/parametres/commentaires", { enabled_default: "1", guests_allowed: "1", moderation: "none", replies_allowed: "1", max_depth: "3", links_allowed: "1" });
  });
  const guest = async (email, body, ip) => {
    const c = new Client(srv.base);
    await c.get(`/blog/${post.slug}`);
    return c.post(`/blog/${post.slug}/commentaires`, { author_name: "Camille", author_email: email, body, form_token: srv.formToken() }, { headers: { "x-forwarded-for": ip } });
  };
  test("commentaire d'un invité sans fiche : événement rattaché à l'adresse, AUCUNE fiche créée, aucun consentement ni liste", async () => {
    const before = { contacts: count("SELECT COUNT(*) n FROM mk_contacts"), consents: count("SELECT COUNT(*) n FROM mk_consents"), lists: count("SELECT COUNT(*) n FROM mk_list_members") };
    const r = await guest("camille.invite@example.com", "Un commentaire d'invité", "10.20.0.1");
    assert.ok([200, 302].includes(r.status), String(r.status));
    const ev = one("SELECT * FROM mk_events WHERE name = 'comment.created' AND email = 'camille.invite@example.com'");
    assert.ok(ev, "événement enregistré"); assert.equal(ev.contact_id, null); assert.equal(ev.object_type, "comment");
    assert.equal(count("SELECT COUNT(*) n FROM mk_contacts"), before.contacts, "aucune fiche créée par un commentaire");
    assert.equal(count("SELECT COUNT(*) n FROM mk_consents"), before.consents); assert.equal(count("SELECT COUNT(*) n FROM mk_list_members"), before.lists);
    assert.ok(one("SELECT 1 FROM mk_events WHERE name = 'comment.approved' AND email = 'camille.invite@example.com'"));
  });
  test("un commentaire de quelqu'un qui a déjà une fiche s'y rattache ; la fiche créée plus tard récupère les événements antérieurs", async () => {
    const s = await newStudent(srv);
    await s.get(`/blog/${post.slug}`);
    const r = await s.post(`/blog/${post.slug}/commentaires`, { body: "Commentaire de membre" });
    assert.ok([200, 302].includes(r.status));
    const cid = one("SELECT id FROM mk_contacts WHERE email = ?", s.email).id;
    assert.ok(one("SELECT 1 FROM mk_events WHERE name = 'comment.created' AND contact_id = ?", cid));
    assert.equal(count("SELECT COUNT(*) n FROM mk_consents WHERE contact_id = ?", cid), 0);
    // Plus tard : formulaire avec la même adresse que le commentateur invité → ses commentaires rejoignent la fiche
    const id = Number(String((await boss.post("/marketing/formulaires", { name: "Lettre CC", consentText: "Oui, je veux recevoir les actualités." })).location).match(/(\d+)/)?.[1] || one("SELECT id FROM mk_forms WHERE name = 'Lettre CC'").id);
    db.prepare("UPDATE mk_forms SET double_optin = 0 WHERE name = 'Lettre CC'").run();
    await boss.post(`/marketing/formulaires/${one("SELECT id FROM mk_forms WHERE name = 'Lettre CC'").id}/publier`);
    slug = one("SELECT slug FROM mk_forms WHERE name = 'Lettre CC'").slug;
    const f = await new Client(srv.base).post(`/f/${slug}`, { ft: srv.formToken(), email: "camille.invite@example.com", consent: "1" });
    assert.equal(f.status, 302);
    const contact = one("SELECT * FROM mk_contacts WHERE email = 'camille.invite@example.com'");
    assert.equal(contact.lifecycle_stage, "lead"); assert.equal(contact.source, "form"); assert.equal(contact.source_detail, slug);
    assert.ok(one("SELECT 1 FROM mk_events WHERE name = 'comment.created' AND contact_id = ?", contact.id), "commentaire antérieur rattaché");
    const fe = one("SELECT * FROM mk_events WHERE name = 'form.submitted' AND contact_id = ?", contact.id);
    assert.equal(fe.object_type, "form");
  });
  test("un commentaire indésirable (robot) n'est pas journalisé", async () => {
    const c = new Client(srv.base);
    await c.get(`/blog/${post.slug}`);
    await c.post(`/blog/${post.slug}/commentaires`, { author_name: "Robot", author_email: "robot@example.com", body: "Achetez maintenant", contact_url: "http://spam.example", form_token: srv.formToken() }, { headers: { "x-forwarded-for": "10.20.0.9" } });
    assert.equal(count("SELECT COUNT(*) n FROM mk_events WHERE email = 'robot@example.com'"), 0);
  });
});

describe("permissions et données sensibles", () => {
  let cid, basic, full, editor, viewer, admin;
  before(async () => {
    cid = addContact({ email: "secret.personne@exemple.fr", first_name: "Sophie", last_name: "Secrète", phone: "+33 6 12 34 56 78", nphone: "+33612345678", company: "Discrète SA", source: "form" });
    db.prepare("INSERT INTO mk_events (organization_id, name, email, contact_id, source, occurred_at, metadata, created_at, object_type, object_id) VALUES (?, 'form.submitted', 'secret.personne@exemple.fr', ?, 'form', ?, ?, ?, 'form', '1')").run(orgId, cid, Date.now(), JSON.stringify({ email: "secret.personne@exemple.fr", note: "tel +33612345678" }), Date.now());
    basic = await customMember("Contacts sans sensibles", ["contacts.read"]);
    full = await customMember("Contacts avec sensibles", ["contacts.read", "contacts.view_sensitive", "events.view"]);
    editor = await member("editor"); viewer = await member("viewer"); admin = await member("admin");
  });
  test("sans le droit : adresse et numéro masqués dans la liste et la fiche, recherche par e-mail/numéro inopérante, export refusé", async () => {
    const list = (await basic.get(`${C}?q=Sophie`)).text;
    assert.match(list, /Secr[èe]te/); assert.doesNotMatch(list, /secret\.personne@exemple\.fr/); assert.match(list, /s•••@exemple\.fr/);
    const fiche = (await basic.get(`${C}/${cid}`)).text;
    assert.doesNotMatch(fiche, /secret\.personne@exemple\.fr/); assert.doesNotMatch(fiche, /\+33 6 12 34 56 78|\+33612345678|612345678/);
    assert.equal((await basic.get(`${C}?q=secret.personne`)).text.includes("s•••@exemple.fr"), false, "pas d'oracle par recherche d'e-mail");
    assert.equal((await basic.get(`${C}?q=0612345678`)).text.includes("s•••@exemple.fr"), false, "pas d'oracle par numéro");
    assert.equal((await basic.get(`${C}/export.csv`)).status, 403);
    assert.equal((await basic.get(`${C}/${cid}/evenements.json`)).status, 403, "journal : droit events.view requis");
  });
  test("avec le droit : tout est visible ; le journal est lisible", async () => {
    const list = (await full.get(`${C}?q=secret.personne`)).text;
    assert.match(list, /secret\.personne@exemple\.fr/);
    assert.match((await full.get(`${C}/${cid}`)).text, /secret\.personne@exemple\.fr/);
    const ev = JSON.parse((await full.get(`${C}/${cid}/evenements.json`)).text);
    assert.equal(ev.events[0].type, "form.submitted"); assert.equal(ev.events[0].objectType, "form");
  });
  test("journal JSON sans le droit « sensibles » : données associées retirées", async () => {
    const r = await customMember("Journal sans sensibles", ["contacts.read", "events.view"]);
    const ev = JSON.parse((await r.get(`${C}/${cid}/evenements.json`)).text);
    assert.deepEqual(ev.events[0].metadata, {});
  });
  test("lecteur : voit mais ne peut ni archiver, ni changer l'étape, ni fusionner, ni gérer les champs ; éditeur archive mais ne fusionne pas ; administrateur fusionne", async () => {
    assert.equal((await viewer.get(`${C}/${cid}`)).status, 200);
    for (const [path, body] of [[`${C}/${cid}/etat`, { etat: "archived" }], [`${C}/${cid}/cycle-de-vie`, { etape: "lead" }], [`${C}/fusion`, { maitre: cid, source: cid, confirmer: "1" }], ["/marketing/proprietes", { key: "zz", label: "ZZ", type: "text" }]]) {
      assert.equal((await viewer.post(path, body)).status, 403, `lecteur ${path}`);
    }
    assert.equal((await editor.get(`${C}/doublons`)).status, 403);
    assert.equal((await editor.get(`${C}/fusion?maitre=${cid}&source=${cid}`)).status, 403);
    assert.equal((await editor.post(`${C}/fusion`, { maitre: cid, source: cid, confirmer: "1" })).status, 403);
    assert.equal((await admin.get(`${C}/doublons`)).status, 200);
    // IDOR : identifiants inventés
    assert.equal((await boss.get(`${C}/999999`)).status, 404);
    assert.equal((await boss.get(`${C}/abc/evenements.json`)).status, 404);
  });
  test("archivage : l'éditeur archive, la fiche sort de la liste par défaut, reste visible en filtrant, et n'est jamais joignable ; rétablissement possible", async () => {
    const id = addContact({ email: "archive.moi@ex.fr", first_name: "Arche" });
    db.prepare("UPDATE mk_contacts SET status = 'subscribed' WHERE id = ?").run(id);
    db.prepare("INSERT INTO mk_consents (organization_id, contact_id, purpose, action, source, text_shown) VALUES (?, ?, 'marketing', 'granted', 'form', 'J''accepte')").run(orgId, id);
    assert.equal((await editor.post(`${C}/${id}/etat`, { etat: "archived" })).status, 302);
    assert.equal(one("SELECT record_status FROM mk_contacts WHERE id = ?", id).record_status, "archived");
    assert.doesNotMatch((await boss.get(`${C}?q=Arche`)).text, /archive\.moi@ex\.fr/);
    assert.match((await boss.get(`${C}?q=Arche&etat=archived`)).text, /archive\.moi@ex\.fr/);
    assert.match((await boss.get(`${C}/${id}`)).text, /Archivée/);
    assert.equal((await editor.post(`${C}/${id}/etat`, { etat: "active" })).status, 302);
    assert.equal(one("SELECT record_status FROM mk_contacts WHERE id = ?", id).record_status, "active");
    assert.equal((await editor.post(`${C}/${id}/etat`, { etat: "nimporte" })).status, 302, "valeur inconnue : refus propre, pas d'erreur serveur");
    assert.equal(one("SELECT record_status FROM mk_contacts WHERE id = ?", id).record_status, "active");
  });
});

describe("fusion par l'interface", () => {
  test("doublon par numéro → aperçu → confirmation obligatoire → fusion → alias, source conservée, journal conservé", async () => {
    const a = addContact({ email: "fa@ex.fr", first_name: "Fanny", phone: "+243 81 234 5678", nphone: "+243812345678" });
    const b = addContact({ email: "fb@ex.fr", last_name: "Banza", company: "KOLA", phone: "+243 81 234 5678", nphone: "+243812345678" });
    db.prepare("INSERT INTO mk_events (organization_id, name, email, contact_id, source, occurred_at, created_at) VALUES (?, 'page.viewed', 'fb@ex.fr', ?, 'cms', ?, ?)").run(orgId, b, Date.now(), Date.now());
    const dup = (await boss.get(`${C}/doublons`)).text;
    assert.match(dup, /Même numéro de téléphone/); assert.match(dup, /fa@ex\.fr/); assert.match(dup, /fb@ex\.fr/);
    const preview = (await boss.get(`${C}/fusion?maitre=${a}&source=${b}`)).text;
    assert.match(preview, /Ce qui va se passer/); assert.match(preview, /Il n'existe pas encore de bouton/);
    const noConfirm = await boss.post(`${C}/fusion`, { maitre: a, source: b });
    assert.equal(noConfirm.status, 302); assert.equal(one("SELECT record_status FROM mk_contacts WHERE id = ?", b).record_status, "active", "rien sans confirmation");
    const ok = await boss.post(`${C}/fusion`, { maitre: a, source: b, confirmer: "1" });
    assert.equal(ok.status, 302); assert.match(ok.location, new RegExp(`/contacts/${a}$`));
    const m = one("SELECT * FROM mk_contacts WHERE id = ?", a);
    assert.equal(m.last_name, "Banza"); assert.equal(m.company, "KOLA");
    assert.equal(one("SELECT record_status, merged_into_id FROM mk_contacts WHERE id = ?", b).merged_into_id, a);
    assert.equal(count("SELECT COUNT(*) n FROM mk_contact_aliases WHERE contact_id = ? AND email = 'fb@ex.fr'", a), 1);
    assert.ok(one("SELECT 1 FROM mk_events WHERE contact_id = ? AND name = 'page.viewed'", a), "événement rattaché au maître");
    assert.ok(one("SELECT 1 FROM mk_events WHERE contact_id = ? AND name = 'contact.merged'", a));
    const fiche = (await boss.get(`${C}/${a}`)).text;
    assert.match(fiche, /fb@ex\.fr/); assert.match(fiche, /conservées, archivées/);
    assert.match((await boss.get(`${C}/${b}`)).text, /a été fusionnée/);
    assert.equal((await boss.post(`${C}/fusion`, { maitre: a, source: b, confirmer: "1" })).status, 302);
    assert.equal(count("SELECT COUNT(*) n FROM mk_contact_merges WHERE master_id = ?", a), 1, "pas de seconde fusion");
  });
});

describe("isolation entre sites (accès limité à un site)", () => {
  let siteA, siteB, userA, cA, cB, cOrg;
  before(async () => {
    siteA = Number((await boss.post("/marketing/site-web/sites", { name: "Site Alpha" })).location.match(/sites\/(\d+)/)[1]);
    siteB = Number((await boss.post("/marketing/site-web/sites", { name: "Site Bravo" })).location.match(/sites\/(\d+)/)[1]);
    cA = addContact({ email: "alpha.contact@ex.fr", first_name: "Alpha", site: siteA });
    cB = addContact({ email: "bravo.contact@ex.fr", first_name: "Bravo", site: siteB });
    cOrg = addContact({ email: "principal.contact@ex.fr", first_name: "Principal" });
    userA = await newStudent(srv);
    db.prepare("INSERT INTO mk_site_members (site_id, user_id, role) VALUES (?, ?, 'viewer')").run(siteA, idOf(userA));
    db.prepare("INSERT INTO mk_events (organization_id, name, contact_id, source, occurred_at, created_at, site_id) VALUES (?, 'page.viewed', ?, 'cms', ?, ?, ?)").run(orgId, cOrg, Date.now(), Date.now(), siteA);
  });
  test("une personne limitée au site A ne voit que ses contacts ; les autres sites et l'organisation lui sont fermés", async () => {
    const list = (await userA.get(`${C}?site=${siteA}`)).text;
    assert.match(list, /alpha\.contact@ex\.fr/); assert.match(list, /principal\.contact@ex\.fr/, "contact ayant un événement sur ce site");
    assert.doesNotMatch(list, /bravo\.contact@ex\.fr/);
    assert.equal((await userA.get(`${C}?site=${siteB}`)).status, 403, "autre site");
    assert.equal((await userA.get(C)).status, 302, "sans site : renvoyée vers « Mes sites »");
    assert.equal((await userA.get(`${C}/${cB}?site=${siteA}`)).status, 404, "IDOR : contact d'un autre site, via son propre site");
    assert.equal((await userA.get(`${C}/${cB}?site=${siteB}`)).status, 403);
    assert.equal((await userA.get(`${C}/${cA}?site=${siteA}`)).status, 200);
    assert.equal((await userA.get(`${C}/${cB}/evenements.json?site=${siteA}`)).status, 404);
    // forcer un autre site dans les filtres ne change rien : le serveur impose le site
    assert.doesNotMatch((await userA.get(`${C}?site=${siteA}&etat=all&cycle=`)).text, /bravo\.contact@ex\.fr/);
  });
  test("elle ne peut rien écrire (archiver, fusionner, changer l'étape, ajouter)", async () => {
    for (const [path, body] of [[`${C}/${cA}/etat`, { etat: "archived", site: siteA }], [`${C}/${cA}/cycle-de-vie`, { etape: "lead", site: siteA }], [`${C}/fusion`, { maitre: cA, source: cOrg, confirmer: "1", site: siteA }], [C, { email: "intrus@ex.fr" }], [`${C}/${cA}/effacer`, { confirm: "on" }]]) {
      const r = await userA.post(path, body);
      assert.ok([403, 302].includes(r.status) && !(r.status === 302 && /\/contacts\/\d+$/.test(String(r.location)) && false), `${path} ${r.status}`);
    }
    assert.equal(one("SELECT record_status FROM mk_contacts WHERE id = ?", cA).record_status, "active");
    assert.equal(count("SELECT COUNT(*) n FROM mk_contacts WHERE email = 'intrus@ex.fr'"), 0);
    assert.equal(count("SELECT COUNT(*) n FROM mk_contacts WHERE id = ?", cA), 1);
  });
  test("un site peut filtrer pour l'équipe de l'organisation (liste par site)", async () => {
    const list = (await boss.get(`${C}?site=${siteB}`)).text;
    assert.match(list, /bravo\.contact@ex\.fr/); assert.doesNotMatch(list, /alpha\.contact@ex\.fr/);
  });
});

describe("export vers les Outils", () => {
  test("contacts : jamais coché d'office, réservé aux droits export + données sensibles, sans IP ni texte de preuve ni notes", async () => {
    const id = addContact({ email: "export.moi@ex.fr", first_name: "Expo", source: "form" });
    db.prepare("INSERT INTO mk_consents (organization_id, contact_id, purpose, action, source, text_shown, ip) VALUES (?, ?, 'marketing', 'granted', 'form', 'TEXTE-DE-PREUVE-UNIQUE', '203.0.113.0')").run(orgId, id);
    db.prepare("INSERT INTO mk_contact_notes (organization_id, contact_id, body) VALUES (?, ?, 'NOTE-INTERNE-UNIQUE')").run(orgId, id);
    const page = (await boss.get(`${O}/exporter`)).text;
    assert.match(page, /id="tl-t-contacts" name="types" value="contacts">/, "présent mais non coché");
    const r = await boss.post(`${O}/exporter`, { types: "contacts" });
    assert.equal(r.status, 302, r.text.slice(0, 200));
    const runId = Number(String(r.location).match(/exporter\/(\d+)/)[1]);
    assert.equal((await waitRun(boss, runId)).status, "done");
    const file = (await boss.get(`${O}/exporter/${runId}/fichier`)).text;
    const data = JSON.parse(file);
    const row = data.resources.contacts.find((c) => c.email === "export.moi@ex.fr");
    assert.ok(row); assert.equal(row.marketingConsent, "granted"); assert.equal(row.firstName, "Expo");
    assert.doesNotMatch(file, /TEXTE-DE-PREUVE-UNIQUE|203\.0\.113|NOTE-INTERNE-UNIQUE/);
    assert.ok(!data.resources.contacts.some((c) => c.recordStatus === "archived" || c.recordStatus === "merged"), "fiches fusionnées/archivées non exportées");
    // droits : administrateur d'outils sans les droits contacts
    const noContacts = await customMember("Outils sans contacts", ["tools.view", "tools.export", "contacts.read", "settings.read", "articles.read"]);
    const p2 = (await noContacts.get(`${O}/exporter`)).text;
    assert.match(p2, /id="tl-t-contacts"[^>]*disabled/);
    const r2 = await noContacts.post(`${O}/exporter`, { types: "contacts" });
    assert.equal(r2.status, 302); assert.doesNotMatch(String(r2.location), /exporter\/\d+/, "refusé : pas d'opération lancée");
  });
});

describe("sécurité d'affichage et performance", () => {
  test("XSS : noms, société, source et événements restent du texte", async () => {
    const id = addContact({ email: "xss@ex.fr", first_name: "<img src=x onerror=alert(1)>", last_name: "\"><script>alert(2)</script>", company: "<svg onload=alert(3)>", source: "api" });
    db.prepare("UPDATE mk_contacts SET source_detail = ? WHERE id = ?").run("<b onmouseover=alert(4)>", id);
    db.prepare("INSERT INTO mk_events (organization_id, name, contact_id, source, occurred_at, created_at, object_type, object_id) VALUES (?, 'form.submitted', ?, 'x<script>', ?, ?, 'form', '<i>1</i>')").run(orgId, id, Date.now(), Date.now());
    for (const url of [`${C}?q=xss`, `${C}/${id}`]) {
      const html = (await boss.get(url)).text;
      assert.doesNotMatch(html, /<img src=x onerror|<script>alert|<svg onload|<b onmouseover|<i>1<\/i>/, url);
    }
  });
  test("5 000 contacts et 20 000 événements : recherche, filtres, pagination et journal restent rapides et plafonnés", async () => {
    db.exec("BEGIN");
    const ins = db.prepare("INSERT INTO mk_contacts (organization_id, email, first_name, last_name, source, lifecycle_stage, normalized_phone, last_activity_at, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now', ?), datetime('now', ?))");
    for (let i = 0; i < 5000; i++) ins.run(orgId, `perf${i}@bulk.test`, `Prénom${i}`, `Nom${i % 97}`, i % 3 ? "form" : "import", i % 5 ? "lead" : "customer", i % 50 === 0 ? `+3361000${String(i).padStart(4, "0")}` : "", `-${i % 400} days`, `-${i % 900} days`);
    const first = one("SELECT id FROM mk_contacts WHERE email = 'perf0@bulk.test'").id;
    const evt = db.prepare("INSERT INTO mk_events (organization_id, name, contact_id, source, occurred_at, created_at, object_type, object_id) VALUES (?, 'page.viewed', ?, 'cms', ?, ?, 'page', ?)");
    for (let i = 0; i < 20000; i++) evt.run(orgId, first + (i % 50), 1_800_000_000_000 + i, 1_800_000_000_000 + i, String(i));
    db.exec("COMMIT");
    const timed = async (url) => { const t = Date.now(); const r = await boss.get(url); return { ms: Date.now() - t, r }; };
    const search = await timed(`${C}?q=Nom42&taille=25`);
    const filtered = await timed(`${C}?cycle=lead&source=form&consentement=none&inactifs=90&page=3`);
    const page = await timed(`${C}?page=40&taille=100`);
    for (const t of [search, filtered, page]) { assert.equal(t.r.status, 200); assert.ok(t.ms < 3000, `${t.ms} ms`); }
    assert.ok((search.r.text.match(/<tr>/g) || []).length <= 26, "page plafonnée à 25 lignes");
    const j = await timed(`${C}/${first}/evenements.json?limite=500`);
    const body = JSON.parse(j.r.text);
    assert.ok(body.events.length <= 100, "plafond du journal"); assert.ok(body.next);
    const j2 = JSON.parse((await boss.get(`${C}/${first}/evenements.json?avant=${body.next}&limite=100`)).text);
    assert.ok(j2.events.every((e) => !body.events.some((x) => x.id === e.id)), "curseur sans recouvrement");
    const plan = (sql, ...a) => all(`EXPLAIN QUERY PLAN ${sql}`, ...a).map((r) => r.detail).join(" | ");
    assert.match(plan("SELECT * FROM mk_events WHERE organization_id = 1 AND contact_id = 5 AND id < 100 ORDER BY id DESC LIMIT 31"), /idx_mk_events_contact_ledger/);
    assert.match(plan("SELECT normalized_phone, COUNT(*) FROM mk_contacts WHERE organization_id = 1 AND normalized_phone <> '' GROUP BY normalized_phone"), /idx_mk_contacts_phone/);
    assert.ok(JSON.stringify((await timed(`${C}/doublons`)).r.status) === "200");
  });
});

describe("API /api/v1/events : écriture du journal par recordEvent seulement", () => {
  let key, site;
  const call = (body, k = key, headers = {}) => new Client(srv.base).request("/api/v1/events", { method: "POST", json: body, headers: { authorization: `Bearer ${k}`, ...headers } });
  before(async () => {
    await boss.post("/marketing/api", { name: "Contact Core", scope: "write" });
    key = (await boss.get("/marketing/api")).text.match(/<code>(mk_live_[0-9a-f]{48})<\/code>/)[1];
    site = Number((await boss.post("/marketing/site-web/sites", { name: "Site API" })).location.match(/sites\/(\d+)/)[1]);
  });
  test("événement complet : contact, site, objet — source forcée à « api »", async () => {
    const id = addContact({ email: "api.core@ex.fr" });
    const r = await call({ name: "purchase.completed", contact_id: id, site_id: site, object_type: "order", object_id: 456, metadata: { total: 49 }, source: "usurpation" });
    assert.equal(r.status, 201, r.text);
    const ev = one("SELECT * FROM mk_events WHERE name = 'purchase.completed' AND contact_id = ?", id);
    assert.equal(ev.source, "api"); assert.equal(ev.site_id, site); assert.equal(ev.object_type, "order"); assert.equal(ev.object_id, "456"); assert.equal(ev.organization_id, orgId);
  });
  test("identifiants inventés ou invalides : refusés proprement (pas d'événement orphelin d'une autre organisation)", async () => {
    const before = count("SELECT COUNT(*) n FROM mk_events");
    for (const [body, status] of [[{ name: "a.b", contact_id: 99999999 }, 404], [{ name: "a.b", site_id: 99999999 }, 404], [{ name: "a.b", object_type: "../etc" }, 400], [{ name: "a.b", metadata: [1] }, 400], [{ name: "A B" }, 400]]) {
      assert.equal((await call(body)).status, status, JSON.stringify(body));
    }
    assert.equal(count("SELECT COUNT(*) n FROM mk_events"), before);
  });
  test("un événement ne se réécrit pas par l'API : même clé d'idempotence = même événement", async () => {
    const h = { "idempotency-key": "core-idem-1" };
    const a = JSON.parse((await call({ name: "order.created", email: "idem@ex.fr", metadata: { n: 1 } }, key, h)).text).data;
    const b = JSON.parse((await call({ name: "order.created", email: "idem@ex.fr", metadata: { n: 2 } }, key, h)).text).data;
    assert.equal(b.duplicate, true); assert.equal(a.id, b.id);
    assert.deepEqual(JSON.parse(one("SELECT metadata FROM mk_events WHERE id = ?", a.id).metadata), { n: 1 });
  });
});
