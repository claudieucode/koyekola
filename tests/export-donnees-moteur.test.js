// Export des données personnelles — moteur (collecteurs, ZIP, rapport) et cycle de vie des demandes, sur la VRAIE base (schéma de la plateforme + migrations marketing),
// avec des données exclusivement synthétiques. Aucun serveur HTTP ici : les écrans et liens publics sont testés dans export-donnees-http.test.js.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const TMP = fs.mkdtempSync(path.join(os.tmpdir(), "kola-export-"));
process.env.DATA_DIR = TMP;
process.env.SITE_URL = "https://k.test";
process.env.SMTP_HOST = "";
process.env.NODE_ENV = "test";
const db = require("../src/config/database");
const { migrate } = require("../src/marketing/db/migrate");
const { MIGRATIONS, quiet } = require("./marketing-helpers");
const zip = require("../src/services/privacy/exportEngine/zip");
const registry = require("../src/services/privacy/exportEngine/registry");
const engine = require("../src/services/privacy/exportEngine/build");
const requests = require("../src/services/privacy/exportRequests");
const outbox = require("../src/utils/outbox");

const EMAIL = "aïcha.test@exemple.org";
const NOW = new Date("2026-10-23T10:00:00Z");
const later = (ms) => new Date(NOW.getTime() + ms);
const H = 3600 * 1000;
let siteA, siteB, siteC, userId;
const ctxFor = (siteId, extra = {}) => ({ db, organizationId: 1, siteId, userId: 1, can: () => true, orgLevel: true, ...extra });
const tokenOf = (mailId, kind) => { const body = db.prepare("SELECT body FROM mail_outbox WHERE id = ?").get(mailId).body; return body.match(new RegExp(`/donnees-personnelles/${kind}/([A-Za-z0-9_-]+)`))[1]; };
const row = (id) => db.prepare("SELECT * FROM cms_privacy_requests WHERE id = ?").get(id);
const archiveEntries = (r) => zip.read(fs.readFileSync(path.join(requests.privateRoot(), r.site_id === null ? "main" : `site-${r.site_id}`, r.archive_file)));
const files = () => { const out = []; const walk = (d) => { if (!fs.existsSync(d)) return; for (const f of fs.readdirSync(d, { withFileTypes: true })) f.isDirectory() ? walk(path.join(d, f.name)) : out.push(path.join(d, f.name)); }; walk(requests.privateRoot()); return out; };
const fresh = () => { db.exec("DELETE FROM cms_privacy_requests;"); try { db.exec("DELETE FROM mail_outbox;"); } catch { /* table créée à la première mise en file */ } for (const f of files()) fs.rmSync(f, { force: true }); };

before(() => {
  migrate(db, { dir: MIGRATIONS, dbPath: ":memory:", log: quiet });
  db.exec("INSERT INTO mk_organizations (name, slug) VALUES ('Org test', 'org-test')");
  const site = (n) => Number(db.prepare("INSERT INTO mk_sites (organization_id, name, slug, tokens) VALUES (1, ?, ?, '{}')").run(n, n.toLowerCase()).lastInsertRowid);
  siteA = site("SiteA"); siteB = site("SiteB"); siteC = site("SiteC");
  // Compte et données de la plateforme (principal)
  db.prepare("INSERT INTO users (username, email, password_hash, role, bio) VALUES ('aicha', ?, 'HASH-SECRET-NE-PAS-EXPORTER', 'etudiant', 'Présentation 日本語 <b>gras</b>')").run(EMAIL);
  userId = Number(db.prepare("SELECT id FROM users WHERE username = 'aicha'").get().id);
  db.prepare("INSERT INTO users (username, email, password_hash, role) VALUES ('boss', 'boss@exemple.org', 'x', 'formateur')").run();
  db.prepare("INSERT INTO courses (instructor_id, title, slug) VALUES (2, 'Formation synthétique', 'formation-synth')").run();
  db.prepare("INSERT INTO sections (course_id, title) VALUES (1, 'S1')").run();
  db.prepare("INSERT INTO lessons (section_id, title) VALUES (1, 'Leçon 1')").run();
  db.prepare("INSERT INTO enrollments (user_id, course_id) VALUES (?, 1)").run(userId);
  db.prepare("INSERT INTO lesson_progress (user_id, lesson_id) VALUES (?, 1)").run(userId);
  db.prepare("INSERT INTO orders (user_id, total_cents) VALUES (?, 4900)").run(userId);
  db.prepare("INSERT INTO order_items (order_id, course_id, price_cents) VALUES (1, 1, 4900)").run();
  db.prepare("INSERT INTO certificates (code, user_id, course_id, student_name, course_title) VALUES ('CERT-1', ?, 1, 'Aïcha', 'Formation synthétique')").run(userId);
  db.prepare("INSERT INTO contact_messages (name, email, subject, message) VALUES ('Aïcha', ?, 'Sujet', 'Message synthétique')").run(EMAIL);
  // Commentaires : un sur un contenu du site A, un sur un contenu sans site (principal), un d'une AUTRE personne
  const post = (slug) => Number(db.prepare("INSERT INTO posts (slug, title, content, published, status, published_at) VALUES (?, ?, '<p>x</p>', 1, 'published', datetime('now'))").run(slug, `Article ${slug}`).lastInsertRowid);
  const pA = post("post-a"), pMain = post("post-main");
  db.prepare("INSERT INTO mk_content_sites (content_type, content_id, organization_id, site_id) VALUES ('post', ?, 1, ?)").run(pA, siteA);
  const comment = (postId, userIdv, email, body) => db.prepare("INSERT INTO blog_comments (post_id, content_type, content_id, user_id, author_name, author_email, body, status) VALUES (?, 'post', ?, ?, 'Aïcha', ?, ?, 'approved')").run(postId, postId, userIdv, email, body);
  comment(pA, null, EMAIL, "Commentaire invité sur le site A");
  comment(pMain, userId, "", "Commentaire du compte sur le principal");
  comment(pA, null, "autre@exemple.org", "Commentaire d'une autre personne");
  // Contact : rattaché au site A seulement (origine) ; événements et consentements sur A et sur le principal
  db.prepare("INSERT INTO mk_contacts (organization_id, email, first_name, last_name, phone, source, status, origin_site_id) VALUES (1, ?, 'Aïcha', 'Test', '+33100000000', 'form', 'subscribed', ?)").run(EMAIL, siteA);
  const ev = db.prepare("INSERT INTO mk_events (organization_id, name, email, contact_id, source, occurred_at, metadata, created_at, site_id) VALUES (1, ?, ?, 1, 'form', 1800000000000, ?, 1800000000000, ?)");
  ev.run("form.submitted", EMAIL, '{"formName":"Contact A","token":"NE-PAS-EXPORTER"}', siteA);
  ev.run("form.submitted", EMAIL, '{"formName":"Contact B"}', siteB);
  ev.run("page.visited", EMAIL, "{}", null);
  const cons = db.prepare("INSERT INTO mk_consents (organization_id, contact_id, purpose, action, source, text_shown, ip, site_id) VALUES (1, 1, 'marketing', 'granted', 'form', ?, '203.0.113.0', ?)");
  cons.run("Texte consentement A", siteA); cons.run("Texte consentement principal", null);
  db.prepare("INSERT INTO mk_lists (organization_id, name, site_id) VALUES (1, 'Liste A', ?)").run(siteA);
  db.prepare("INSERT INTO mk_lists (organization_id, name, site_id) VALUES (1, 'Liste B', ?)").run(siteB);
  db.prepare("INSERT INTO mk_list_members (organization_id, list_id, contact_id) VALUES (1, 1, 1)").run();
  db.prepare("INSERT INTO mk_list_members (organization_id, list_id, contact_id) VALUES (1, 2, 1)").run();
  db.prepare("INSERT INTO mk_tags (organization_id, name) VALUES (1, 'vip')").run();
  db.prepare("INSERT INTO mk_contact_tags (organization_id, contact_id, tag_id) VALUES (1, 1, 1)").run();
});
after(() => { try { db.close(); } catch { /* déjà fermée */ } fs.rmSync(TMP, { recursive: true, force: true }); });

describe("archive ZIP", () => {
  test("écriture puis relecture stricte, noms et contenus accentués ou non latins conservés", () => {
    const buf = zip.create([{ name: "a.txt", data: "Bonjour Aïcha — 你好 — Привет" }, { name: "vide.txt", data: "" }, { name: "dossier/b.json", data: "{}" }]);
    const back = zip.read(buf);
    assert.deepEqual(back.map((e) => e.name), ["a.txt", "vide.txt", "dossier/b.json"]);
    assert.equal(back[0].data.toString("utf8"), "Bonjour Aïcha — 你好 — Привет");
    assert.equal(back[1].data.length, 0);
  });
  test("une archive altérée, tronquée ou vide est refusée ; les noms dangereux aussi", () => {
    const buf = zip.create([{ name: "a.txt", data: "contenu assez long pour être compressé ".repeat(20) }]);
    const bad = Buffer.from(buf); bad[45] ^= 0xff;
    assert.throws(() => zip.read(bad), /corrompu|invalide/i);
    assert.throws(() => zip.read(buf.subarray(0, buf.length - 10)), /invalide/i);
    assert.throws(() => zip.read(Buffer.alloc(5)), /invalide/i);
    assert.throws(() => zip.create([]), /vide/i);
    for (const name of ["../x", "/abs", "a/../../b", "a\\b/../c", "", "a\u0000b"]) assert.throws(() => zip.create([{ name, data: "x" }]), /invalide/i, name);
    assert.throws(() => zip.create([{ name: "a", data: "1" }, { name: "A", data: "2" }]), /double/i);
  });
});

describe("registre de collecteurs", () => {
  test("chaque collecteur déclare identifiant, catégorie, module, champs, méthode et filtre", () => {
    const list = registry.list();
    assert.ok(list.length >= 10);
    for (const c of list) { assert.match(c.id, /^[a-z][a-z0-9_-]+$/); assert.ok(c.title && c.category && c.owner && c.method && c.filter && c.fields.length, c.id); assert.equal(typeof c.collect, "function"); }
  });
  test("un module peut ajouter son collecteur sans toucher au moteur ; identifiant invalide ou doublon refusés", () => {
    registry.register({ id: "module-test", title: "Test", category: "Test", collect: () => ({ sections: [] }) });
    assert.ok(registry.list().some((c) => c.id === "module-test"));
    assert.throws(() => registry.register({ id: "module-test", title: "x", category: "x", collect: () => ({}) }), /déjà déclaré/);
    assert.throws(() => registry.register({ id: "Mauvais Id", title: "x", category: "x", collect: () => ({}) }), /invalide/);
    assert.throws(() => registry.register({ id: "sans-collecte", title: "x", category: "x" }), /incomplet/);
  });
});

describe("collecte réelle (données synthétiques)", () => {
  const principalCtx = () => ({ db, organizationId: 1, siteId: null, subject: { email: EMAIL, userId }, can: () => true, orgLevel: true });
  const byId = (c, id) => c.results.find((r) => r.id === id);

  test("site principal : compte, formation, commandes, échanges, commentaires, contact et activité — jamais le mot de passe", () => {
    const c = engine.collect(principalCtx());
    for (const id of ["compte", "formation", "commandes", "support", "commentaires", "contact-fiche", "contact-consentements", "contact-organisation", "activite"]) assert.equal(byId(c, id).status, "exported", id);
    assert.equal(byId(c, "preferences").status, "empty");
    const all = JSON.stringify(c.results);
    assert.ok(!all.includes("HASH-SECRET"), "aucun mot de passe");
    assert.ok(!all.includes("NE-PAS-EXPORTER"), "aucun jeton dans les métadonnées");
    assert.equal(byId(c, "commentaires").total, 1, "principal : seul le commentaire du contenu sans site (jamais celui du site A)");
    assert.equal(byId(c, "activite").total, 1, "principal : seul l'événement sans site");
    assert.equal(byId(c, "contact-consentements").total, 1);
  });

  test("site A : seulement ses données ; les catégories de la plateforme sont « non applicables » ; rien du site B ni du principal", () => {
    const c = engine.collect({ ...principalCtx(), siteId: siteA });
    assert.equal(byId(c, "compte").status, "unsupported");
    assert.equal(byId(c, "formation").status, "unsupported");
    assert.equal(byId(c, "contact-organisation").status, "unsupported", "étiquettes et notes : partagées entre sites, jamais dans un export de site");
    const text = JSON.stringify(c.results);
    assert.match(text, /Commentaire invité sur le site A/);
    assert.match(text, /Contact A/);
    assert.match(text, /Texte consentement A/);
    assert.match(text, /Liste A/);
    for (const forbidden of ["Contact B", "Liste B", "Texte consentement principal", "Commentaire du compte sur le principal", "autre@exemple.org", "vip", "Formation synthétique", "Commentaire d'une autre personne"]) assert.ok(!text.includes(forbidden), `fuite : ${forbidden}`);
  });

  test("site B (simple activité de la personne) : voit SES événements, jamais ceux du site A ; site C (aucun lien) : rien du tout", () => {
    const b = engine.collect({ ...principalCtx(), siteId: siteB });
    const textB = JSON.stringify(b.results);
    assert.match(textB, /Contact B/); assert.match(textB, /Liste B/);
    for (const forbidden of ["Contact A", "Liste A", "Texte consentement A", "Commentaire invité sur le site A"]) assert.ok(!textB.includes(forbidden), `fuite : ${forbidden}`);
    const c = engine.collect({ ...principalCtx(), siteId: siteC });
    for (const id of ["contact-fiche", "contact-consentements", "contact-listes", "envois", "activite", "commentaires"]) assert.equal(byId(c, id).status, "empty", id);
    assert.equal(c.summary.records, 0);
    assert.ok(!JSON.stringify(c.results).includes("+33100000000"));
  });

  test("droits : sans le droit sur les données sensibles ou hors équipe, la catégorie est « non autorisée » (et l'est dit)", () => {
    const c = engine.collect({ ...principalCtx(), can: () => false, orgLevel: false });
    assert.equal(byId(c, "contact-fiche").status, "denied");
    assert.equal(byId(c, "compte").status, "denied");
    assert.equal(c.summary.exported, 1, "seuls les commentaires (sans droit particulier) restent");
  });

  test("un collecteur en échec n'emporte pas les autres ; il est signalé avec un message court", () => {
    const boom = { id: "boom", title: "Boom", category: "Test", owner: "Test", scope: "both", fields: [], collect: () => { throw new Error("Table absente\nsecret=XYZ"); } };
    const good = registry.list().filter((c) => c.id === "compte");
    const c = engine.collect(principalCtx(), { collectors: [boom, ...good] });
    assert.equal(byId(c, "boom").status, "failed");
    assert.ok(!/\n/.test(byId(c, "boom").error));
    assert.equal(byId(c, "compte").status, "exported");
    assert.equal(c.summary.failed, 1);
  });
});

describe("rapport et archive", () => {
  test("HTML échappé, JSON structuré, manifeste ; archive relue ; contenu identique aux résultats", () => {
    const c = engine.collect({ db, organizationId: 1, siteId: null, subject: { email: EMAIL, userId }, can: () => true, orgLevel: true });
    const out = engine.buildArchive(c, { siteName: "Org <test> & co", email: EMAIL, now: NOW });
    const entries = Object.fromEntries(zip.read(out.buffer).map((e) => [e.name, e.data.toString("utf8")]));
    assert.deepEqual(Object.keys(entries).sort(), ["donnees-personnelles.html", "donnees.json", "manifeste.json"]);
    const html = entries["donnees-personnelles.html"];
    assert.match(html, /<html lang="fr">/);
    assert.ok(!html.includes("<b>gras</b>") && html.includes("&lt;b&gt;gras&lt;/b&gt;"), "HTML échappé");
    assert.ok(html.includes("Org &lt;test&gt; &amp; co"));
    assert.ok(html.includes("日本語") && html.includes("Aïcha"));
    const json = JSON.parse(entries["donnees.json"]);
    assert.equal(json.format, "kolakisa-export-personnel@1");
    assert.equal(json.personne.adresse_email, EMAIL);
    assert.ok(json.categories.find((x) => x.id === "compte").sections[0].lignes.some((l) => l.valeur.includes("日本語")));
    assert.ok(json.sources_externes.some((s) => s.id === "sauvegardes"), "limite signalée : sauvegardes");
    const manifest = JSON.parse(entries["manifeste.json"]);
    assert.equal(manifest.fichiers.length, 2);
    assert.equal(manifest.resume.failed, 0);
    const sha = (t) => require("node:crypto").createHash("sha256").update(t).digest("hex");
    assert.equal(manifest.fichiers[1].sha256, sha(entries["donnees.json"]));
    assert.ok(!/HASH-SECRET|NE-PAS-EXPORTER/.test(Object.values(entries).join("")));
  });
  test("aucune donnée : aucune archive (jamais d'archive vide présentée comme un succès)", () => {
    const c = engine.collect({ db, organizationId: 1, siteId: null, subject: { email: "personne@exemple.org", userId: null }, can: () => true, orgLevel: true });
    assert.equal(c.summary.records, 0);
    assert.throws(() => engine.buildArchive(c, { siteName: "X", email: "personne@exemple.org" }), (e) => e.code === "NO_DATA");
  });
});

describe("demandes : création et confirmation", () => {
  test("adresse e-mail valide, confirmation activée : demande persistante liée au site, jeton jamais conservé, e-mail à l'adresse vérifiée seulement", () => {
    fresh();
    const out = requests.create(ctxFor(siteA), { input: `  ${EMAIL.toUpperCase()}  `, sendEmail: true, now: NOW });
    const r = row(out.id);
    assert.equal(r.status, "pending_confirmation"); assert.equal(r.site_id, siteA); assert.equal(r.subject_email, EMAIL.toLowerCase()); assert.equal(r.confirm_mode, "email");
    assert.equal(r.subject_user_id, userId);
    const mail = db.prepare("SELECT * FROM mail_outbox WHERE id = ?").get(r.confirm_mail_id);
    assert.equal(mail.to_email, EMAIL.toLowerCase()); assert.equal(mail.sensitive, 1);
    const token = tokenOf(mail.id, "confirmer");
    assert.notEqual(r.confirm_token_hash, token); assert.equal(r.confirm_token_hash.length, 64);
    assert.ok(!JSON.stringify(r).includes(token), "jeton absent de la base");
    assert.match(mail.body, /SiteA/); assert.ok(!mail.body.includes(userId + "@") && !/Aïcha/.test(mail.body), "aucune donnée personnelle dans l'e-mail");
  });
  test("identifiant de compte : retrouve l'adresse du compte ; inconnu, invalide ou vide refusés", () => {
    fresh();
    const out = requests.create(ctxFor(null), { input: "Aicha", now: NOW });
    assert.equal(row(out.id).subject_email, EMAIL.toLowerCase()); assert.equal(row(out.id).input_kind, "username");
    for (const [input, re] of [["", /Saisissez/], ["pas-une-adresse@", /pas valide/], ["a@b", /pas valide/], ["inconnu-xyz", /Aucun compte/], ["<script>", /pas valide/], ["x".repeat(300), /trop longue/]]) assert.throws(() => requests.create(ctxFor(null), { input }), re, String(input).slice(0, 20));
  });
  test("une demande ouverte par personne et par site ; un autre site reste libre", () => {
    fresh();
    requests.create(ctxFor(siteA), { input: EMAIL, now: NOW });
    assert.throws(() => requests.create(ctxFor(siteA), { input: EMAIL }), /déjà en cours/);
    assert.doesNotThrow(() => requests.create(ctxFor(siteB), { input: EMAIL, now: NOW }));
  });
  test("sans e-mail : droit ET confirmation explicite exigés, enregistrée à l'administrateur ; jamais d'e-mail envoyé", () => {
    fresh();
    assert.throws(() => requests.create(ctxFor(siteA), { input: EMAIL, sendEmail: false }), /explicitement/);
    assert.throws(() => requests.create(ctxFor(siteA, { can: () => false }), { input: EMAIL, sendEmail: false, confirmAdmin: true }), (e) => e.status === 403);
    const out = requests.create(ctxFor(siteA, { userId: 7 }), { input: EMAIL, sendEmail: false, confirmAdmin: true, now: NOW });
    const r = row(out.id);
    assert.equal(r.status, "confirmed"); assert.equal(r.confirm_mode, "admin"); assert.equal(r.confirmed_by, 7);
    assert.equal(db.prepare("SELECT COUNT(*) n FROM mail_outbox").get().n, 0);
  });
  test("adresse refusée par la file d'envoi : la demande existe, l'erreur est explicite, on peut renvoyer", () => {
    fresh();
    const real = outbox.queueMail; require.cache[require.resolve("../src/utils/outbox")].exports.queueMail = () => ({ queued: false, reason: "invalid_recipient" });
    let out;
    try { out = requests.create(ctxFor(siteA), { input: EMAIL, now: NOW }); } finally { require.cache[require.resolve("../src/utils/outbox")].exports.queueMail = real; }
    assert.match(out.emailError, /n'a pas pu/); assert.match(row(out.id).error, /n'a pas pu/);
    assert.doesNotThrow(() => requests.resendConfirmation(ctxFor(siteA), out.id, { now: NOW }));
    assert.equal(row(out.id).error, "");
  });
  test("site archivé : lecture seule", () => {
    fresh();
    db.prepare("UPDATE mk_sites SET status = 'archived' WHERE id = ?").run(siteB);
    try { assert.throws(() => requests.create(ctxFor(siteB), { input: EMAIL }), /archivé/); } finally { db.prepare("UPDATE mk_sites SET status = 'active' WHERE id = ?").run(siteB); }
  });
  test("confirmation : lire le lien ne confirme rien ; le bouton confirme une seule fois ; réutilisation, jeton inconnu ou mal formé refusés", () => {
    fresh();
    const out = requests.create(ctxFor(siteA), { input: EMAIL, now: NOW });
    const token = tokenOf(row(out.id).confirm_mail_id, "confirmer");
    assert.ok(requests.peekConfirmation(db, token, { now: NOW }));
    assert.equal(row(out.id).status, "pending_confirmation", "lire n'est pas confirmer");
    assert.equal(requests.confirmByToken(db, token, { now: later(H) }).ok, true);
    assert.equal(row(out.id).status, "confirmed"); assert.equal(row(out.id).confirm_token_hash, null);
    assert.equal(requests.confirmByToken(db, token, { now: later(H) }).ok, false, "usage unique");
    for (const bad of ["", "x", "a".repeat(43), "../../etc/passwd", token + "x"]) assert.equal(requests.confirmByToken(db, bad).ok, false);
  });
  test("lien expiré : refusé, demande « Expirée » ; elle peut être relancée avec un NOUVEAU lien (l'ancien reste mort)", () => {
    fresh();
    const out = requests.create(ctxFor(siteA), { input: EMAIL, now: NOW });
    const old = tokenOf(row(out.id).confirm_mail_id, "confirmer");
    assert.equal(requests.confirmByToken(db, old, { now: later(49 * H) }).ok, false);
    assert.equal(row(out.id).status, "expired");
    requests.restart(ctxFor(siteA), out.id, { now: later(50 * H) });
    assert.equal(row(out.id).status, "pending_confirmation");
    assert.equal(requests.confirmByToken(db, old, { now: later(51 * H) }).ok, false);
    const fresh1 = tokenOf(row(out.id).confirm_mail_id, "confirmer");
    assert.equal(requests.confirmByToken(db, fresh1, { now: later(51 * H) }).ok, true);
  });
  test("renvoyer l'e-mail remplace le jeton (l'ancien ne fonctionne plus) ; durée de validité configurable", () => {
    fresh();
    requests.saveSettings(db, 1, siteA, { confirm_hours: 2, link_hours: 72, archive_days: 7, keep_days: 180 });
    try {
      const out = requests.create(ctxFor(siteA), { input: EMAIL, now: NOW });
      const t1 = tokenOf(row(out.id).confirm_mail_id, "confirmer");
      assert.equal(row(out.id).confirm_expires_at, "2026-10-23 12:00:00");
      requests.resendConfirmation(ctxFor(siteA), out.id, { now: later(H) });
      assert.equal(requests.confirmByToken(db, t1, { now: later(H) }).ok, false);
      assert.equal(requests.confirmByToken(db, tokenOf(row(out.id).confirm_mail_id, "confirmer"), { now: later(H) }).ok, true);
    } finally { db.prepare("DELETE FROM mk_settings WHERE key LIKE 'privacy_export.%'").run(); }
  });
});

describe("génération, stockage et téléchargement", () => {
  const confirmed = (siteId, now = NOW) => { const out = requests.create(ctxFor(siteId), { input: EMAIL, sendEmail: false, confirmAdmin: true, now }); return out.id; };

  test("génération : seulement après confirmation ; archive privée au nom imprévisible, ZIP valide aux catégories attendues", () => {
    fresh();
    const pending = requests.create(ctxFor(siteA), { input: EMAIL, now: NOW }).id;
    assert.throws(() => requests.generate(ctxFor(siteA), pending, { now: NOW }), /pas confirmée/);
    requests.restart; // (non utilisé ici)
    db.prepare("DELETE FROM cms_privacy_requests").run();
    const id = confirmed(siteA);
    const out = requests.generate(ctxFor(siteA), id, { now: NOW });
    assert.equal(out.status, "ready");
    const r = row(id);
    assert.match(r.archive_file, /^[a-f0-9]{48}\.zip$/);
    const full = path.join(requests.privateRoot(), `site-${siteA}`, r.archive_file);
    assert.ok(fs.existsSync(full)); assert.ok(!full.startsWith(path.join(process.cwd(), "public")) && !full.includes(`${path.sep}uploads${path.sep}`), "hors dossier public");
    assert.equal(fs.statSync(full).mode & 0o077, 0, "droits : propriétaire seul");
    assert.equal(r.archive_expires_at, "2026-10-30 10:00:00");
    const names = archiveEntries(r).map((e) => e.name).sort();
    assert.deepEqual(names, ["donnees-personnelles.html", "donnees.json", "manifeste.json"]);
    const json = JSON.parse(archiveEntries(r).find((e) => e.name === "donnees.json").data);
    assert.deepEqual(json.categories.map((c) => c.id).sort(), ["activite", "commentaires", "contact-consentements", "contact-fiche", "contact-listes"]);
    assert.ok(JSON.stringify(r.report).length > 2 && !r.report.includes("Aïcha") && !r.report.includes("+33100000000"), "le rapport conservé ne contient aucune donnée personnelle");
    assert.deepEqual(files().map((f) => path.basename(f)), [r.archive_file], "aucun fichier temporaire restant");
  });

  test("personne sans donnée sur ce site : état « Aucune donnée », aucun fichier", () => {
    fresh();
    const id = requests.create(ctxFor(siteB), { input: "personne@exemple.org", sendEmail: false, confirmAdmin: true, now: NOW }).id;
    assert.equal(requests.generate(ctxFor(siteB), id, { now: NOW }).status, "no_data");
    assert.equal(row(id).status, "no_data"); assert.equal(row(id).archive_file, null); assert.equal(files().length, 0);
  });

  test("échec d'écriture : état « Échec » explicite, aucun fichier ni temporaire, nouvel essai possible", () => {
    fresh();
    const id = confirmed(siteA);
    const real = fs.writeFileSync;
    fs.writeFileSync = () => { throw new Error("ENOSPC: disque plein"); };
    let out; try { out = requests.generate(ctxFor(siteA), id, { now: NOW }); } finally { fs.writeFileSync = real; }
    assert.equal(out.status, "failed"); assert.equal(row(id).status, "failed"); assert.match(row(id).error, /disque plein/);
    assert.equal(files().length, 0);
    assert.equal(requests.generate(ctxFor(siteA), id, { now: NOW }).status, "ready", "réessayer sans recréer la demande");
  });

  test("collecteur en échec : l'export est prêt mais signalé incomplet ; double génération concurrente refusée", () => {
    fresh();
    const id = confirmed(siteA);
    const boom = { id: "boom", title: "Boom", category: "Test", owner: "Test", scope: "both", fields: [], collect: () => { throw new Error("panne"); } };
    const out = requests.generate(ctxFor(siteA), id, { now: NOW, collectors: [boom, ...registry.list().filter((c) => c.id === "commentaires")] });
    assert.equal(out.status, "ready"); assert.equal(out.report.summary.failed, 1);
    assert.throws(() => requests.generate(ctxFor(siteA), id, { now: NOW }), /pas confirmée/);
    db.prepare("UPDATE cms_privacy_requests SET status = 'running' WHERE id = ?").run(id);
    assert.throws(() => requests.generate(ctxFor(siteA), id, { now: NOW }), /pas confirmée/, "une demande en cours n'est pas régénérée");
  });

  test("téléchargement administrateur : droit requis, archive relue (empreinte), refus si altérée ou expirée", () => {
    fresh();
    const id = confirmed(siteA); requests.generate(ctxFor(siteA), id, { now: NOW });
    const ok = requests.adminDownload(ctxFor(siteA), id, { now: later(H) });
    assert.equal(zip.read(ok.data).length, 3);
    assert.throws(() => requests.adminDownload(ctxFor(siteA, { can: () => false }), id, { now: later(H) }), (e) => e.status === 403);
    assert.throws(() => requests.adminDownload(ctxFor(siteA), id, { now: later(8 * 24 * H) }), /plus disponible/);
    const r = row(id); const file = path.join(requests.privateRoot(), `site-${siteA}`, r.archive_file);
    const data = fs.readFileSync(file); data[60] ^= 0xff; fs.writeFileSync(file, data);
    assert.throws(() => requests.adminDownload(ctxFor(siteA), id, { now: later(H) }), /altéré|introuvable/);
  });

  test("isolation inter-sites : une demande du site A est introuvable, non téléchargeable et non gérable depuis le site B", () => {
    fresh();
    const id = confirmed(siteA); requests.generate(ctxFor(siteA), id, { now: NOW });
    for (const act of [() => requests.detail(ctxFor(siteB), id), () => requests.adminDownload(ctxFor(siteB), id, { now: later(H) }), () => requests.sendLink(ctxFor(siteB), id), () => requests.generate(ctxFor(siteB), id), () => requests.remove(ctxFor(siteB), id), () => requests.detail(ctxFor(null), id)]) assert.throws(act, (e) => e.status === 404);
    assert.equal(requests.list(ctxFor(siteB), {}).total, 0);
    assert.equal(requests.list(ctxFor(null), {}).total, 0);
    const other = { ...ctxFor(siteA), organizationId: 2 };
    assert.throws(() => requests.detail(other, id), (e) => e.status === 404 || e.status === 403 || /introuvable/i.test(e.message));
    const b = requests.bulk(ctxFor(siteB), "generate", [id]);
    assert.deepEqual(b.done, []); assert.match(b.failed[0].reason, /introuvable/i);
  });

  test("envoi du lien : e-mail à l'adresse vérifiée, lien personnel, expiration ; échec d'envoi sans regénération ; statut « Envoyée » seulement après l'envoi réel", async () => {
    fresh();
    const id = confirmed(siteA); requests.generate(ctxFor(siteA), id, { now: NOW });
    const sha = row(id).archive_sha256, file = row(id).archive_file;
    const sent = requests.sendLink(ctxFor(siteA), id, { now: later(H) });
    const mail = db.prepare("SELECT * FROM mail_outbox WHERE id = ?").get(sent.mailId);
    assert.equal(mail.to_email, EMAIL.toLowerCase()); assert.equal(mail.sensitive, 1);
    assert.match(mail.body, /SiteA/); assert.match(mail.body, /jusqu'au/); assert.match(mail.body, /si le lien ne fonctionne pas/i);
    // SMTP absent : l'e-mail n'est PAS parti → la demande n'est pas « Envoyée », l'erreur est affichée, on peut réessayer
    await outbox.processOutbox(db, { transport: null, log: quiet });
    let d = requests.detail(ctxFor(siteA), id, { now: later(H) });
    assert.equal(d.status, "ready"); assert.match(d.deliveryError, /non envoyé/i); assert.ok(d.steps.includes("send"));
    // Réessai : nouvel e-mail, MÊME archive
    const again = requests.sendLink(ctxFor(siteA), id, { now: later(2 * H) });
    const t2 = tokenOf(again.mailId, "telecharger");
    await outbox.processOutbox(db, { transport: { sendMail: async () => ({}) }, log: quiet });
    d = requests.detail(ctxFor(siteA), id, { now: later(2 * H) });
    assert.equal(d.status, "sent"); assert.equal(row(id).archive_sha256, sha); assert.equal(row(id).archive_file, file);
    assert.equal(db.prepare("SELECT body FROM mail_outbox WHERE id = ?").get(again.mailId).body, "", "lien effacé de la file après l'envoi");
    // Le jeton ne sert qu'à cette archive, temporairement, un nombre limité de fois
    assert.equal(requests.downloadByToken(db, t2, { now: later(3 * H) }).ok, true);
    assert.equal(requests.downloadByToken(db, t2, { now: later(80 * H) }).ok, false, "lien expiré (72 h)");
    assert.equal(requests.downloadByToken(db, "x".repeat(43), { now: later(3 * H) }).ok, false);
    for (let i = 0; i < requests.MAX_DOWNLOADS; i++) requests.downloadByToken(db, t2, { now: later(4 * H) });
    assert.equal(requests.downloadByToken(db, t2, { now: later(4 * H) }).ok, false, "nombre de téléchargements limité");
    const first = tokenOf(sent.mailId, "telecharger") ;
    assert.equal(requests.downloadByToken(db, first, { now: later(3 * H) }).ok, false, "l'ancien lien est invalidé par le nouveau");
  });

  test("le lien ne dépasse jamais l'expiration de l'archive ; après expiration, archive supprimée et état « Expirée »", () => {
    fresh();
    const id = confirmed(siteA); requests.generate(ctxFor(siteA), id, { now: NOW });
    const sent = requests.sendLink(ctxFor(siteA), id, { now: later(6 * 24 * H) });
    assert.equal(row(id).download_expires_at, row(id).archive_expires_at);
    const token = tokenOf(sent.mailId, "telecharger");
    const file = path.join(requests.privateRoot(), `site-${siteA}`, row(id).archive_file);
    assert.ok(fs.existsSync(file));
    const out = requests.purge(db, { now: later(8 * 24 * H) });
    assert.equal(out.archivesRemoved, 1); assert.ok(!fs.existsSync(file));
    assert.equal(row(id).status, "expired"); assert.equal(row(id).archive_file, null);
    assert.equal(requests.downloadByToken(db, token, { now: later(8 * 24 * H) }).ok, false);
    assert.throws(() => requests.sendLink(ctxFor(siteA), id, { now: later(8 * 24 * H) }), /Aucune archive valide/);
  });

  test("entretien : demandes terminées supprimées après la conservation, fichiers orphelins effacés, préparation bloquée remise en échec", () => {
    fresh();
    const id = confirmed(siteA);
    db.prepare("UPDATE cms_privacy_requests SET status = 'running', updated_at = '2026-10-23 09:00:00' WHERE id = ?").run(id);
    assert.equal(requests.purge(db, { now: NOW }).stuck, 1); assert.equal(row(id).status, "failed");
    const orphanDir = path.join(requests.privateRoot(), "main"); fs.mkdirSync(orphanDir, { recursive: true });
    const orphan = path.join(orphanDir, "f".repeat(48) + ".zip"); fs.writeFileSync(orphan, "x");
    const recent = path.join(orphanDir, "e".repeat(48) + ".zip"); fs.writeFileSync(recent, "x");
    const old = new Date(NOW.getTime() - 3 * H); fs.utimesSync(orphan, old, old);
    const out = requests.purge(db, { now: new Date() });
    assert.ok(out.orphans >= 1 && !fs.existsSync(orphan) && fs.existsSync(recent), "seul l'orphelin ancien est effacé");
    fs.rmSync(recent, { force: true });
    db.prepare("UPDATE cms_privacy_requests SET updated_at = '2026-01-01 00:00:00' WHERE id = ?").run(id);
    assert.equal(requests.purge(db, { now: NOW }).deleted, 1); assert.equal(row(id), undefined);
  });
});

describe("actions groupées et réglages", () => {
  test("générer / envoyer / renvoyer / supprimer en groupe : états respectés, refus motivés, rien de contourné", () => {
    fresh();
    const mk = (input, direct) => requests.create(ctxFor(siteA), direct ? { input, sendEmail: false, confirmAdmin: true, now: NOW } : { input, now: NOW }).id;
    db.prepare("INSERT INTO users (username, email, password_hash) VALUES ('dina', 'dina@exemple.org', 'x'), ('eli', 'eli@exemple.org', 'x')").run();
    const confirmedId = mk(EMAIL, true), pendingId = mk("dina@exemple.org", false), thirdId = mk("eli@exemple.org", true);
    let out = requests.bulk(ctxFor(siteA), "generate", [confirmedId, pendingId, thirdId, 999999, "abc"]);
    assert.deepEqual(out.done.sort(), [confirmedId].sort(), "seule la demande confirmée ET avec données est générée (eli n'a rien : aucune donnée)");
    assert.equal(out.failed.length, 3); assert.ok(out.failed.some((f) => f.id === pendingId && /état/i.test(f.reason)));
    assert.equal(row(pendingId).status, "pending_confirmation");
    out = requests.bulk(ctxFor(siteA), "resend", [pendingId, confirmedId]);
    assert.deepEqual(out.done, [pendingId]); assert.equal(out.failed[0].id, confirmedId);
    out = requests.bulk(ctxFor(siteA), "send", [confirmedId, pendingId]);
    assert.deepEqual(out.done, [confirmedId]);
    out = requests.bulk(ctxFor(siteA), "remove", [confirmedId, pendingId, thirdId]);
    assert.deepEqual(out.done, [thirdId], "seule la demande terminée (sans donnée) est supprimable");
    assert.throws(() => requests.bulk(ctxFor(siteA), "remove", []), /Sélectionnez/);
    assert.throws(() => requests.bulk(ctxFor(siteA), "hack", [1]), /inconnue/);
    assert.throws(() => requests.bulk(ctxFor(siteA, { can: () => false }), "generate", [confirmedId]), (e) => e.status === 403);
  });
  test("suppression d'une demande terminée : retire aussi son archive, jamais les données sources", () => {
    fresh();
    const id = requests.create(ctxFor(siteA), { input: EMAIL, sendEmail: false, confirmAdmin: true, now: NOW }).id;
    requests.generate(ctxFor(siteA), id, { now: NOW });
    assert.throws(() => requests.remove(ctxFor(siteA), id), /terminée/);
    db.prepare("UPDATE cms_privacy_requests SET status = 'sent' WHERE id = ?").run(id);
    const before = db.prepare("SELECT COUNT(*) n FROM mk_contacts").get().n;
    requests.remove(ctxFor(siteA), id);
    assert.equal(files().length, 0); assert.equal(row(id), undefined);
    assert.equal(db.prepare("SELECT COUNT(*) n FROM mk_contacts").get().n, before);
    assert.equal(db.prepare("SELECT COUNT(*) n FROM users WHERE email = ?").get(EMAIL).n, 1);
  });
  test("réglages : bornés, propres à chaque site", () => {
    assert.throws(() => requests.saveSettings(db, 1, siteA, { confirm_hours: 0, link_hours: 72, archive_days: 7, keep_days: 180 }), /entre 1 et 720/);
    assert.throws(() => requests.saveSettings(db, 1, siteA, { confirm_hours: "abc", link_hours: 72, archive_days: 7, keep_days: 180 }), /entier/);
    requests.saveSettings(db, 1, siteA, { confirm_hours: 5, link_hours: 6, archive_days: 2, keep_days: 40 });
    try {
      assert.equal(requests.settingsOf(db, 1, siteA).archive_days, 2);
      assert.equal(requests.settingsOf(db, 1, siteB).archive_days, 7, "l'autre site garde ses valeurs");
      assert.equal(requests.settingsOf(db, 1, null).keep_days, 180);
    } finally { db.prepare("DELETE FROM mk_settings WHERE key LIKE 'privacy_export.%'").run(); }
  });
});
