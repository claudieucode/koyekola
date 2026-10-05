// Réseaux sociaux (point 12 de la parité Mailchimp) : version web d'une campagne (lien « voir dans le navigateur »,
// carte de partage, boutons de partage), publications Facebook / Instagram / LinkedIn (API factices : aucun appel réel),
// programmation, erreurs, liens courts suivis ; pages web.
const { test, describe, before, after, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const { freshMarketing, TEST_KEY, quiet } = require("./marketing-helpers");
const social = require("../src/marketing/social");
const web = require("../src/marketing/social/webVersion");
const { buildMessage } = require("../src/marketing/sending/builder");
const { compileTemplate } = require("../src/marketing/templates/blocks");
const { signToken } = require("../src/marketing/security/tokens");
const { startServer, loginInstructor } = require("./helpers");

const NOW = Date.UTC(2026, 9, 5, 12);
const SNAPSHOT = {
  kind: "marketing", subject: "Excel avancé, {{contact.first_name | default:\"c'est parti\"}}", preheader: "Les inscriptions sont ouvertes",
  blocks: [{ type: "image", src: "https://k.test/uploads/excel.png", alt: "Excel", width: 552 }, { type: "text", markdown: "Bonjour {{contact.first_name | default:\"à vous\"}}, votre adresse {{contact.email}}." }],
};
let m, A, calls, respond;
const code = async (p) => { try { await p; } catch (e) { return e.code; } return null; };
function sentCampaign(db, { kind = "campaign", status = "sent", web_disabled = 0, name = `C${Math.random()}` } = {}) {
  return db.prepare("INSERT INTO mk_campaigns (organization_id, name, snapshot, target_type, target_id, status, kind, web_disabled, finished_at) VALUES (1, ?, ?, 'list', 1, ?, ?, ?, ?) RETURNING *")
    .get(name, JSON.stringify(SNAPSHOT), status, kind, web_disabled, NOW);
}
// API factice : enregistre chaque appel, répond via `respond(url, opts)` → { status, body, headers }
function fakeApi() {
  calls = [];
  social.setFetchForTests(async (url, opts) => {
    calls.push({ url, method: opts.method, body: opts.body, headers: opts.headers });
    const r = respond(url, opts) || { status: 200, body: {} };
    return { status: r.status, json: async () => r.body, headers: { get: (n) => (r.headers || {})[n.toLowerCase()] ?? null } };
  });
}
function fresh() {
  m = freshMarketing();
  A = m.ctx(1, { now: () => NOW, baseUrl: "https://k.test" });
  fakeApi();
  respond = () => ({ status: 200, body: { id: "x" } });
}
const connectAll = () => social.saveSocialConfig(A, { facebookPageId: "1234567890", facebookToken: "EAAB-jeton-facebook-tres-long-123", instagramUserId: "17841400000000000", linkedinAuthor: "urn:li:organization:5550001", linkedinToken: "AQV-jeton-linkedin-tres-long-456" });
const job = () => m.db.prepare("SELECT * FROM mk_jobs WHERE type = 'social.publish' ORDER BY id DESC").get();

describe("version web d'une campagne", () => {
  beforeEach(fresh);

  test("jeton signé, propre à la campagne ; seulement une vraie campagne envoyée, désactivable", () => {
    const c = sentCampaign(m.db);
    const t = web.webToken(A, c.id);
    assert.deepEqual(web.readWebToken(t, TEST_KEY), { organizationId: 1, campaignId: c.id });
    assert.equal(web.readWebToken(t.slice(0, -2) + "xx", TEST_KEY), null);
    assert.equal(web.readWebToken(signToken({ o: 1, c: c.id, k: "click" }, TEST_KEY), TEST_KEY), null, "un jeton d'un autre usage est refusé");
    assert.equal(web.webUrl(A, c.id), `https://k.test/e/${t}`);
    assert.ok(web.publishableCampaign(m.db, 1, c.id));
    assert.equal(web.publishableCampaign(m.db, 1, sentCampaign(m.db, { kind: "automation" }).id), null);
    assert.equal(web.publishableCampaign(m.db, 1, sentCampaign(m.db, { status: "draft" }).id), null);
    assert.equal(web.publishableCampaign(m.db, 1, sentCampaign(m.db, { web_disabled: 1 }).id), null);
    assert.equal(web.publishableCampaign(m.db, 2, c.id), null, "jamais pour une autre organisation");
  });

  test("rendu sans donnée personnelle : valeurs de secours, aucun lien personnel ; carte de partage", () => {
    const v = web.renderWebVersion(A, sentCampaign(m.db));
    assert.equal(v.subject, "Excel avancé, c'est parti");
    assert.match(v.html, /Bonjour à vous, votre adresse \./);
    assert.doesNotMatch(v.html, /Se désinscrire|href=""/);
    assert.equal(v.image, "https://k.test/uploads/excel.png");
    assert.equal(v.description, "Les inscriptions sont ouvertes");
    assert.deepEqual(web.shareLinks("https://k.test/e/x", "Titre").map((l) => l.network), ["facebook", "linkedin", "x", "whatsapp"]);
    assert.match(web.shareLinks("https://k.test/e/x?a=1")[0].href, /u=https%3A%2F%2Fk\.test%2Fe%2Fx%3Fa%3D1$/);
  });

  test("e-mail envoyé : « Voir dans le navigateur » mène à la version web (campagne seulement)", () => {
    const c = sentCampaign(m.db);
    const compiled = compileTemplate(SNAPSHOT, { allowed: () => true });
    const contact = { id: 1, email: "awa@x.fr", first_name: "Awa" };
    const msg = (campaign, transactional = false) => buildMessage(A, { campaign, compiled, contact, message: { id: 9 }, config: {}, linkMap: new Map(), transactional });
    assert.match(msg(c).html, new RegExp(`href="https://k\\.test/e/${web.webToken(A, c.id).replace(/[.]/g, "\\.")}"[^>]*>Voir dans le navigateur`));
    assert.doesNotMatch(msg({ ...c, kind: "automation" }).html, /Voir dans le navigateur/);
    assert.doesNotMatch(msg({ ...c, web_disabled: 1 }).html, /Voir dans le navigateur/);
  });
});

describe("publications sur les réseaux", () => {
  beforeEach(fresh);
  after(() => social.setFetchForTests(null));

  test("réglages : jetons chiffrés (jamais en clair en base), identifiants vérifiés, état « relié »", () => {
    assert.equal(social.getSocialConfig(A).facebook.connected, false);
    connectAll();
    const cfg = social.getSocialConfig(A);
    assert.deepEqual([cfg.facebook.connected, cfg.instagram.connected, cfg.linkedin.connected], [true, true, true]);
    const rows = m.db.prepare("SELECT key, value, is_secret FROM mk_settings WHERE key LIKE 'social.%token'").all();
    assert.equal(rows.length, 2);
    for (const r of rows) { assert.equal(r.is_secret, 1); assert.doesNotMatch(r.value, /jeton/); }
    assert.throws(() => social.saveSocialConfig(A, { facebookPageId: "abc" }), /numérique/);
    assert.throws(() => social.saveSocialConfig(A, { linkedinAuthor: "moi" }), /urn:li/);
    assert.throws(() => social.saveSocialConfig(A, { facebookToken: "court" }), /Jeton/);
    social.saveSocialConfig(A, { clearFacebook: true });
    assert.equal(social.getSocialConfig(A).instagram.connected, false, "Instagram dépend du jeton Meta");
  });

  test("création : une ligne par réseau, lien court, travail planifié ; règles par réseau", () => {
    connectAll();
    assert.equal(await_code(() => social.createPosts(A, { networks: [], body: "x" })), "invalid_field");
    assert.throws(() => social.createPosts(A, { networks: ["instagram"], body: "Sans image" }), /Instagram exige une image/);
    assert.throws(() => social.createPosts(A, { networks: ["linkedin"], body: "a".repeat(3001) }), /trop long pour LinkedIn/);
    assert.throws(() => social.createPosts(A, { networks: ["facebook"], body: "x", linkUrl: "http://pas-https.fr" }), /https/);
    assert.throws(() => social.createPosts(A, { networks: ["tiktok"], body: "x" }), /inconnu/);
    assert.throws(() => social.createPosts(A, { networks: ["facebook"], body: "x", scheduledAt: NOW - 3600000 }), /futur/);
    const r = social.createPosts(A, { networks: ["facebook", "linkedin"], body: "Nouvelle formation", linkUrl: "https://k.test/catalogue", scheduledAt: NOW + 3600000 });
    const rows = m.db.prepare("SELECT * FROM mk_social_posts ORDER BY id").all();
    assert.deepEqual(rows.map((p) => [p.network, p.status, p.scheduled_at]), [["facebook", "scheduled", NOW + 3600000], ["linkedin", "scheduled", NOW + 3600000]]);
    assert.equal(new Set(rows.map((p) => p.group_key)).size, 1);
    assert.match(rows[0].link_code, /^[A-Za-z0-9_-]{8}$/);
    assert.notEqual(rows[0].link_code, rows[1].link_code, "clics comptés par réseau");
    assert.equal(m.db.prepare("SELECT COUNT(*) n FROM mk_jobs WHERE type = 'social.publish'").get().n, 2);
    assert.equal(job().run_at, NOW + 3600000);
    assert.deepEqual(r.ids, rows.map((p) => p.id));
    social.saveSocialConfig(A, { clearLinkedin: true });
    assert.throws(() => social.createPosts(A, { networks: ["linkedin"], body: "x" }), /n'est pas relié/);
  });

  test("Facebook : texte + lien court (feed), ou photo avec légende ; adresse de la publication", async () => {
    connectAll();
    respond = (url) => ({ status: 200, body: url.endsWith("/feed") ? { id: "1234567890_111" } : { id: "999", post_id: "1234567890_222" } });
    const [a] = social.createPosts(A, { networks: ["facebook"], body: "Bonjour", linkUrl: "https://k.test/catalogue" }).ids;
    assert.deepEqual(await social.publishPost(A, a), { done: true, published: true });
    const p1 = social.getPost(A, a);
    assert.equal(calls[0].url, "https://graph.facebook.com/v23.0/1234567890/feed");
    const form = new URLSearchParams(calls[0].body);
    assert.equal(form.get("message"), "Bonjour");
    assert.equal(form.get("link"), `https://k.test/go/${p1.link_code}`);
    assert.equal(form.get("access_token"), "EAAB-jeton-facebook-tres-long-123");
    assert.deepEqual([p1.status, p1.external_url, p1.published_at], ["published", "https://www.facebook.com/1234567890_111", NOW]);
    const [b] = social.createPosts(A, { networks: ["facebook"], body: "Photo", imageUrl: "https://k.test/uploads/a.jpg" }).ids;
    await social.publishPost(A, b);
    assert.match(calls[1].url, /\/1234567890\/photos$/);
    assert.equal(new URLSearchParams(calls[1].body).get("url"), "https://k.test/uploads/a.jpg");
    assert.equal(social.getPost(A, b).external_url, "https://www.facebook.com/1234567890_222");
  });

  test("Instagram : conteneur, publication, lien permanent", async () => {
    connectAll();
    respond = (url) => ({ status: 200, body: url.endsWith("/media") ? { id: "C1" } : url.endsWith("/media_publish") ? { id: "M1" } : { permalink: "https://www.instagram.com/p/abc/" } });
    const [id] = social.createPosts(A, { networks: ["instagram"], body: "Légende #excel", imageUrl: "https://k.test/uploads/a.jpg" }).ids;
    await social.publishPost(A, id);
    assert.deepEqual(calls.map((c) => c.url.replace(/access_token=[^&]+/, "access_token=…")), [
      "https://graph.facebook.com/v23.0/17841400000000000/media", "https://graph.facebook.com/v23.0/17841400000000000/media_publish", "https://graph.facebook.com/v23.0/M1?fields=permalink&access_token=…",
    ]);
    assert.equal(new URLSearchParams(calls[1].body).get("creation_id"), "C1");
    assert.equal(social.getPost(A, id).external_url, "https://www.instagram.com/p/abc/");
  });

  test("LinkedIn : en-têtes de version, auteur, article avec lien court, URN renvoyé par l'en-tête", async () => {
    connectAll();
    respond = () => ({ status: 201, body: null, headers: { "x-restli-id": "urn:li:share:7000" } });
    const [id] = social.createPosts(A, { networks: ["linkedin"], body: "Nouvelle formation\nDétails", linkUrl: "https://k.test/catalogue" }).ids;
    await social.publishPost(A, id);
    const c = calls[0];
    assert.equal(c.url, "https://api.linkedin.com/rest/posts");
    assert.equal(c.headers.Authorization, "Bearer AQV-jeton-linkedin-tres-long-456");
    assert.equal(c.headers["LinkedIn-Version"], "202608");
    assert.equal(c.headers["X-Restli-Protocol-Version"], "2.0.0");
    const body = JSON.parse(c.body);
    assert.equal(body.author, "urn:li:organization:5550001");
    assert.equal(body.content.article.title, "Nouvelle formation");
    assert.match(body.content.article.source, /^https:\/\/k\.test\/go\//);
    assert.equal(social.getPost(A, id).external_url, "https://www.linkedin.com/feed/update/urn:li:share:7000");
    assert.equal(social.linkedinVersion(Date.UTC(2026, 0, 15)), "202511");
  });

  test("erreurs : jeton refusé → échec expliqué (jeton jamais cité) ; panne → 2 nouveaux essais puis échec ; relance", async () => {
    connectAll();
    respond = () => ({ status: 400, body: { error: { message: "Error validating access token: access_token=EAAB-jeton-facebook-tres-long-123", code: 190 } } });
    const [a] = social.createPosts(A, { networks: ["facebook"], body: "x" }).ids;
    assert.deepEqual(await social.publishPost(A, a), { done: true, failed: true });
    const p = social.getPost(A, a);
    assert.equal(p.status, "failed");
    assert.match(p.error, /a refusé le jeton d'accès/);
    assert.doesNotMatch(p.error, /EAAB/);
    respond = () => ({ status: 503, body: {} });
    const [b] = social.createPosts(A, { networks: ["facebook"], body: "y" }).ids;
    let r = await social.publishPost(A, b);
    assert.deepEqual([r.retry, r.waitMs, social.getPost(A, b).status], [true, 60000, "scheduled"]);
    r = await social.publishPost({ ...A, now: () => NOW + 60000 }, b);
    assert.equal(r.waitMs, 120000);
    r = await social.publishPost({ ...A, now: () => NOW + 180000 }, b);
    assert.equal(social.getPost(A, b).status, "failed");
    assert.match(social.getPost(A, b).error, /momentanément indisponible/);
    social.retryPost(A, b);
    respond = () => ({ status: 200, body: { id: "1234567890_9" } });
    await social.publishPost(A, b);
    assert.equal(social.getPost(A, b).status, "published");
  });

  test("jamais de double publication : réservation avant l'appel ; publication interrompue non renvoyée", async () => {
    connectAll();
    const [id] = social.createPosts(A, { networks: ["facebook"], body: "x" }).ids;
    await social.publishPost(A, id);
    await social.publishPost(A, id);
    assert.equal(calls.length, 1);
    const [b] = social.createPosts(A, { networks: ["facebook"], body: "z" }).ids;
    m.db.prepare("UPDATE mk_social_posts SET status = 'publishing', updated_at = datetime(?, 'unixepoch') WHERE id = ?").run((NOW - 11 * 60000) / 1000, b);
    await social.publishPost(A, b);
    assert.equal(calls.length, 1, "aucun nouvel appel");
    assert.match(social.getPost(A, b).error, /interrompue/);
  });

  test("programmée : attend son heure ; annulée : ne part jamais ; retirée de la liste", async () => {
    connectAll();
    const [id] = social.createPosts(A, { networks: ["facebook"], body: "plus tard", scheduledAt: NOW + 7200000 }).ids;
    assert.deepEqual(await social.publishPost(A, id), { done: false, waitMs: 7200000 });
    social.cancelPost(A, id);
    assert.deepEqual(await social.publishPost({ ...A, now: () => NOW + 7200000 }, id), { done: true });
    assert.equal(calls.length, 0);
    assert.equal(await code(Promise.resolve().then(() => social.cancelPost(A, id))), "invalid_state");
    social.deletePost(A, id);
    assert.equal(social.listPosts(A).length, 0);
  });

  test("lien court : redirige vers le lien, compte les clics (robots exclus)", () => {
    connectAll();
    social.createPosts(A, { networks: ["facebook"], body: "x", linkUrl: "https://k.test/catalogue" });
    const p = social.listPosts(A)[0];
    assert.equal(p.shortUrl, `https://k.test/go/${p.link_code}`);
    assert.equal(social.resolveShortLink(m.db, p.link_code), "https://k.test/catalogue");
    assert.equal(social.resolveShortLink(m.db, p.link_code, { bot: true }), "https://k.test/catalogue");
    assert.equal(social.getPost(A, p.id).click_count, 1);
    assert.equal(social.resolveShortLink(m.db, "inexistant"), null);
    assert.equal(social.resolveShortLink(m.db, "../../x"), null);
  });

  test("test de connexion (lecture seule) : nom de la page mémorisé ; jeton refusé expliqué", async () => {
    connectAll();
    respond = () => ({ status: 200, body: { name: "KOLAKISA Formations" } });
    const ok = await social.testConnection(A, "facebook");
    assert.equal(ok.ok, true);
    assert.equal(social.getSocialConfig(A).facebook.pageName, "KOLAKISA Formations");
    assert.equal(calls[0].method, "GET");
    respond = () => ({ status: 401, body: { error: { message: "expired", code: 190 } } });
    const ko = await social.testConnection(A, "instagram");
    assert.equal(ko.ok, false);
    assert.match(ko.message, /Instagram a refusé le jeton/);
    assert.match((await social.testConnection(A, "linkedin")).message, /première publication/);
  });
});
function await_code(fn) { try { fn(); } catch (e) { return e.code; } return null; }

describe("réseaux sociaux : pages web", () => {
  let srv, boss, campaignId;
  const sql = (fn) => { const db = srv.db(); try { return fn(db); } finally { db.close(); } };
  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv);
    campaignId = sql((db) => sentCampaign(db, { name: "Lancement Excel" }).id);
  });
  after(() => srv.stop());

  test("version web publique : carte de partage, boutons, contenu isolé sans script ; désactivation", async () => {
    const token = signToken({ o: 1, c: campaignId, k: "web" }, TEST_KEY);
    const page = await boss.get(`/e/${token}`);
    assert.equal(page.status, 200);
    assert.match(page.text, /<meta property="og:title" content="Excel avancé, c&#39;est parti">/);
    assert.match(page.text, /<meta property="og:image" content="https:\/\/k\.test\/uploads\/excel\.png">/);
    assert.match(page.text, /facebook\.com\/sharer\/sharer\.php\?u=https%3A%2F%2Fk\.test%2Fe%2F/);
    const content = await boss.get(`/e/${token}/contenu`);
    assert.match(content.headers.get("content-security-policy"), /default-src 'none'/);
    assert.match(content.text, /Bonjour à vous/);
    assert.equal((await boss.get(`/e/${token.slice(0, -3)}abc`)).status, 404);
    const report = await boss.get(`/marketing/campagnes/${campaignId}`);
    assert.match(report.text, /Version web et partage/);
    assert.match(report.text, /href="\/marketing\/reseaux\?campagne=\d+#nouvelle"/);
    await boss.post(`/marketing/campagnes/${campaignId}/version-web`, { disabled: "1" });
    assert.equal((await boss.get(`/e/${token}`)).status, 404);
    await boss.post(`/marketing/campagnes/${campaignId}/version-web`, { disabled: "0" });
    assert.equal((await boss.get(`/e/${token}`)).status, 200);
  });

  test("réglages, publication programmée depuis une campagne, lien court, annulation", async () => {
    let r = await boss.get("/marketing/reseaux");
    assert.match(r.text, /Aucun réseau relié/);
    r = await boss.post("/marketing/reseaux/reglages", { facebook_page_id: "1234567890", facebook_token: "EAAB-jeton-facebook-tres-long-123" });
    assert.equal(r.location, "/marketing/reseaux/reglages");
    const settings = await boss.get("/marketing/reseaux/reglages");
    assert.match(settings.text, /enregistré — laissez vide pour le garder/);
    assert.doesNotMatch(settings.text, /EAAB-jeton/, "jeton jamais affiché");
    const compose = await boss.get(`/marketing/reseaux?campagne=${campaignId}`);
    assert.match(compose.text, /Partage d'une campagne envoyée/);
    assert.match(compose.text, /value="https:\/\/k\.test\/e\/[^"]+"/);
    const later = new Date(Date.now() + 86400000).toISOString();
    r = await boss.post("/marketing/reseaux", { networks: "facebook", body: "Découvrez Excel avancé", link_url: "https://k.test/catalogue", when: "later", send_at_utc: later, campaign_id: String(campaignId) });
    let list = await boss.get(r.location);
    assert.match(list.text, /1 publication programmée\./);
    assert.match(list.text, /Programmée/);
    const p = sql((db) => db.prepare("SELECT id, link_code, campaign_id FROM mk_social_posts").get());
    assert.equal(p.campaign_id, campaignId);
    const go = await boss.get(`/go/${p.link_code}`, { headers: { "User-Agent": "Mozilla/5.0 (Macintosh) Chrome/120" } });
    assert.equal(go.status, 302);
    assert.equal(go.location, "https://k.test/catalogue");
    assert.equal(sql((db) => db.prepare("SELECT click_count FROM mk_social_posts WHERE id = ?").get(p.id).click_count), 1);
    await boss.post(`/marketing/reseaux/${p.id}/annuler`);
    list = await boss.get("/marketing/reseaux");
    assert.match(list.text, /Annulée/);
    assert.equal((await boss.get("/go/inexistant1")).status, 404);
  });
});
