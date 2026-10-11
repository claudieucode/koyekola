// Palier 2 — un domaine qui n'est pas explicitement associé à Kolakisa ne sert JAMAIS le site principal ni celui d'un autre site.
// Hôte principal (SITE_URL) → site principal ; domaine d'un site actif → ce site ; site archivé / supprimé → 404 ; tout autre hôte → 421.
// Vrais serveurs, vraies requêtes avec un en-tête Host choisi.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const http = require("http");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, loginInstructor } = require("./helpers");

function hostGet(srv, host, urlPath, method = "GET") {
  const u = new URL(srv.base);
  return new Promise((resolve, reject) => {
    const r = http.request({ host: u.hostname, port: u.port, path: urlPath, method, headers: { Host: host } }, (resp) => {
      let text = ""; resp.on("data", (d) => (text += d)); resp.on("end", () => resolve({ status: resp.statusCode, text, location: resp.headers.location }));
    });
    r.on("error", reject); r.end();
  });
}

describe("hôtes d'un déploiement avec SITE_URL (https://k.test)", () => {
  let srv, boss, db, A;
  const ORIGIN = () => ({ Origin: srv.base });
  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv);
    db = srv.db();
    const org = db.prepare("SELECT id FROM mk_organizations").get().id;
    A = Number(db.prepare("INSERT INTO mk_sites (organization_id, name, slug, tokens) VALUES (?, 'Site Un', 'site-un', '{}')").run(org).lastInsertRowid);
    const p = Number(db.prepare("INSERT INTO mk_landing_pages (organization_id, name, slug, title, status, site_id, published_at) VALUES (?, 'ACCUEIL-SITE-UN', 'accueil-site-un', 'ACCUEIL-SITE-UN', 'published', ?, datetime('now'))").run(org, A).lastInsertRowid);
    db.prepare("UPDATE mk_sites SET home_page_id = ? WHERE id = ?").run(p, A);
    const cur = JSON.parse((await boss.get(`/marketing/site-web/sites/${A}/reglages.json`)).text);
    const r = await boss.request(`/marketing/site-web/sites/${A}/reglages.json`, { method: "PUT", json: { settings: { ...cur.settings, seo: { ...cur.settings.seo, publicUrl: "https://un.test" } }, revision: cur.revision }, headers: ORIGIN() });
    assert.equal(r.status, 200);
  });
  after(() => srv.stop());
  const get = (host, p, m) => hostGet(srv, host, p, m);

  test("le domaine principal officiel sert le site principal (écritures variées du même hôte : majuscules, port, point final)", async () => {
    for (const h of ["k.test", "K.TEST", "k.test:8443", "k.test.", "K.Test:443"]) {
      const r = await get(h, "/blog");
      assert.equal(r.status, 200, h);
    }
    assert.equal((await get("k.test", "/")).status, 200);
  });
  test("www. du domaine principal : redirigé vers le domaine officiel (comportement d'origine), pas refusé", async () => {
    const r = await get("www.k.test", "/blog");
    assert.equal(r.status, 301); assert.equal(r.location, "https://k.test/blog");
  });
  test("accès par l'adresse locale (administration, sondes) : continue de fonctionner", async () => {
    assert.equal((await boss.get("/marketing")).status, 200);
    assert.equal((await boss.get("/formateur")).status, 200);
    assert.equal((await boss.get("/sante")).status, 200);
    assert.equal((await get("127.0.0.1", "/blog")).status, 200);
    assert.equal((await get("localhost:3000", "/blog")).status, 200);
  });
  test("domaine d'un site actif : sert uniquement ce site", async () => {
    const r = await get("un.test", "/");
    assert.equal(r.status, 200); assert.match(r.text, /ACCUEIL-SITE-UN/);
    assert.equal((await get("UN.test:443", "/")).status, 200);
    assert.equal((await get("un.test", "/blog")).status, 404);
  });
  test("domaine inconnu : 421 partout (pages, blog, administration, connexion, écritures), jamais de contenu", async () => {
    for (const [m, u] of [["GET", "/"], ["GET", "/blog"], ["GET", "/cours/x"], ["GET", "/marketing"], ["GET", "/formateur"], ["GET", "/connexion"], ["GET", "/p/accueil-site-un"], ["GET", "/sitemap.xml"], ["GET", "/robots.txt"], ["POST", "/connexion"], ["POST", "/marketing/pages"]]) {
      const r = await get("inconnu.test", u, m);
      assert.equal(r.status, 421, `${m} ${u} → ${r.status}`);
      assert.doesNotMatch(r.text, /ACCUEIL-SITE-UN|KOLAKISA|<html/i, u);
    }
    assert.equal((await get("inconnu.test", "/sante")).status, 200, "la sonde de santé reste joignable");
  });
  test("hôtes qui ressemblent à un hôte autorisé : refusés (aucune confusion par préfixe, suffixe, sous-domaine ou IP trompeuse)", async () => {
    for (const h of ["k.test.evil.com", "evilk.test", "xk.test", "sub.k.test", "un.test.evil.com", "sub.un.test", "127.evil.com", "10.0.0.1.evil.com", "localhost.evil.com", "192.168.1.1.evil.com", "k.test@evil.com", "", "k test"]) {
      const r = await get(h || "x", "/blog");
      if (h === "") continue; // l'en-tête Host ne peut pas être vide avec Node : cas couvert par la règle (hôte vide = inconnu)
      assert.ok([421, 400].includes(r.status), `${h} → ${r.status}`);
    }
  });
  test("un site archivé puis supprimé : son domaine répond 404 (jamais le site principal) ; restauré : il sert à nouveau le site", async () => {
    await boss.post(`/marketing/site-web/sites/${A}/archiver`, {});
    assert.equal((await get("un.test", "/")).status, 404);
    assert.equal((await get("un.test", "/blog")).status, 404);
    await boss.post(`/marketing/site-web/sites/${A}/supprimer`, { confirmation: "Site Un" });
    assert.equal((await get("un.test", "/")).status, 404);
    await boss.post(`/marketing/site-web/sites/${A}/recuperer`, {});
    await boss.post(`/marketing/site-web/sites/${A}/restaurer`, {});
    db.prepare("UPDATE mk_landing_pages SET status = 'published' WHERE site_id = ?").run(A);
    assert.equal((await get("un.test", "/")).status, 200);
  });
  test("domaine retiré d'un site (changé pour un autre) : devient inconnu → 421", async () => {
    const cur = JSON.parse((await boss.get(`/marketing/site-web/sites/${A}/reglages.json`)).text);
    await boss.request(`/marketing/site-web/sites/${A}/reglages.json`, { method: "PUT", json: { settings: { ...cur.settings, seo: { ...cur.settings.seo, publicUrl: "https://deux.test" } }, revision: cur.revision }, headers: ORIGIN() });
    assert.equal((await get("un.test", "/")).status, 421);
    assert.equal((await get("deux.test", "/")).status, 200);
  });
  test("normalisation des noms d'hôte (urls.normHost) : casse, port, point final, IDN", () => {
    const { normHost } = require("../src/services/urls");
    assert.equal(normHost("K.TEST:8443"), "k.test");
    assert.equal(normHost("k.test."), "k.test");
    assert.equal(normHost("CAFÉ.test"), "xn--caf-dma.test");
    assert.equal(normHost("[::1]:3000"), "[::1]");
    assert.equal(normHost(""), "");
    assert.notEqual(normHost("k.test"), normHost("k.test.evil.com"));
  });
});

describe("liste facultative HOTES_AUTORISES (domaine provisoire de l'hébergeur)", () => {
  let srv;
  before(async () => { srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", HOTES_AUTORISES: "Apercu.Hebergeur.test, autre.test", SMTP_HOST: "" }); });
  after(() => srv.stop());
  test("un hôte listé sert le site principal ; les autres restent refusés", async () => {
    assert.equal((await hostGet(srv, "apercu.hebergeur.test", "/blog")).status, 200);
    assert.equal((await hostGet(srv, "AUTRE.test:80", "/blog")).status, 200);
    assert.equal((await hostGet(srv, "inconnu.test", "/blog")).status, 421);
  });
});

describe("installation sans SITE_URL (développement, premier démarrage)", () => {
  let srv;
  before(async () => { srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "", SMTP_HOST: "" }); });
  after(() => srv.stop());
  test("aucune restriction d'hôte : tout continue de fonctionner comme avant", async () => {
    assert.equal((await hostGet(srv, "nimporte.quoi.test", "/blog")).status, 200);
  });
});
