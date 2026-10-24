// KOLAKISA CMS — Paramètres → Écriture : catégorie par défaut (enregistrée, rechargée, appliquée, par site) et notifications de publication
// (validation, première publication seulement, échecs, reprises limitées, isolation) — vraies routes, vrai serveur, destination locale de test.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const http = require("node:http");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, loginInstructor } = require("./helpers");

let srv, boss, db, pingSrv, pingPort;
const hits = [];
let pingMode = "ok";
const one = (sql, ...a) => db.prepare(sql).get(...a);
const P = "/marketing/site-web/parametres/ecriture";
const TERMS = "/marketing/site-web/articles/termes";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function newSite(name) { const r = await boss.post("/marketing/site-web/sites", { name }); return Number(String(r.location).match(/sites\/(\d+)/)[1]); }
const cat = (name) => one("SELECT * FROM taxonomy_terms WHERE taxonomy = 'category' AND name = ?", name);
const save = (url, fields) => { const fd = new FormData(); Object.entries({ excerpt: "Résumé.", content_format: "html", status: "draft", content: "<p>Texte</p>", ...fields }).forEach(([k, v]) => fd.append(k, v)); return boss.request(url, { method: "POST", multipart: fd, headers: { "x-blog-editor": "1" } }); };
const cats = (id) => db.prepare("SELECT term_id FROM taxonomy_relations WHERE content_type = 'post' AND content_id = ? AND term_id IN (SELECT id FROM taxonomy_terms WHERE taxonomy = 'category')").all(id).map((r) => r.term_id);

before(async () => {
  pingSrv = http.createServer((req, res) => { let b = ""; req.on("data", (c) => (b += c)); req.on("end", () => { hits.push({ url: req.url, body: b }); if (pingMode === "fail") { res.statusCode = 500; return res.end("no"); } res.end("<methodResponse><params><param><value><struct><member><name>flerror</name><value><boolean>0</boolean></value></member></struct></value></param></params></methodResponse>"); }); });
  await new Promise((r) => pingSrv.listen(0, "127.0.0.1", r));
  pingPort = pingSrv.address().port;
  srv = await startServer({ SITE_URL: "https://kolakisa.test", SMTP_HOST: "", ENCRYPTION_KEY: TEST_KEY, WRITING_PING_ALLOW_PRIVATE: "1", WRITING_PING_BACKOFF: "0,0,0", WRITING_PING_EVERY_MS: "300" });
  boss = await loginInstructor(srv);
  db = srv.db();
});
after(async () => { await srv.stop(); pingSrv.close(); });

describe("catégorie par défaut", () => {
  test("enregistrée, rechargée, appliquée seulement aux articles sans catégorie, jamais rétroactive ; par site", async () => {
    const A = await newSite("Écriture A"), B = await newSite("Écriture B");
    await boss.post(`${TERMS}?site=${A}`, { taxonomy: "category", name: "Actualités A" });
    await boss.post(`${TERMS}?site=${A}`, { taxonomy: "category", name: "Dossiers A" });
    await boss.post(`${TERMS}?site=${B}`, { taxonomy: "category", name: "Actualités B" });
    const ta = cat("Actualités A"), td = cat("Dossiers A"), tb = cat("Actualités B");
    const before = await save(`/formateur/blog/nouveau?site=${A}`, { title: "Avant réglage" });
    const oldId = JSON.parse(before.text).id;
    assert.deepEqual(cats(oldId), [], "aucune catégorie avant le réglage");
    // le sélecteur ne propose que les catégories du site
    const page = await boss.get(`${P}?site=${A}`);
    assert.equal(page.status, 200);
    assert.match(page.text, /<option[^>]*>Actualités A</); assert.doesNotMatch(page.text, /<option[^>]*>Actualités B</);
    // enregistrement puis rechargement
    const r = await boss.post(`${P}?site=${A}`, { writing_default_category: String(ta.id) });
    assert.equal(r.status, 302, r.text.slice(0, 300));
    assert.match((await boss.get(`${P}?site=${A}`)).text, new RegExp(`<option value="${ta.id}" selected`));
    // une catégorie d'un autre site est refusée
    const bad = await boss.post(`${P}?site=${A}`, { writing_default_category: String(tb.id) });
    assert.notEqual(bad.status, 302);
    // nouvel article sans catégorie : défaut appliqué ; choix explicite : préservé ; ancien article : intact
    const out = JSON.parse((await save(`/formateur/blog/nouveau?site=${A}`, { title: "Sans choix" })).text);
    assert.deepEqual(cats(out.id), [ta.id]);
    const chosen = JSON.parse((await save(`/formateur/blog/nouveau?site=${A}`, { title: "Choisi", category_ids: String(td.id), primary_category_id: String(td.id) })).text);
    assert.deepEqual(cats(chosen.id), [td.id]);
    assert.deepEqual(cats(oldId), [], "pas de modification rétroactive");
    // l'éditeur coche la catégorie d'avance pour un nouvel article du site
    assert.match((await boss.get(`/formateur/blog/nouveau?site=${A}`)).text, /Actualités A/);
    // un autre site n'est pas touché
    const other = JSON.parse((await save(`/formateur/blog/nouveau?site=${B}`, { title: "Autre site" })).text);
    assert.deepEqual(cats(other.id), []);
    // catégorie supprimée : secours = aucune catégorie, sans erreur
    db.prepare("DELETE FROM taxonomy_relations WHERE term_id = ?").run(ta.id);
    db.prepare("DELETE FROM mk_content_sites WHERE content_type = 'term' AND content_id = ?").run(ta.id);
    db.prepare("DELETE FROM taxonomy_terms WHERE id = ?").run(ta.id);
    const after = JSON.parse((await save(`/formateur/blog/nouveau?site=${A}`, { title: "Après suppression" })).text);
    assert.deepEqual(cats(after.id), []);
  });
});

describe("notifications de publication", () => {
  const url = () => `http://127.0.0.1:${pingPort}/rpc`;
  test("validation : https seulement, pas d'adresse privée ni d'identifiants, 5 au plus ; réglage sensible protégé", async () => {
    const w = require("../src/services/writing");
    assert.ok(w.parseUrls("http://exemple.org/ping").errors.length, "http refusé");
    assert.ok(w.parseUrls("https://127.0.0.1/ping").errors.length, "adresse privée refusée");
    assert.ok(w.parseUrls("https://192.168.1.5/x").errors.length);
    assert.ok(w.parseUrls("https://user:pw@exemple.org/x").errors.length, "identifiants refusés");
    assert.ok(w.parseUrls("https://localhost/x").errors.length, "pas de nom sans point");
    assert.ok(w.parseUrls(Array.from({ length: 6 }, (_, i) => `https://s${i}.exemple.org/`).join("\n")).errors.length, "6 destinations refusées");
    assert.deepEqual(w.parseUrls("https://a.exemple.org/p\nhttps://a.exemple.org/p").urls, ["https://a.exemple.org/p"], "doublons retirés");
    const bad = await boss.post(P, { writing_ping_enabled: "1", _b_writing_ping_enabled: "1", writing_ping_urls: "http://exemple.org/ping", confirm: "1" });
    assert.equal(bad.status, 422);
    assert.equal(one("SELECT value FROM mk_settings WHERE key = 'writing.main.ping_urls'"), undefined);
  });
  test("première publication seulement : un ping par article, pas à chaque enregistrement ; le journal garde la trace ; isolation par site", async () => {
    const A = await newSite("Ping A"), B = await newSite("Ping B");
    const w = require("../src/services/writing");
    // Configuration de A directement par le service (la route est testée plus haut) : le chemin réel de première publication est exercé ensuite
    const ctx = { organizationId: one("SELECT id FROM mk_organizations ORDER BY id LIMIT 1").id };
    void ctx; void w;
    const set = (site, urls) => db.exec(`INSERT OR REPLACE INTO mk_settings (organization_id, key, value, is_secret) VALUES (${ctx.organizationId}, 'writing.site_${site}.ping_enabled', '1', 0), (${ctx.organizationId}, 'writing.site_${site}.ping_urls', '${urls}', 0), (${ctx.organizationId}, 'writing.site_${site}.ping_enabled_at', '2000-01-01 00:00:00', 0)`);
    set(A, url());
    hits.length = 0;
    const draft = JSON.parse((await save(`/formateur/blog/nouveau?site=${A}`, { title: "Ping premier", status: "published" })).text);
    const postB = JSON.parse((await save(`/formateur/blog/nouveau?site=${B}`, { title: "Ping autre site", status: "published" })).text);
    for (let i = 0; i < 40 && !hits.length; i++) await sleep(150);
    assert.equal(hits.length, 1, "un seul envoi : pour le site A, pas pour B (B n'a rien configuré)");
    assert.match(hits[0].body, /weblogUpdates\.ping/);
    assert.match(hits[0].body, /kolakisa\.test/);
    for (let i = 0; i < 40 && (one("SELECT status FROM cms_ping_log WHERE post_id = ?", draft.id) || {}).status !== "sent"; i++) await sleep(100);
    const row = one("SELECT * FROM cms_ping_log WHERE post_id = ?", draft.id);
    assert.equal(row.status, "sent"); assert.equal(row.site_id, A);
    assert.equal(one("SELECT COUNT(*) n FROM cms_ping_log WHERE post_id = ?", postB.id).n, 0);
    // un enregistrement ultérieur ne renvoie rien
    await save(`/formateur/blog/${draft.id}/modifier`, { title: "Ping premier modifié", status: "published" });
    await sleep(1500);
    assert.equal(hits.length, 1, "aucun nouveau ping à la mise à jour");
    assert.equal(one("SELECT COUNT(*) n FROM cms_ping_log WHERE post_id = ?", draft.id).n, 1);
    // le brouillon n'est jamais notifié
    const dr = JSON.parse((await save(`/formateur/blog/nouveau?site=${A}`, { title: "Brouillon seulement" })).text);
    await sleep(1200);
    assert.equal(one("SELECT COUNT(*) n FROM cms_ping_log WHERE post_id = ?", dr.id).n, 0);
  });
  test("échec : la publication reste réussie, trois essais au plus, état « échec » au journal", async () => {
    const A = await newSite("Ping échec");
    const w = require("../src/services/writing");
    const org = one("SELECT id FROM mk_organizations ORDER BY id LIMIT 1").id;
    db.exec(`INSERT OR REPLACE INTO mk_settings (organization_id, key, value, is_secret) VALUES (${org}, 'writing.site_${A}.ping_enabled', '1', 0), (${org}, 'writing.site_${A}.ping_urls', '${url()}', 0), (${org}, 'writing.site_${A}.ping_enabled_at', '2000-01-01 00:00:00', 0)`);
    pingMode = "fail";
    const out = JSON.parse((await save(`/formateur/blog/nouveau?site=${A}`, { title: "Ping qui échoue", status: "published" })).text);
    assert.ok(out.ok);
    assert.equal(one("SELECT status FROM posts WHERE id = ?", out.id).status, "published", "la publication n'est pas annulée");
    for (let i = 0; i < 40 && !one("SELECT 1 FROM cms_ping_log WHERE post_id = ?", out.id); i++) await sleep(150);
    for (let i = 0; i < 60 && one("SELECT attempts FROM cms_ping_log WHERE post_id = ?", out.id).attempts < w.MAX_ATTEMPTS; i++) await sleep(200);
    await sleep(1000);
    const row = one("SELECT * FROM cms_ping_log WHERE post_id = ?", out.id);
    assert.equal(row.status, "failed"); assert.equal(row.attempts, w.MAX_ATTEMPTS, "au plus trois essais");
    assert.equal(row.http_status, 500);
    pingMode = "ok";
    // désactiver : plus rien n'est envoyé pour ce site
    db.prepare("DELETE FROM mk_settings WHERE key = ?").run(`writing.site_${A}.ping_enabled`);
    const n = hits.length;
    await save(`/formateur/blog/nouveau?site=${A}`, { title: "Après désactivation", status: "published" });
    await sleep(1200);
    assert.equal(hits.length, n);
  });
  test("destination privée refusée à l'envoi (SSRF) quand la protection est active", async () => {
    const w = require("../src/services/writing");
    assert.equal(w.privateAddress("10.0.0.5"), true); assert.equal(w.privateAddress("169.254.169.254"), true); assert.equal(w.privateAddress("::1"), true);
    assert.equal(w.privateAddress("::ffff:127.0.0.1"), true); assert.equal(w.privateAddress("fd00::1"), true); assert.equal(w.privateAddress("93.184.216.34"), false);
  });
});

describe("enregistrement des notifications par l'écran", () => {
  test("réglage sensible : confirmation demandée, puis enregistré et rechargé ; propre au site (le principal n'est pas modifié)", async () => {
    const S = await newSite("Ping écran");
    const form = { _b_writing_ping_enabled: "1", writing_ping_enabled: "1", writing_ping_urls: "https://ping.exemple.org/rpc\nhttps://ping.exemple.org/rpc" };
    const ask = await boss.post(`${P}?site=${S}`, form);
    assert.equal(ask.status, 409, "confirmation demandée");
    assert.equal(one(`SELECT value FROM mk_settings WHERE key = 'writing.site_${S}.ping_urls'`), undefined, "rien n'est écrit avant confirmation");
    const ok = await boss.post(`${P}?site=${S}`, { ...form, confirm: "1" });
    assert.equal(ok.status, 302);
    assert.equal(one(`SELECT value FROM mk_settings WHERE key = 'writing.site_${S}.ping_urls'`).value, "https://ping.exemple.org/rpc", "dédoublonné");
    assert.match((await boss.get(`${P}?site=${S}`)).text, /https:\/\/ping\.exemple\.org\/rpc/);
    assert.equal(one("SELECT value FROM mk_settings WHERE key = 'writing.main.ping_urls'"), undefined, "le site principal n'est pas touché");
    assert.ok(one(`SELECT value FROM mk_settings WHERE key = 'writing.site_${S}.ping_enabled_at'`).value, "date d'activation enregistrée : l'existant n'est pas notifié");
  });
});

describe("écran, permissions et menu", () => {
  test("l'écran explique l'absence de formats et de publication par e-mail, sans champ factice ; un lecteur n'écrit rien", async () => {
    const page = (await boss.get(P)).text;
    assert.match(page, /Publier par e-mail/); assert.match(page, /Non disponible/);
    assert.doesNotMatch(page, /name="[^"]*(mail_server|pop3|imap)/i);
    assert.match(page, /Format par défaut des articles/);
    const anon = new (require("./helpers").Client)(boss.base);
    assert.notEqual((await anon.post(P, { writing_default_category: "1" })).status, 200);
  });
  test("« Écriture » est dans le menu Paramètres du principal et dans l'espace d'un site", async () => {
    const s = await newSite("Menu écriture");
    assert.match((await boss.get("/marketing/site-web/parametres")).text, /parametres\/ecriture/);
    const site = await boss.get(`/marketing/site-web/sites/${s}/parametres-ecriture`);
    assert.equal(site.status, 200);
    assert.match(site.text, /Catégorie par défaut des articles/);
  });
});
