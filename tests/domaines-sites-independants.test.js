// Domaines indépendants et publication multisite — audit ciblé (aucune modification du code applicatif).
// Deux sites, deux domaines, un site principal : on vérifie ce qui EXISTE (routage par hôte, 421, isolation) et on documente par des tests
// les ÉCARTS connus (marqués « ÉCART ») — ils décrivent le comportement actuel, à corriger par un lot ultérieur (voir le rapport).
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const http = require("http");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, loginInstructor } = require("./helpers");

function hostReq(srv, host, urlPath, { method = "GET", headers = {} } = {}) {
  const u = new URL(srv.base);
  return new Promise((resolve, reject) => {
    const r = http.request({ host: u.hostname, port: u.port, path: urlPath, method, headers: { Host: host, ...headers } }, (resp) => {
      let text = ""; resp.on("data", (d) => (text += d)); resp.on("end", () => resolve({ status: resp.statusCode, text, location: resp.headers.location, headers: resp.headers }));
    });
    r.on("error", reject); r.end();
  });
}

describe("domaines indépendants : deux sites, deux domaines, un principal", () => {
  let srv, boss, db, org, A, B, C, D;
  const ORIGIN = () => ({ Origin: srv.base });
  const get = (host, p, o) => hostReq(srv, host, p, o);
  const one = (sql, ...a) => db.prepare(sql).get(...a);
  const mkSite = (name, slug) => Number(db.prepare("INSERT INTO mk_sites (organization_id, name, slug, tokens) VALUES (?, ?, ?, '{}')").run(org, name, slug).lastInsertRowid);
  const mkPage = (site, slug, status = "published") => Number(db.prepare("INSERT INTO mk_landing_pages (organization_id, name, slug, title, status, site_id, published_at, kind, indexable) VALUES (?, ?, ?, ?, ?, ?, datetime('now'), 'page', 1)").run(org, slug, slug, `TITRE-${slug.toUpperCase()}`, status, site).lastInsertRowid);
  const setDomain = async (site, url) => {
    const cur = JSON.parse((await boss.get(`/marketing/site-web/sites/${site}/reglages.json`)).text);
    return boss.request(`/marketing/site-web/sites/${site}/reglages.json`, { method: "PUT", json: { settings: { ...cur.settings, seo: { ...cur.settings.seo, publicUrl: url } }, revision: cur.revision }, headers: ORIGIN() });
  };

  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv); db = srv.db(); org = one("SELECT id FROM mk_organizations").id;
    A = mkSite("Site A", "site-a"); B = mkSite("Site B", "site-b"); C = mkSite("Site C", "site-c"); D = mkSite("Site D", "site-d");
    const hA = mkPage(A, "accueil-a"), hB = mkPage(B, "accueil-b"); mkPage(A, "offre-a"); mkPage(B, "offre-b"); mkPage(A, "brouillon-a", "draft"); mkPage(null, "page-principale");
    db.prepare("UPDATE mk_sites SET home_page_id = ? WHERE id = ?").run(hA, A); db.prepare("UPDATE mk_sites SET home_page_id = ? WHERE id = ?").run(hB, B);
    db.prepare("INSERT INTO mk_forms (organization_id, name, slug, status, consent_text, site_id) VALUES (?, 'Form B', 'form-b', 'published', 'ok', ?)").run(org, B);
    assert.equal((await setDomain(A, "https://a.test")).status, 200); assert.equal((await setDomain(B, "https://b.test")).status, 200);
  });
  after(() => { db.close(); return srv.stop(); });

  // ---------- Déjà présent ----------
  test("PRÉSENT — le bon site pour chaque domaine : accueil, pages ; aucune fuite entre A, B et le principal", async () => {
    assert.match((await get("a.test", "/")).text, /TITRE-ACCUEIL-A/); assert.match((await get("b.test", "/")).text, /TITRE-ACCUEIL-B/);
    assert.match((await get("a.test", "/offre-a")).text, /TITRE-OFFRE-A/); assert.match((await get("b.test", "/offre-b")).text, /TITRE-OFFRE-B/);
    for (const [host, p] of [["a.test", "/offre-b"], ["b.test", "/offre-a"], ["a.test", "/p/offre-b"], ["a.test", "/p/page-principale"], ["a.test", "/page-principale"], ["b.test", "/p/accueil-a"]]) {
      const r = await get(host, p); assert.equal(r.status, 404, `${host}${p}`); assert.doesNotMatch(r.text, /TITRE-(OFFRE|ACCUEIL|PAGE)/, `${host}${p} : aucun contenu d'un autre site`);
    }
    const main = await get("k.test", "/p/page-principale"); assert.equal(main.status, 200); assert.match(main.text, /TITRE-PAGE-PRINCIPALE/);
    assert.equal((await get("k.test", "/p/offre-a")).status, 200, "NOTE : une page de site reste lisible par /p/<adresse> sur l'hôte principal (comportement historique, voir rapport)");
  });
  test("PRÉSENT — les pages non publiées restent privées sur tous les hôtes", async () => {
    for (const host of ["a.test", "k.test", "b.test"]) for (const p of ["/brouillon-a", "/p/brouillon-a"]) assert.equal((await get(host, p)).status, 404, `${host}${p}`);
  });
  test("PRÉSENT — domaine inconnu : 421, jamais le site principal ni un site ; contenu du principal (blog, catalogue…) absent des domaines de sites", async () => {
    for (const host of ["inconnu.test", "www.a.test", "a.test.evil.test", "k.test.evil.test"]) { const r = await get(host, "/"); assert.equal(r.status, 421, host); assert.doesNotMatch(r.text, /TITRE-/, host); }
    for (const p of ["/blog", "/catalogue", "/panier"]) assert.equal((await get("a.test", p)).status, 404, p);
  });
  test("PRÉSENT — robots.txt et plan du site d'un domaine ne parlent que de CE site", async () => {
    const sm = await get("a.test", "/sitemap.xml"); assert.equal(sm.status, 200); assert.match(sm.text, /a\.test\/offre-a/); assert.doesNotMatch(sm.text, /b\.test|offre-b|page-principale/);
    const rb = await get("a.test", "/robots.txt"); assert.match(rb.text, /a\.test\/sitemap\.xml/); assert.doesNotMatch(rb.text, /b\.test|k\.test/);
  });
  test("PRÉSENT — un domaine n'appartient qu'à un seul site ; changer de domaine ne déplace aucun contenu et libère l'ancien (421)", async () => {
    const dup = await setDomain(B, "https://a.test"); assert.ok(dup.status >= 400, `doublon refusé (${dup.status})`); assert.match(String(dup.text), /déjà|un seul site/i);
    const pagesBefore = one("SELECT COUNT(*) n FROM mk_landing_pages WHERE site_id = ?", A).n;
    assert.equal((await setDomain(A, "https://a2.test")).status, 200);
    assert.match((await get("a2.test", "/offre-a")).text, /TITRE-OFFRE-A/); assert.equal((await get("a.test", "/")).status, 421, "ancien domaine libéré");
    assert.equal(one("SELECT COUNT(*) n FROM mk_landing_pages WHERE site_id = ?", A).n, pagesBefore, "aucun contenu déplacé");
    assert.equal((await setDomain(A, "https://a.test")).status, 200);
  });
  test("PRÉSENT — un site archivé ne sert rien (404) et son domaine ne retombe pas sur le principal", async () => {
    assert.equal((await setDomain(C, "https://c.test")).status, 200); assert.equal((await get("c.test", "/")).status, 404, "site sans accueil : 404, pas le principal");
    const arch = await boss.post(`/marketing/site-web/sites/${C}/archiver`, {}, { headers: ORIGIN() }); assert.ok(arch.status < 400);
    await new Promise((r) => setTimeout(r, 300));
    const r = await get("c.test", "/"); assert.ok([404, 421].includes(r.status), `domaine d'un site archivé : ${r.status}`); assert.doesNotMatch(r.text, /TITRE-/);
  });

  // ---------- Écarts ----------
  test("ÉCART 1 — aucune vérification de propriété : n'importe quelle adresse https est active dès l'enregistrement (aucun état, aucun contrôle DNS)", async () => {
    const r = await setDomain(D, "https://domaine-sans-dns.example"); assert.equal(r.status, 200, "accepté sans vérification");
    const row = JSON.parse(one("SELECT settings FROM mk_sites WHERE id = ?", D).settings);
    assert.deepEqual(Object.keys(row.seo).filter((k) => /dns|verif|status|etat|https|ssl/i.test(k)), [], "aucun champ d'état de domaine");
    assert.equal((await get("domaine-sans-dns.example", "/")).status === 421, false, "servi tout de suite (la plateforme ne contrôle ni le DNS ni la propriété)");
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type = 'table'").all().map((t) => t.name).filter((n) => /domain|host/i.test(n));
    console.log("   tables liées aux domaines :", tables.join(", "));
  });
  test("ÉCART 2 — un seul domaine par site (pas de domaine principal désigné, pas de variantes www, pas de sous-domaine provisoire propre au site)", async () => {
    assert.equal((await get("www.a.test", "/")).status, 421, "www.<domaine du site> n'est ni redirigé ni servi");
    const cols = db.prepare("PRAGMA table_info(mk_sites)").all().map((c) => c.name);
    assert.deepEqual(cols.filter((c) => /domain|host|subdomain/i.test(c)), [], "aucune colonne de domaine dans mk_sites (le domaine vit dans settings.seo.publicUrl)");
  });
  test("ÉCART 3 — un site peut déclarer l'hôte de la plateforme ou un hôte local comme « domaine » sans erreur ; il n'est jamais servi (le principal prime) mais l'enregistrement est silencieux", async () => {
    for (const url of ["https://k.test", "https://localhost"]) {
      const r = await setDomain(D, url); console.log("   sonde domaine réservé", url, "→", r.status);
      assert.equal((await get("k.test", "/")).status, 200, "le site principal n'est pas détourné");
    }
    await setDomain(D, "");
  });
  test("ÉCART 4 — formulaires et inscriptions : l'hôte n'est pas contrôlé (le formulaire du site B répond sur le domaine du site A)", async () => {
    const onA = await get("a.test", "/f/form-b"); const onB = await get("b.test", "/f/form-b");
    console.log("   /f/form-b sur a.test →", onA.status, "; sur b.test →", onB.status);
    assert.equal(onB.status, 200); assert.equal(onA.status, 200, "ÉCART : servi aussi sur le domaine d'un autre site");
  });
  test("SÉPARATION — l'administration n'est pas servie comme vitrine d'un site : sur un domaine de site, /marketing exige la connexion (aucune session partagée entre hôtes)", async () => {
    const r = await get("a.test", "/marketing"); console.log("   /marketing sur a.test →", r.status, r.location || "");
    assert.ok([301, 302, 401, 403, 404].includes(r.status)); assert.doesNotMatch(r.text, /Tableau de bord|Mes sites/);
    const login = await get("a.test", "/connexion"); console.log("   /connexion sur a.test →", login.status);
  });
});
