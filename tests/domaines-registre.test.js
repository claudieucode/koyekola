// KOLAKISA — registre des domaines des sites (TITAN XXXII), scénarios A à J.
// Partie 1 : service (base jetable, DNS/HTTPS injectés). Partie 2 : vrai serveur en mode « strict » (comme la production) avec un faux DNS par fichier (KOLAKISA_TEST_DNS_FILE,
// actif seulement en NODE_ENV=test). Aucun accès réseau ni DNS réel.
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const http = require("node:http");
const SCRATCH = fs.mkdtempSync(path.join(os.tmpdir(), "koyekola-domaines-"));
process.env.DATA_DIR = path.join(SCRATCH, "data");
process.env.UPLOADS_DIR = path.join(SCRATCH, "uploads");
process.env.SITE_URL = "https://k.test";
process.env.PLATFORM_DOMAIN = "plat.test";
process.env.NODE_ENV = "test";
process.env.KOLAKISA_DOMAIN_VERIFY = "strict";
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { MIGRATIONS, quiet, TEST_KEY } = require("./marketing-helpers");
const { startServer, loginInstructor } = require("./helpers");
after(() => fs.rmSync(SCRATCH, { recursive: true, force: true }));

describe("registre des domaines — service", () => {
  let db, svc, urls, ORG, A, B, ctx;
  const one = (sql, ...a) => db.prepare(sql).get(...a);
  const mkSite = (name, slug) => Number(db.prepare("INSERT INTO mk_sites (organization_id, name, slug, tokens) VALUES (?, ?, ?, '{}')").run(ORG, name, slug).lastInsertRowid);
  const dnsOf = (txt = {}, routing = {}, tlsOk = {}) => ({ txt: async (n) => { if (!txt[n]) { const e = new Error("x"); e.code = "ENODATA"; throw e; } return txt[n]; }, routing: async (h) => ({ a: [], aaaa: [], cname: [], ...(routing[h] || {}) }), tls: async (h) => (tlsOk[h] ? { ok: true } : { ok: false, code: "ERR" }) });

  before(() => {
    db = require("../src/config/database");
    const { migrate } = require("../src/marketing/db/migrate");
    migrate(db, { dir: MIGRATIONS, dbPath: path.join(SCRATCH, "data", "KOYEKOLA.db"), backupDir: path.join(SCRATCH, "backups"), log: quiet });
    svc = require("../src/services/siteDomains"); urls = require("../src/services/urls");
    ORG = Number(db.prepare("INSERT INTO mk_organizations (name, slug) VALUES ('O', 'o')").run().lastInsertRowid);
    A = mkSite("Alpha", "alpha"); B = mkSite("Beta", "beta");
    ctx = { db, organizationId: ORG, userId: null };
    svc.setCheckersForTests(dnsOf({}, { "k.test": { a: ["203.0.113.10"] } }));
  });

  test("validation : noms valides normalisés ; IP, hôtes locaux, hôte de la plateforme, domaine de plateforme et noms invalides refusés", () => {
    assert.equal(svc.validateHost("WWW.Client.COM."), "www.client.com");
    assert.equal(svc.validateHost("https://www.client.com/chemin?x=1"), "www.client.com");
    assert.equal(svc.validateHost("café.fr"), "xn--caf-dma.fr", "IDN converti en ASCII");
    for (const bad of ["", "client", "10.0.0.1", "localhost", "intranet.local", "k.test", "www.k.test", "blog.k.test", "x.plat.test", "plat.test", "a_b.com", "-a.com", "a..com", "client.com:8080", "a b.com", `${"a".repeat(64)}.com`, "client.123", "https://user@client.com"]) {
      assert.throws(() => svc.validateHost(bad), /./, `« ${bad} » doit être refusé`);
    }
    assert.equal(svc.validateHost("mon-site.plat.test", { kind: "platform" }), "mon-site.plat.test");
  });

  test("libellé de sous-domaine : normalisé, minimum 3 caractères, noms réservés et punycode neutralisés", () => {
    assert.equal(svc.cleanLabel("Café de l'Été !"), "cafe-de-l-ete");
    assert.equal(svc.cleanLabel("ab"), "absite");
    assert.equal(svc.cleanLabel("www"), "www-site");
    assert.equal(svc.cleanLabel("admin"), "admin-site");
    assert.doesNotMatch(svc.cleanLabel("xn--abc"), /--|^xn--/, "jamais de punycode ni de double tiret");
    assert.ok(svc.cleanLabel("x".repeat(80)).length <= 40);
  });

  test("scénario D — un domaine saisi reste « pending » : rien n'est servi, aucune vérification sans le TXT", async () => {
    const d = svc.addCustomDomain(ctx, A, "client.example");
    assert.equal(d.status, "pending"); assert.match(d.verification_token, /^kolakisa-site-verification=[0-9a-f]{48}$/);
    urls.invalidateSites();
    assert.equal(urls.siteForHost("client.example"), null, "un domaine non vérifié ne sert pas le site");
    const r = await svc.verifyDomain(ctx, A, d.id);
    assert.equal(r.status, "pending"); assert.match(r.last_check_error, /TXT/);
    assert.equal(urls.siteForHost("client.example"), null);
    assert.equal(one("SELECT settings FROM mk_sites WHERE id = ?", A).settings.includes("client.example"), false, "l'adresse publique des réglages ne reflète pas un domaine non vérifié");
  });

  test("scénario C — le TXT prouve la propriété : le domaine devient principal, le serveur le résout, l'adresse publique des réglages le reflète", async () => {
    const d = one("SELECT * FROM mk_site_domains WHERE site_id = ? AND host = 'client.example'", A);
    svc.setCheckersForTests(dnsOf({ "_kolakisa-verify.client.example": ["autre", d.verification_token] }, { "client.example": { a: ["203.0.113.10"] }, "k.test": { a: ["203.0.113.10"] } }, { "client.example": true }));
    const r = await svc.verifyDomain(ctx, A, d.id);
    assert.equal(r.status, "verified"); assert.equal(r.canonical, true); assert.equal(r.dns_status, "ok"); assert.equal(r.tls_status, "ok"); assert.equal(r.operational, true);
    urls.invalidateSites();
    assert.equal(urls.siteForHost("client.example").id, A);
    assert.equal(JSON.parse(one("SELECT settings FROM mk_sites WHERE id = ?", A).settings).seo.publicUrl, "https://client.example");
  });

  test("scénario F — un domaine vérifié ne peut pas être réclamé par un autre site ; le plus rapide à prouver l'obtient", async () => {
    assert.throws(() => svc.addCustomDomain(ctx, B, "client.example"), /déjà utilisé par un autre site/);
    // Deux sites réclament le même domaine encore libre : seul celui qui prouve la propriété l'obtient
    const a = svc.addCustomDomain(ctx, A, "partage.example"), b = svc.addCustomDomain(ctx, B, "partage.example");
    assert.equal(one("SELECT COUNT(*) n FROM mk_site_domains WHERE host = 'partage.example'").n, 2, "réclamer ne bloque personne");
    svc.setCheckersForTests(dnsOf({ "_kolakisa-verify.partage.example": [a.verification_token] }));
    assert.equal((await svc.verifyDomain(ctx, A, a.id)).status, "verified");
    svc.setCheckersForTests(dnsOf({ "_kolakisa-verify.partage.example": [b.verification_token] }));
    await assert.rejects(() => svc.verifyDomain(ctx, B, b.id), /déjà vérifié par un autre site/);
    assert.equal(one("SELECT status FROM mk_site_domains WHERE id = ?", b.id).status, "pending");
    assert.throws(() => db.prepare("UPDATE mk_site_domains SET status = 'verified' WHERE id = ?").run(b.id), /UNIQUE/, "l'index unique interdit deux sites vérifiés sur un même hôte");
  });

  test("alias : le jumeau www d'un domaine vérifié est vérifié d'office, secondaire ; le principal est unique ; retirer le principal promeut un autre domaine vérifié", () => {
    const www = svc.addCustomDomain(ctx, A, "www.client.example");
    assert.equal(www.status, "verified"); assert.equal(www.canonical, false);
    urls.invalidateSites();
    const info = urls.siteForHost("www.client.example");
    assert.equal(info.id, A); assert.equal(info.host, "client.example", "l'hôte principal du site est client.example : www y redirige");
    svc.setCanonical(ctx, A, www.id);
    urls.invalidateSites();
    assert.equal(urls.siteForHost("client.example").host, "www.client.example");
    assert.equal(one("SELECT COUNT(*) n FROM mk_site_domains WHERE site_id = ? AND is_canonical = 1 AND status = 'verified'", A).n, 1);
    svc.disableDomain(ctx, A, www.id);
    urls.invalidateSites();
    assert.equal(urls.siteForHost("client.example").host, "client.example", "le domaine restant est promu");
    assert.equal(urls.siteForHost("www.client.example"), null, "le domaine retiré ne sert plus");
  });

  test("scénario B — adresse de plateforme : libellé unique, réservés évités, résolue par le serveur ; sans PLATFORM_DOMAIN : indisponible et dit pourquoi", () => {
    const s1 = mkSite("Café Été", "cafe-ete"), s2 = mkSite("Café Été bis", "cafe_ete"), s3 = mkSite("WWW", "www-x");
    const d1 = svc.ensurePlatformDomain(ctx, s1), d2 = svc.ensurePlatformDomain(ctx, s2);
    assert.equal(d1.host, "cafe-ete.plat.test"); assert.equal(d2.host, "cafe-ete-2.plat.test", "collision évitée");
    db.prepare("UPDATE mk_sites SET slug = 'www' WHERE id = ?").run(s3);
    assert.equal(svc.ensurePlatformDomain(ctx, s3).host, "www-site.plat.test", "nom réservé évité");
    assert.equal(svc.ensurePlatformDomain(ctx, s1).id, d1.id, "idempotent");
    urls.invalidateSites();
    assert.equal(urls.siteForHost("cafe-ete.plat.test").id, s1);
    assert.equal(urls.siteForHost("inconnu.plat.test"), null, "un sous-domaine non attribué n'est pas un site");
    assert.equal(d1.tls_status, "unknown", "le HTTPS n'est pas annoncé tant qu'il n'est pas contrôlé");
    const saved = process.env.PLATFORM_DOMAIN; delete process.env.PLATFORM_DOMAIN;
    try { assert.equal(svc.platformStatus().available, false); assert.match(svc.platformStatus().reason, /PLATFORM_DOMAIN/); assert.throws(() => svc.ensurePlatformDomain(ctx, s1), /PLATFORM_DOMAIN/); } finally { process.env.PLATFORM_DOMAIN = saved; }
  });

  test("scénario I — DNS non conforme ou HTTPS absent : états explicites, jamais « opérationnel »", async () => {
    const s = mkSite("Gamma", "gamma");
    const d = svc.addCustomDomain(ctx, s, "gamma.example");
    svc.setCheckersForTests(dnsOf({ "_kolakisa-verify.gamma.example": [d.verification_token] }, { "gamma.example": { a: ["198.51.100.7"] }, "k.test": { a: ["203.0.113.10"] } }));
    let r = await svc.verifyDomain(ctx, s, d.id);
    assert.equal(r.status, "verified"); assert.equal(r.dns_status, "mismatch"); assert.equal(r.tls_status, "pending"); assert.equal(r.operational, false); assert.match(r.note, /ne pointe pas encore/);
    svc.setCheckersForTests(dnsOf({}, { "gamma.example": { a: ["203.0.113.10"] }, "k.test": { a: ["203.0.113.10"] } }, {}));
    r = await svc.refreshDomain(ctx, s, d.id);
    assert.equal(r.dns_status, "ok"); assert.equal(r.tls_status, "failed"); assert.equal(r.operational, false); assert.match(r.note, /certificat HTTPS/);
    svc.setCheckersForTests(dnsOf({}, { "k.test": { a: ["203.0.113.10"] } }, {}));
    r = await svc.refreshDomain(ctx, s, d.id);
    assert.equal(r.dns_status, "missing");
  });

  test("reprise de l'existant : un domaine déjà saisi devient « vérifié / legacy » (aucun site ne perd son adresse) ; idempotent ; premier servi en cas de doublon", () => {
    const s1 = mkSite("Hérité 1", "herite-1"), s2 = mkSite("Hérité 2", "herite-2");
    for (const s of [s1, s2]) db.prepare("UPDATE mk_sites SET settings = ? WHERE id = ?").run(JSON.stringify({ seo: { publicUrl: "https://herite.example" } }), s);
    assert.equal(svc.backfillLegacy(db), 1, "un seul site reprend le domaine");
    assert.equal(svc.backfillLegacy(db), 0, "idempotent");
    const r = one("SELECT * FROM mk_site_domains WHERE host = 'herite.example'");
    assert.deepEqual([r.site_id, r.status, r.verification_method, r.is_canonical], [s1, "verified", "legacy", 1]);
  });

  test("réglages : l'ancienne « adresse publique » passe par le registre (production : à vérifier, le domaine actuel reste servi) ; adresse de plateforme inchangée acceptée", () => {
    const s = mkSite("Delta", "delta");
    assert.equal(svc.syncFromPublicUrl(ctx, s, ""), "");
    assert.equal(svc.syncFromPublicUrl(ctx, s, "https://delta.example"), "", "strict : en attente, rien n'est publié");
    assert.equal(one("SELECT status FROM mk_site_domains WHERE site_id = ? AND host = 'delta.example'", s).status, "pending");
    assert.throws(() => svc.syncFromPublicUrl(ctx, s, "https://k.test"), /plateforme/);
    assert.throws(() => svc.syncFromPublicUrl(ctx, s, "https://client.example"), /déjà utilisée par un autre site/);
    const p = svc.ensurePlatformDomain(ctx, s);
    assert.equal(svc.syncFromPublicUrl(ctx, s, `https://${p.host}`), `https://${p.host}`, "enregistrer des réglages inchangés ne casse rien");
  });
});

describe("registre des domaines — serveur (mode strict, faux DNS)", () => {
  let srv, boss, db, org, A, B, dnsFile, srv2, boss2, S2;
  const hostReq = (server, host, urlPath, { method = "GET", headers = {} } = {}) => {
    const u = new URL(server.base);
    return new Promise((resolve, reject) => {
      const r = http.request({ host: u.hostname, port: u.port, path: urlPath, method, headers: { Host: host, ...headers } }, (resp) => { let text = ""; resp.on("data", (d) => (text += d)); resp.on("end", () => resolve({ status: resp.statusCode, text, location: resp.headers.location, headers: resp.headers })); });
      r.on("error", reject); r.end();
    });
  };
  const get = (host, p) => hostReq(srv, host, p);
  const one = (sql, ...a) => db.prepare(sql).get(...a);
  const mkSite = (name, slug) => Number(db.prepare("INSERT INTO mk_sites (organization_id, name, slug, tokens) VALUES (?, ?, ?, '{}')").run(org, name, slug).lastInsertRowid);
  const mkPage = (site, slug) => Number(db.prepare("INSERT INTO mk_landing_pages (organization_id, name, slug, title, status, site_id, published_at, kind, indexable) VALUES (?, ?, ?, ?, 'published', ?, datetime('now'), 'page', 1)").run(org, slug, slug, `TITRE-${slug.toUpperCase()}`, site).lastInsertRowid);
  const dns = (obj) => fs.writeFileSync(dnsFile, JSON.stringify(obj));
  const page = async (p) => (await boss.get(p)).text;

  before(async () => {
    dnsFile = path.join(SCRATCH, "dns.json"); dns({});
    const env = { ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "", KOLAKISA_DOMAIN_VERIFY: "strict", KOLAKISA_TEST_DNS_FILE: dnsFile };
    srv = await startServer({ ...env, PLATFORM_DOMAIN: "plat.test" });
    boss = await loginInstructor(srv); db = srv.db(); org = one("SELECT id FROM mk_organizations").id;
    A = mkSite("Site A", "site-a"); B = mkSite("Site B", "site-b");
    const hA = mkPage(A, "accueil-a"), hB = mkPage(B, "accueil-b"); mkPage(A, "offre-a"); mkPage(null, "page-principale");
    db.prepare("UPDATE mk_sites SET home_page_id = ? WHERE id = ?").run(hA, A); db.prepare("UPDATE mk_sites SET home_page_id = ? WHERE id = ?").run(hB, B);
    db.prepare("INSERT INTO mk_forms (organization_id, name, slug, status, consent_text, site_id) VALUES (?, 'Form B', 'form-b', 'published', 'ok', ?)").run(org, B);
    // second serveur SANS domaine de plateforme (le processus de test en définit un, hérité sinon)
    srv2 = await startServer({ ...env, PLATFORM_DOMAIN: "" }); boss2 = await loginInstructor(srv2);
    const db2 = srv2.db(); S2 = Number(db2.prepare("INSERT INTO mk_sites (organization_id, name, slug, tokens) VALUES (?, 'Site S2', 'site-s2', '{}')").run(db2.prepare("SELECT id FROM mk_organizations").get().id).lastInsertRowid); db2.close();
  });
  after(async () => { db.close(); await srv.stop(); await srv2.stop(); });
  const countS2 = () => { const d = srv2.db(); try { return d.prepare("SELECT COUNT(*) n FROM mk_site_domains WHERE kind = 'platform' AND site_id = ?").get(S2).n; } finally { d.close(); } };

  test("scénario A — le site maître reste servi sur son domaine, l'administration fonctionne ; /sante répond sur tout hôte", async () => {
    assert.equal((await get("k.test", "/p/page-principale")).status, 200);
    assert.match((await get("k.test", "/p/page-principale")).text, /TITRE-PAGE-PRINCIPALE/);
    assert.equal((await get("k.test", "/")).status, 200);
    assert.equal((await boss.get("/marketing")).status, 200);
    assert.equal((await get("n-importe-quoi.example", "/sante")).status, 200);
  });

  test("scénario E — hôte inconnu : 421, jamais le site principal ni un site", async () => {
    for (const h of ["inconnu.example", "inconnu.plat.test", "www.client-a.example"]) {
      const r = await get(h, "/"); assert.equal(r.status, 421, h); assert.doesNotMatch(r.text, /TITRE-/);
    }
  });

  test("scénario B — adresse de plateforme : activée depuis « Domaines », servie sur SON hôte avec SON contenu ; autre sous-domaine : 421", async () => {
    const r = await boss.post(`/marketing/site-web/sites/${A}/domaines/plateforme`, {});
    assert.equal(r.status, 302);
    const row = one("SELECT * FROM mk_site_domains WHERE site_id = ? AND kind = 'platform'", A);
    assert.equal(row.host, "site-a.plat.test"); assert.equal(row.status, "verified");
    const ok = await get("site-a.plat.test", "/"); assert.equal(ok.status, 200); assert.match(ok.text, /TITRE-ACCUEIL-A/); assert.doesNotMatch(ok.text, /TITRE-PAGE-PRINCIPALE/);
    assert.equal((await get("site-b.plat.test", "/")).status, 421, "le site B n'a pas (encore) d'adresse");
    assert.match(await page(`/marketing/site-web/sites/${A}/domaines`), /site-a\.plat\.test/);
  });

  test("scénarios D et C — domaine personnalisé : « à vérifier » et non servi ; après le TXT, vérifié par l'écran, servi, DNS/HTTPS contrôlés ; l'adresse de plateforme y redirige", async () => {
    await boss.post(`/marketing/site-web/sites/${A}/domaines`, { domaine: "client-a.example" });
    const d = one("SELECT * FROM mk_site_domains WHERE host = 'client-a.example'");
    assert.equal(d.status, "pending");
    assert.equal((await get("client-a.example", "/")).status, 421, "non vérifié : jamais servi");
    const html = await page(`/marketing/site-web/sites/${A}/domaines`);
    assert.match(html, /_kolakisa-verify\.client-a\.example/); assert.ok(html.includes(d.verification_token), "instructions DNS avec le vrai jeton");
    await boss.post(`/marketing/site-web/sites/${A}/domaines/${d.id}/verifier`, {});
    assert.match(await page(`/marketing/site-web/sites/${A}/domaines`), /Vérification impossible/);
    assert.equal(one("SELECT status FROM mk_site_domains WHERE id = ?", d.id).status, "pending");
    dns({ txt: { "_kolakisa-verify.client-a.example": [d.verification_token] }, routing: { "client-a.example": { a: ["203.0.113.10"] }, "k.test": { a: ["203.0.113.10"] } }, tls: { "client-a.example": true } });
    await boss.post(`/marketing/site-web/sites/${A}/domaines/${d.id}/verifier`, {});
    const v = one("SELECT * FROM mk_site_domains WHERE id = ?", d.id);
    assert.deepEqual([v.status, v.is_canonical, v.dns_status, v.tls_status], ["verified", 1, "ok", "ok"]);
    const served = await get("client-a.example", "/"); assert.equal(served.status, 200); assert.match(served.text, /TITRE-ACCUEIL-A/);
    const alias = await get("site-a.plat.test", "/offre-a?x=1");
    assert.equal(alias.status, 301); assert.equal(alias.location, "https://client-a.example/offre-a?x=1", "domaine secondaire → principal, chemin et requête conservés");
    assert.match(await page(`/marketing/site-web/sites/${A}/domaines`), /vérifié et opérationnel|Opérationnel/);
  });

  test("scénario H — adresses du site : canonical, plan du site et robots.txt sur le domaine du site ; page d'un autre site introuvable", async () => {
    const p = await get("client-a.example", "/offre-a"); assert.equal(p.status, 200);
    assert.match(p.text, /rel="canonical" href="https:\/\/client-a\.example\/offre-a"/);
    const sm = await get("client-a.example", "/sitemap.xml"); assert.equal(sm.status, 200); assert.match(sm.text, /https:\/\/client-a\.example\//); assert.doesNotMatch(sm.text, /k\.test/);
    assert.match((await get("client-a.example", "/robots.txt")).text, /client-a\.example/);
    assert.equal((await get("client-a.example", "/p/accueil-b")).status, 404);
  });

  test("scénario F — un domaine déjà vérifié par un site est refusé à un autre, sans révéler lequel", async () => {
    await boss.post(`/marketing/site-web/sites/${B}/domaines`, { domaine: "client-a.example" });
    const html = await page(`/marketing/site-web/sites/${B}/domaines`); // le message s'affiche une seule fois après la redirection
    assert.match(html, /déjà utilisé par un autre site/);
    const i = html.indexOf("déjà utilisé par un autre site");
    assert.doesNotMatch(html.slice(Math.max(0, i - 200), i + 400), /Site A|client-a/, "le message ne nomme pas l'autre site");
    assert.equal(one("SELECT COUNT(*) n FROM mk_site_domains WHERE site_id = ? AND host = 'client-a.example'", B).n, 0);
  });

  test("scénario G — isolation : un site ne peut ni lire ni modifier les domaines d'un autre ; ses formulaires ne répondent pas sur le domaine d'un autre site", async () => {
    const dA = one("SELECT id FROM mk_site_domains WHERE host = 'client-a.example'").id;
    for (const action of ["retirer", "principal", "verifier"]) await boss.post(`/marketing/site-web/sites/${B}/domaines/${dA}/${action}`, {});
    assert.equal(one("SELECT status FROM mk_site_domains WHERE id = ?", dA).status, "verified", "le domaine de A est intact");
    assert.equal(one("SELECT COUNT(*) n FROM mk_site_domains WHERE site_id = ? AND host = 'client-a.example'", B).n, 0);
    assert.doesNotMatch(await page(`/marketing/site-web/sites/${B}/domaines`), /client-a\.example<\/th>/, "la liste de B ne montre pas les domaines de A");
    assert.equal((await get("client-a.example", "/f/form-b")).status, 404, "formulaire du site B introuvable sur le domaine du site A");
    db.prepare("INSERT INTO mk_forms (organization_id, name, slug, status, consent_text) VALUES (?, 'Form principal', 'form-principal', 'published', 'ok')").run(org);
    assert.equal((await get("client-a.example", "/f/form-principal")).status, 200, "un formulaire historique du site principal (sans site) reste utilisable depuis une page de site qui l'intègre");
    assert.equal((await get("k.test", "/f/form-b")).status, 200, "toujours disponible depuis le site principal (pages de B sans domaine)");
    const unknown = await boss.post(`/marketing/site-web/sites/999999/domaines`, { domaine: "x.example" });
    assert.ok([302, 404].includes(unknown.status));
    assert.equal(one("SELECT COUNT(*) n FROM mk_site_domains WHERE host = 'x.example'").n, 0);
  });

  test("retrait : le domaine retiré ne sert plus (421) ; l'adresse de plateforme redevient celle du site ; un site archivé ne sert rien", async () => {
    const dA = one("SELECT id FROM mk_site_domains WHERE host = 'client-a.example'").id;
    await boss.post(`/marketing/site-web/sites/${A}/domaines/${dA}/retirer`, {});
    assert.equal((await get("client-a.example", "/")).status, 421);
    assert.equal((await get("site-a.plat.test", "/")).status, 200, "l'adresse de plateforme est promue principale");
    db.prepare("UPDATE mk_sites SET status = 'archived', archived_at = datetime('now') WHERE id = ?").run(A);
    await boss.post(`/marketing/site-web/sites/${B}/domaines`, { domaine: "client-b.example" }); // force le rechargement du cache côté serveur
    const arch = await get("site-a.plat.test", "/"); assert.equal(arch.status, 404, "site archivé : rien n'est servi, ni le site principal");
    assert.doesNotMatch(arch.text, /TITRE-PAGE-PRINCIPALE/);
  });

  test("navigation — la fiche du site et la liste « Mes sites » mènent à l'écran « Domaines »", async () => {
    assert.match(await page("/marketing/site-web/sites"), new RegExp(`/marketing/site-web/sites/${B}/domaines`));
  });

  test("scénario I — sans domaine de plateforme configuré, l'adresse automatique est indisponible et la page le dit ; rien n'est inventé", async () => {
    const r = await boss2.post(`/marketing/site-web/sites/${S2}/domaines/plateforme`, {});
    assert.equal(r.status, 302);
    const html = (await boss2.get(`/marketing/site-web/sites/${S2}/domaines`)).text;
    assert.match(html, /PLATFORM_DOMAIN/); assert.match(html, /adresses automatiques ne sont pas disponibles/);
    assert.equal(countS2(), 0);
  });
});
