// SEO d'un site — les neuf rubriques (vue générale, analyse, meta, indexation, sitemap, schema, Open Graph, robots, 404) :
// HTTP réel, vrais hôtes de site, droits réels, ET isolation : ce que fait un site n'est jamais lu, affiché ni modifié depuis un autre.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const http = require("http");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, Client, loginInstructor, newStudent } = require("./helpers");
const access = require("../src/services/cmsAccess");

function hostGet(srv, host, urlPath) {
  const u = new URL(srv.base);
  return new Promise((resolve, reject) => {
    const r = http.request({ host: u.hostname, port: u.port, path: urlPath, method: "GET", headers: { Host: host } }, (resp) => {
      let text = ""; resp.on("data", (d) => (text += d)); resp.on("end", () => resolve({ status: resp.statusCode, text, location: resp.headers.location, headers: resp.headers }));
    });
    r.on("error", reject); r.end();
  });
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

describe("SEO d'un site : neuf rubriques et isolation", () => {
  let srv, boss, db, A, B, adminA, viewerA, adminB, outsider, anon, orgId;
  const one = (sql, ...a) => db.prepare(sql).get(...a);
  const SP = "/marketing/site-web/sites";
  const can = (role, perm) => access.permissionsOf(role).has(perm);
  const idOf = (c) => one("SELECT id FROM users WHERE email = ?", c.email).id;
  const mkSite = async (name) => Number(String((await boss.post(SP, { name })).location).match(/sites\/(\d+)/)[1]);
  const member = async (site, role) => { const c = await newStudent(srv); db.prepare("INSERT INTO mk_site_members (site_id, user_id, role) VALUES (?, ?, ?)").run(site, idOf(c), role); return c; };
  const addPage = (site, slug, title, { indexable = 1, seo = "{}", description = "" } = {}) => Number(db.prepare("INSERT INTO mk_landing_pages (organization_id, name, slug, title, description, status, site_id, published_at, indexable, seo) VALUES (?, ?, ?, ?, ?, 'published', ?, datetime('now'), ?, ?)").run(orgId, title, slug, title, description, site, indexable, seo).lastInsertRowid);
  const own = (site, key) => { const r = one("SELECT value FROM seo_site_settings WHERE site_id = ? AND key = ?", site, key); return r ? JSON.parse(r.value) : undefined; };
  const revisionOf = (site) => one("SELECT settings_revision r FROM mk_sites WHERE id = ?", site).r;
  const siteSettings = (site) => JSON.parse(one("SELECT settings FROM mk_sites WHERE id = ?", site).settings || "{}");

  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "", ALLOW_INDEXING: "1" });
    boss = await loginInstructor(srv); db = srv.db(); anon = new Client(srv.base);
    A = await mkSite("Alpha Outils"); B = await mkSite("Bravo Outils");
    orgId = one("SELECT id FROM mk_organizations").id;
    for (const [site, slug, url] of [[A, "accueil-a", "https://un.test"], [B, "accueil-b", "https://deux.test"]]) {
      const p = addPage(site, slug, slug.toUpperCase());
      db.prepare("UPDATE mk_sites SET home_page_id = ? WHERE id = ?").run(p, site);
      const cur = JSON.parse((await boss.get(`${SP}/${site}/reglages.json`)).text);
      const r = await boss.request(`${SP}/${site}/reglages.json`, { method: "PUT", json: { settings: { ...cur.settings, seo: { ...cur.settings.seo, publicUrl: url } }, revision: cur.revision }, headers: { Origin: srv.base } });
      assert.equal(r.status, 200);
    }
    addPage(A, "tarifs-a", "TARIFS-ALPHA-UNIQUE", { description: "Les tarifs de la boutique Alpha, détaillés pour tous les clients du site." });
    addPage(A, "cachee-a", "CACHEE-ALPHA", { indexable: 0 });
    addPage(B, "seul-b", "SEUL-BRAVO-UNIQUE", { description: "Page propre au site Bravo uniquement." });
    adminA = await member(A, "admin"); viewerA = await member(A, "viewer"); adminB = await member(B, "admin"); outsider = await newStudent(srv);
  });
  after(() => { db.close(); return srv.stop(); });

  test("menu : les neuf rubriques sont ouvertes (plus de « Bientôt ») et répondent 200 à l'administrateur du site", async () => {
    const page = await adminA.get(`${SP}/${A}/seo`); assert.equal(page.status, 200);
    for (const p of ["analyse", "meta", "indexation", "sitemap", "schema", "open-graph", "robots", "404"]) {
      assert.match(page.text, new RegExp(`href="${SP}/${A}/seo/${p}"`), `entrée ${p} dans le menu`);
      const r = await adminA.get(`${SP}/${A}/seo/${p}`); assert.equal(r.status, 200, p);
      assert.doesNotMatch(r.text, /SEO[^<]{0,40}Bientôt|Prochain palier/, `${p} n'est plus annoncé « Bientôt »`);
    }
  });

  test("permissions : autre site, sans accès et anonyme refusés ; le lecteur lit mais n'écrit pas", async () => {
    for (const p of ["", "/analyse", "/meta", "/indexation", "/sitemap", "/schema", "/open-graph", "/robots", "/404"]) {
      assert.equal((await adminB.get(`${SP}/${A}/seo${p}`)).status, 403, `autre site ${p}`);
      assert.equal((await outsider.get(`${SP}/${A}/seo${p}`)).status, 403, `sans accès ${p}`);
      const a = await anon.get(`${SP}/${A}/seo${p}`); assert.equal(a.status, 302, `anonyme ${p}`); assert.match(a.location, /connexion/);
      assert.equal((await viewerA.get(`${SP}/${A}/seo${p}`)).status, can("viewer", "seo.view") ? 200 : 403, `lecteur ${p}`);
    }
    const writes = [["/meta", { site_name: "X" }], ["/schema", { org_name: "X" }], ["/open-graph", { og_locale: "en_US" }], ["/indexation", { noindex: "1", confirm: "1", revision: String(revisionOf(A)) }], ["/robots", { robots_custom: "User-agent: X\nDisallow: /x" }], ["/sitemap/regenerer", {}], ["/analyse", {}], ["/404/purger", {}]];
    for (const [p, body] of writes) {
      assert.equal((await viewerA.post(`${SP}/${A}/seo${p}`, body)).status, 403, `lecteur ne peut pas écrire ${p}`);
      assert.equal((await adminB.post(`${SP}/${A}/seo${p}`, body)).status, 403, `autre site ne peut pas écrire ${p}`);
      assert.equal((await outsider.post(`${SP}/${A}/seo${p}`, body)).status, 403, `sans accès ${p}`);
    }
    assert.equal(own(A, "site_name"), undefined, "aucun refus n'a écrit quoi que ce soit");
    assert.equal(revisionOf(A) > 0, true);
    assert.equal(JSON.stringify(siteSettings(A).extras.noindex), "false", "le site n'a pas été fermé");
  });

  test("vue générale : chiffres du site seulement, état initial clair, aucune note inventée avant analyse", async () => {
    const o = (await adminA.get(`${SP}/${A}/seo`)).text;
    assert.match(o, /Aucune analyse n'a encore été lancée/); assert.doesNotMatch(o, /\/ 100/, "aucune note avant la première analyse");
    assert.match(o, /Pages en ligne<\/span><span class="mk-stat-value">3</, "3 pages en ligne pour Alpha");
    assert.doesNotMatch(o, /SEUL-BRAVO|Bravo/, "rien de l'autre site");
    const ob = (await adminB.get(`${SP}/${B}/seo`)).text;
    assert.match(ob, /Pages en ligne<\/span><span class="mk-stat-value">2</, "2 pages en ligne pour Bravo"); assert.doesNotMatch(ob, /TARIFS-ALPHA|CACHEE-ALPHA/);
  });

  test("meta : modèles enregistrés pour le site seulement, titres publiés par page, valeurs héritées/personnalisées, aucune fuite", async () => {
    const before = JSON.stringify(db.prepare("SELECT key, value FROM seo_settings ORDER BY key").all());
    const r = await adminA.post(`${SP}/${A}/seo/meta`, { site_name: "Alpha Boutique", title_separator: " | ", default_description: "Description par défaut Alpha", site_id: String(B) });
    assert.equal(r.status, 302);
    assert.equal(own(A, "site_name"), "Alpha Boutique"); assert.equal(own(A, "title_separator"), " | ");
    assert.equal(db.prepare("SELECT COUNT(*) n FROM seo_site_settings WHERE site_id = ?").get(B).n, 0, "rien pour l'autre site");
    assert.equal(JSON.stringify(db.prepare("SELECT key, value FROM seo_settings ORDER BY key").all()), before, "réglages globaux inchangés");
    const m = (await adminA.get(`${SP}/${A}/seo/meta`)).text;
    assert.match(m, /TARIFS-ALPHA-UNIQUE \| Alpha Boutique/, "titre publié = modèle du site");
    assert.match(m, /hérité du modèle/); assert.match(m, /reprise du contenu|valeur du site/);
    assert.doesNotMatch(m, /SEUL-BRAVO|Bravo/);
    const bad = await adminA.post(`${SP}/${A}/seo/meta`, { title_template: "{inconnu}", site_name: "Pas enregistré" });
    assert.equal(bad.status, 302); assert.equal(own(A, "site_name"), "Alpha Boutique", "lot invalide = rien d'enregistré");
    // le HTML réellement publié sur le domaine reprend ces valeurs
    const home = await hostGet(srv, "un.test", "/tarifs-a"); assert.equal(home.status, 200);
    assert.match(home.text, /<title>TARIFS-ALPHA-UNIQUE \| Alpha Boutique<\/title>/);
    assert.doesNotMatch((await hostGet(srv, "deux.test", "/")).text, /Alpha Boutique/);
    // le grand tableau des clés propres au site : clés globales refusées
    await adminA.post(`${SP}/${A}/seo/meta`, { publish_guard: "block_critical", index_authors: "1" });
    assert.equal(db.prepare("SELECT COUNT(*) n FROM seo_site_settings WHERE key IN ('publish_guard', 'index_authors')").get().n, 0);
  });

  test("indexation : fermer tout le site demande une confirmation explicite, ne touche que ce site, est journalisé et se voit dans le HTML publié", async () => {
    const rev = revisionOf(A);
    const noConfirm = await adminA.post(`${SP}/${A}/seo/indexation`, { noindex: "1", follow: "1", revision: String(rev) });
    assert.equal(noConfirm.status, 302); assert.equal(siteSettings(A).extras.noindex, false, "sans confirmation : rien ne change");
    const stale = await adminA.post(`${SP}/${A}/seo/indexation`, { noindex: "1", confirm: "1", follow: "1", revision: String(rev - 1) });
    assert.equal(stale.status, 302); assert.equal(siteSettings(A).extras.noindex, false, "révision périmée : refusé");
    const ok = await adminA.post(`${SP}/${A}/seo/indexation`, { noindex: "1", confirm: "1", follow: "1", revision: String(rev), site_id: String(B) });
    assert.equal(ok.status, 302);
    assert.equal(siteSettings(A).extras.noindex, true, "Alpha fermé"); assert.equal(siteSettings(B).extras.noindex, false, "Bravo intact");
    assert.ok(one("SELECT COUNT(*) n FROM seo_changes WHERE site_id = ? AND field = 'site_noindex'", A).n >= 1, "journal avec le site");
    const ix = (await adminA.get(`${SP}/${A}/seo/indexation`)).text;
    assert.match(ix, /Non indexée/); assert.match(ix, /le site entier est réglé en noindex/);
    const pub = await hostGet(srv, "un.test", "/"); assert.match(pub.text, /name="robots" content="noindex, nofollow"/);
    assert.doesNotMatch((await hostGet(srv, "deux.test", "/")).text, /name="robots" content="noindex/, "l'autre site reste indexable");
    // le plan du site de A est maintenant vide ; celui de B garde ses pages
    const sa = await hostGet(srv, "un.test", "/sitemap.xml"); assert.doesNotMatch(sa.text, /<loc>/);
    const sb = await hostGet(srv, "deux.test", "/sitemap.xml"); assert.match(sb.text, /<loc>https:\/\/deux\.test/);
    // réouverture : pas de confirmation nécessaire
    const reopen = await adminA.post(`${SP}/${A}/seo/indexation`, { follow: "1", revision: String(revisionOf(A)) });
    assert.equal(reopen.status, 302); assert.equal(siteSettings(A).extras.noindex, false);
  });

  test("sitemap : XML valide propre au site, adresses canoniques de son domaine, exclusions motivées, régénération datée, rien d'un autre site", async () => {
    const v = (await adminA.get(`${SP}/${A}/seo/sitemap`)).text;
    assert.match(v, /https:\/\/un\.test\/sitemap\.xml/); assert.match(v, /Valide/);
    assert.match(v, /\/tarifs-a/); assert.doesNotMatch(v, /seul-b|deux\.test/);
    assert.match(v, /Page non indexée/, "la page cachée est exclue avec sa raison");
    const xml = (await adminA.get(`${SP}/${A}/seo/sitemap/apercu.xml`)).text;
    assert.match(xml, /^<\?xml/); assert.match(xml, /<loc>https:\/\/un\.test\/tarifs-a<\/loc>/); assert.doesNotMatch(xml, /deux\.test|cachee-a|<priority>|<changefreq>/);
    const served = (await hostGet(srv, "un.test", "/sitemap.xml")).text; assert.match(served, /<loc>https:\/\/un\.test\/tarifs-a<\/loc>/);
    assert.equal(one("SELECT COUNT(*) n FROM seo_site_sitemaps").n, 0, "aucune génération enregistrée avant la demande");
    assert.equal((await adminA.post(`${SP}/${A}/seo/sitemap/regenerer`, {})).status, 302);
    const row = one("SELECT * FROM seo_site_sitemaps WHERE site_id = ?", A); assert.ok(row && row.valid === 1 && row.urls >= 2);
    assert.equal(one("SELECT COUNT(*) n FROM seo_site_sitemaps WHERE site_id = ?", B).n, 0, "rien pour l'autre site");
    assert.match((await adminA.get(`${SP}/${A}/seo/sitemap`)).text, /Dernière génération/);
    const sm = require("../src/seo/sitemap");
    assert.equal(sm.validateXml("<urlset xmlns=\"x\"><url><loc>/relatif</loc></url></urlset>").valid, false, "adresse relative refusée");
    assert.equal(sm.validateXml("<urlset><url><loc>https://a.test/x</loc></url><url><loc>https://a.test/x</loc></url></urlset>").valid, false, "doublon refusé");
    assert.equal(sm.validateXml("<autre/>").valid, false);
    assert.equal(sm.validateXml("<urlset><url><loc>https://a.test/x</loc><lastmod>2026-10-01</lastmod></url></urlset>").valid, true);
  });

  test("schema : JSON-LD réel du site (jamais celui du principal), validation, aucune donnée inventée", async () => {
    await adminA.post(`${SP}/${A}/seo/schema`, { org_name: "Alpha SA", org_type: "Organization", org_description: "Boutique Alpha", social_profiles: "https://www.facebook.com/alpha-officiel" });
    assert.equal(own(A, "org_name"), "Alpha SA"); assert.equal(db.prepare("SELECT COUNT(*) n FROM seo_site_settings WHERE site_id = ?").get(B).n, 0);
    const bad = await adminA.post(`${SP}/${A}/seo/schema`, { social_profiles: "http://pas-https.test" }); assert.equal(bad.status, 302);
    assert.deepEqual(own(A, "social_profiles"), ["https://www.facebook.com/alpha-officiel"], "adresse non https refusée");
    const id = one("SELECT id FROM mk_landing_pages WHERE slug = 'tarifs-a'").id;
    const s = (await adminA.get(`${SP}/${A}/seo/schema?page=${id}`)).text;
    assert.match(s, /&#34;@type&#34;: &#34;Organization&#34;|"@type": "Organization"/); assert.match(s, /Alpha SA/);
    assert.match(s, /WebPage/); assert.doesNotMatch(s, /aggregateRating|reviewRating|"price"|priceCurrency/, "aucun avis ni prix inventé");
    assert.doesNotMatch(s, /SEUL-BRAVO|Bravo/);
    assert.match(s, /propriété recommandée « logo »/, "propriété recommandée manquante signalée sans l'inventer");
    const home = (await hostGet(srv, "un.test", "/tarifs-a")).text;
    const ld = [...home.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((m) => JSON.parse(m[1]));
    assert.ok(ld.length >= 1, "JSON-LD publié dans le HTML"); const nodes = ld.flatMap((g) => g["@graph"] || [g]);
    assert.equal(nodes.filter((n) => n["@type"] === "Organization").length, 1, "une seule Organisation (pas de doublon)");
    assert.equal(nodes.find((n) => n["@type"] === "Organization").name, "Alpha SA");
    const sg = require("../src/seo/schema");
    assert.ok(sg.validate([{ "@context": "https://schema.org", "@graph": [{ "@type": "Organization", "name": "X" }] }]).some((p) => /url/.test(p.message)), "propriété obligatoire manquante détectée");
  });

  test("Open Graph : image prise dans la médiathèque DU site, jamais celle d'un autre ; balises publiées une seule fois", async () => {
    db.prepare("INSERT INTO mk_media (organization_id, kind, path, name, mime, size, width, height, reach, site_id) VALUES (?, 'image', ?, ?, 'image/png', 100, 1200, 630, 'site', ?)").run(orgId, "/uploads/marketing/1/site-9999/a.png", "image-alpha", A);
    db.prepare("INSERT INTO mk_media (organization_id, kind, path, name, mime, size, width, height, reach, site_id) VALUES (?, 'image', ?, ?, 'image/png', 100, 1200, 630, 'site', ?)").run(orgId, "/uploads/marketing/1/site-9998/b.png", "image-bravo", B);
    const form = (await adminA.get(`${SP}/${A}/seo/open-graph`)).text;
    assert.match(form, /image-alpha/); assert.doesNotMatch(form, /image-bravo/, "médiathèque d'un autre site invisible");
    const rev = revisionOf(A);
    const steal = await adminA.post(`${SP}/${A}/seo/open-graph`, { og_locale: "fr_FR", og_image: "/uploads/marketing/1/site-9998/b.png", revision: String(rev) });
    assert.equal(steal.status, 302); assert.equal(siteSettings(A).seo.ogImage || "", "", "image d'un autre site refusée");
    const ok = await adminA.post(`${SP}/${A}/seo/open-graph`, { og_locale: "fr_CA", og_image: "/uploads/marketing/1/site-9999/a.png", revision: String(rev) });
    assert.equal(ok.status, 302); assert.equal(own(A, "og_locale"), "fr_CA"); assert.equal(siteSettings(A).seo.ogImage, "/uploads/marketing/1/site-9999/a.png");
    assert.equal(siteSettings(B).seo.ogImage || "", "", "Bravo intact");
    const og = (await adminA.get(`${SP}/${A}/seo/open-graph`)).text;
    assert.match(og, /TARIFS-ALPHA-UNIQUE/); assert.match(og, /Aucune image|Image :/); assert.doesNotMatch(og, /SEUL-BRAVO/);
    const html = (await hostGet(srv, "un.test", "/tarifs-a")).text;
    for (const tag of ["og:title", "og:description", "og:url", "og:site_name", "og:locale"]) assert.equal(html.split(`property="${tag}"`).length - 1, 1, `${tag} une seule fois`);
    assert.match(html, /property="og:locale" content="fr_CA"/);
  });

  test("robots : aperçu et validation avant publication, confirmation si blocage large, fichier réellement servi par domaine, historique et retour arrière, isolation", async () => {
    const pv = JSON.parse((await adminA.post(`${SP}/${A}/seo/robots/apercu`, { robots_custom: "User-agent: *\nDisallow: /prive-a" })).text);
    assert.equal(pv.valid, true); assert.match(pv.preview, /Disallow: \/prive-a/); assert.match(pv.preview, /Sitemap: https:\/\/un\.test\/sitemap\.xml/); assert.equal(pv.needsConfirm, false);
    const bad = JSON.parse((await adminA.post(`${SP}/${A}/seo/robots/apercu`, { robots_custom: "Nimporte quoi" })).text); assert.equal(bad.valid, false);
    const wide = JSON.parse((await adminA.post(`${SP}/${A}/seo/robots/apercu`, { robots_custom: "User-agent: *\nDisallow: /" })).text); assert.equal(wide.needsConfirm, true);
    const css = JSON.parse((await adminA.post(`${SP}/${A}/seo/robots/apercu`, { robots_custom: "User-agent: *\nDisallow: /uploads/" })).text); assert.ok(css.warnings.some((w) => /nécessaires à l'affichage/.test(w.message)), "ressources de rendu");
    // publication
    await adminA.post(`${SP}/${A}/seo/robots`, { robots_custom: "User-agent: *\nDisallow: /prive-a" });
    assert.equal(own(A, "robots_custom"), "User-agent: *\nDisallow: /prive-a");
    assert.match((await hostGet(srv, "un.test", "/robots.txt")).text, /Disallow: \/prive-a/, "servi sur le domaine du site");
    assert.doesNotMatch((await hostGet(srv, "deux.test", "/robots.txt")).text, /prive-a/, "pas sur l'autre domaine");
    assert.doesNotMatch((await hostGet(srv, "k.test", "/robots.txt")).text, /prive-a/, "pas sur le domaine principal");
    // blocage total : refusé sans confirmation, accepté avec
    await adminA.post(`${SP}/${A}/seo/robots`, { robots_custom: "User-agent: *\nDisallow: /" });
    assert.equal(own(A, "robots_custom"), "User-agent: *\nDisallow: /prive-a", "sans confirmation : l'ancien contenu est conservé");
    await adminA.post(`${SP}/${A}/seo/robots`, { robots_custom: "User-agent: *\nDisallow: /", confirm: "1" });
    assert.equal(own(A, "robots_custom"), "User-agent: *\nDisallow: /");
    // retour arrière
    const hist = one("SELECT id FROM seo_changes WHERE site_id = ? AND field = 'robots_custom' ORDER BY id DESC LIMIT 1", A);
    assert.equal((await adminA.post(`${SP}/${A}/seo/robots/restaurer`, { change: String(hist.id) })).status, 302);
    assert.equal(own(A, "robots_custom"), "User-agent: *\nDisallow: /prive-a", "version précédente rétablie");
    // une version d'un autre site ne se restaure pas
    await adminB.post(`${SP}/${B}/seo/robots`, { robots_custom: "User-agent: *\nDisallow: /prive-b" });
    const hb = one("SELECT id FROM seo_changes WHERE site_id = ? AND field = 'robots_custom' ORDER BY id DESC LIMIT 1", B);
    await adminA.post(`${SP}/${A}/seo/robots/restaurer`, { change: String(hb.id) });
    assert.equal(own(A, "robots_custom"), "User-agent: *\nDisallow: /prive-a", "journal d'un autre site refusé");
    assert.equal(own(B, "robots_custom"), "User-agent: *\nDisallow: /prive-b");
    const page = (await adminA.get(`${SP}/${A}/seo/robots`)).text;
    assert.match(page, /n'est pas un moyen de rendre une page privée/); assert.doesNotMatch(page, /prive-b/);
  });

  test("404 : journal du site, redirection avec destination vérifiée, états, reprise, rétention ; aucune action sur les erreurs d'un autre site", async () => {
    await hostGet(srv, "un.test", "/ancienne-page-a"); await hostGet(srv, "un.test", "/ancienne-page-a"); await hostGet(srv, "deux.test", "/ancienne-page-b");
    const list = (await adminA.get(`${SP}/${A}/seo/404`)).text;
    assert.match(list, /ancienne-page-a/); assert.doesNotMatch(list, /ancienne-page-b/);
    // destination inexistante refusée
    await adminA.post(`${SP}/${A}/seo/404/rediriger`, { path: "/ancienne-page-a", target: "/n-existe-pas-du-tout", status: "301" });
    assert.equal(db.prepare("SELECT COUNT(*) n FROM seo_redirects WHERE site_id = ?").get(A).n, 0, "destination en 404 refusée");
    // destination qui boucle sur la source : refusée
    await adminA.post(`${SP}/${A}/seo/404/rediriger`, { path: "/ancienne-page-a", target: "/ancienne-page-a", status: "301" });
    assert.equal(db.prepare("SELECT COUNT(*) n FROM seo_redirects WHERE site_id = ?").get(A).n, 0);
    // destination réelle : acceptée, marquée traitée
    await adminA.post(`${SP}/${A}/seo/404/rediriger`, { path: "/ancienne-page-a", target: "/tarifs-a", status: "301" });
    assert.equal(db.prepare("SELECT target FROM seo_redirects WHERE site_id = ? AND source_path = '/ancienne-page-a'").get(A).target, "/tarifs-a");
    assert.ok(one("SELECT handled_at FROM seo_404 WHERE site_id = ? AND path = '/ancienne-page-a'", A).handled_at, "marquée traitée");
    assert.equal((await hostGet(srv, "un.test", "/ancienne-page-a")).status, 301);
    assert.equal((await hostGet(srv, "deux.test", "/ancienne-page-a")).status, 404, "la redirection n'existe pas sur l'autre domaine");
    // l'autre site ne peut pas agir sur l'adresse d'Alpha, ni en passant par son URL ni par la sienne
    await adminB.post(`${SP}/${B}/seo/404/action`, { path: "/ancienne-page-a", action: "supprimer" });
    assert.equal(one("SELECT COUNT(*) n FROM seo_404 WHERE site_id = ? AND path = '/ancienne-page-a'", A).n, 1, "ligne d'Alpha intacte");
    await adminB.post(`${SP}/${B}/seo/404/action`, { path: "/ancienne-page-b", action: "ignorer" });
    assert.equal(one("SELECT ignored FROM seo_404 WHERE site_id = ? AND path = '/ancienne-page-b'", B).ignored, 1, "Bravo peut agir sur ses propres adresses");
    assert.equal(one("SELECT ignored FROM seo_404 WHERE site_id = ? AND path = '/ancienne-page-a'", A).ignored, 0);
    // redirection externe sans permission dédiée : l'administrateur du site l'a ; l'adresse n'est pas appelée (aucun appel sortant)
    // états : rouvrir, vérifier la reprise
    await hostGet(srv, "un.test", "/revenue-plus-tard");
    await adminA.post(`${SP}/${A}/seo/404/action`, { path: "/revenue-plus-tard", action: "traitee" });
    assert.match((await adminA.get(`${SP}/${A}/seo/404?etat=handled`)).text, /revenue-plus-tard/);
    assert.doesNotMatch((await adminA.get(`${SP}/${A}/seo/404?etat=open`)).text, /revenue-plus-tard/, "traitée : sortie de la liste à traiter");
    addPage(A, "revenue-plus-tard", "REVENUE", {}); // la page existe maintenant
    await adminA.post(`${SP}/${A}/seo/404/verifier`, { path: ["/revenue-plus-tard"] });
    const rec = one("SELECT recovered_at, last_check_status, hits_human, hits_bot FROM seo_404 WHERE site_id = ? AND path = '/revenue-plus-tard'", A);
    assert.ok(rec.recovered_at, "reprise constatée"); assert.equal(rec.last_check_status, 200); assert.ok(rec.hits_human + rec.hits_bot >= 1, "l'historique des visites est conservé");
    assert.match((await adminA.get(`${SP}/${A}/seo/404?etat=recovered`)).text, /revenue-plus-tard/);
    // une adresse d'un autre site n'est jamais sondée
    await adminA.post(`${SP}/${A}/seo/404/verifier`, { path: ["/ancienne-page-b"] });
    assert.equal(one("SELECT last_checked_at FROM seo_404 WHERE site_id = ? AND path = '/ancienne-page-b'", B).last_checked_at, null);
    // rétention : purge des anciennes adresses traitées, jamais celles à traiter
    db.prepare("UPDATE seo_404 SET last_seen = datetime('now', '-400 days') WHERE site_id = ? AND path = '/revenue-plus-tard'").run(A);
    await hostGet(srv, "un.test", "/encore-a-traiter"); db.prepare("UPDATE seo_404 SET last_seen = datetime('now', '-400 days') WHERE site_id = ? AND path = '/encore-a-traiter'").run(A);
    await adminA.post(`${SP}/${A}/seo/404/purger`, { days: "180" });
    assert.equal(one("SELECT COUNT(*) n FROM seo_404 WHERE site_id = ? AND path = '/revenue-plus-tard'", A).n, 0, "ancienne adresse traitée purgée");
    assert.equal(one("SELECT COUNT(*) n FROM seo_404 WHERE site_id = ? AND path = '/encore-a-traiter'", A).n, 1, "adresse à traiter conservée");
    assert.equal(one("SELECT COUNT(*) n FROM seo_404 WHERE site_id = ?", B).n >= 1, true, "journal de Bravo non touché par la purge d'Alpha");
  });

  test("analyse : progression réelle, résultats limités aux pages du site, historique et comparaison, lecture refusée entre sites, analyses centrales séparées", async () => {
    const first = (await adminA.get(`${SP}/${A}/seo/analyse`)).text;
    assert.match(first, /Aucune analyse pour ce site|Lancer l'analyse/);
    const start = await adminA.post(`${SP}/${A}/seo/analyse`, {}); assert.equal(start.status, 302);
    const id = Number(String(start.location).match(/analyse=(\d+)/)[1]);
    assert.equal(one("SELECT site_id FROM seo_audits WHERE id = ?", id).site_id, A, "rattachée au site de l'adresse");
    let st; for (let i = 0; i < 90; i++) { st = JSON.parse((await adminA.get(`${SP}/${A}/seo/analyse/etat?id=${id}`)).text); if (st.status !== "running") break; await sleep(1000); }
    assert.equal(st.status, "done", st.error || "l'analyse doit se terminer"); assert.ok(st.pages >= 3, "pages réellement lues");
    const res = (await adminA.get(`${SP}/${A}/seo/analyse?analyse=${id}`)).text;
    assert.match(res, /Résultats du/); assert.match(res, /Pages lues/);
    const issues = db.prepare("SELECT DISTINCT path FROM seo_issues WHERE audit_id = ?").all(id).map((r) => r.path);
    for (const p of issues) assert.doesNotMatch(p, /seul-b/, "aucun constat sur une page d'un autre site");
    assert.doesNotMatch(res, /seul-b|SEUL-BRAVO/);
    // lecture entre sites
    assert.equal((await adminB.get(`${SP}/${B}/seo/analyse/etat?id=${id}`)).status, 404, "l'analyse d'Alpha est illisible depuis Bravo");
    const viaB = (await adminB.get(`${SP}/${B}/seo/analyse?analyse=${id}`)).text; assert.doesNotMatch(viaB, /Résultats du/, "pas de résultats d'Alpha chez Bravo");
    assert.equal((await adminB.get(`${SP}/${A}/seo/analyse/etat?id=${id}`)).status, 403);
    // relance inutile évitée
    const again = await adminA.post(`${SP}/${A}/seo/analyse`, {}); assert.match(String(again.location), new RegExp(`analyse=${id}$`), "même analyse réutilisée : rien n'a changé");
    assert.equal(one("SELECT COUNT(*) n FROM seo_audits WHERE site_id = ?", A).n, 1);
    // les analyses des sites ne polluent pas la liste centrale
    const audit = require("../src/seo/audit");
    const central = (await boss.get("/formateur/seo/audit")).text; assert.doesNotMatch(central, new RegExp(`audit-${id}\\b`));
    assert.ok(typeof audit.list === "function");
    // forcer + comparaison
    const forced = await adminA.post(`${SP}/${A}/seo/analyse`, { force: "1" }); const id2 = Number(String(forced.location).match(/analyse=(\d+)/)[1]); assert.notEqual(id2, id);
    for (let i = 0; i < 90; i++) { st = JSON.parse((await adminA.get(`${SP}/${A}/seo/analyse/etat?id=${id2}`)).text); if (st.status !== "running") break; await sleep(1000); }
    assert.equal(st.status, "done");
    assert.match((await adminA.get(`${SP}/${A}/seo/analyse?analyse=${id2}`)).text, /Par rapport à l'analyse du/);
  });

  test("robustesse : contenu hostile échappé, analyse interrompue reprise proprement, saisies démesurées bornées", async () => {
    addPage(A, "xss-a", "<script>window.__pwned=1</script>XSS");
    for (const p of ["/meta", "/indexation", "/schema", "/open-graph"]) {
      const t = (await adminA.get(`${SP}/${A}/seo${p}`)).text;
      assert.doesNotMatch(t, /<script>window\.__pwned/, `titre hostile échappé (${p})`);
    }
    // analyse « en cours » depuis des heures (serveur redémarré) : marquée échouée, relançable
    db.prepare("INSERT INTO seo_audits (kind, status, site_id, started_at, source) VALUES ('full', 'running', ?, datetime('now', '-3 hours'), 'site')").run(A);
    const stale = one("SELECT id FROM seo_audits WHERE site_id = ? AND status = 'running'", A).id;
    const t = (await adminA.get(`${SP}/${A}/seo/analyse`)).text;
    assert.equal(one("SELECT status FROM seo_audits WHERE id = ?", stale).status, "failed", "analyse abandonnée marquée échouée");
    assert.doesNotMatch(t, /data-poll-url/, "plus de suivi sur une analyse morte");
    // saisies démesurées
    const huge = "User-agent: *\n" + "Disallow: /x\n".repeat(5000);
    const pv = JSON.parse((await adminA.post(`${SP}/${A}/seo/robots/apercu`, { robots_custom: huge })).text); assert.equal(pv.valid, false, "texte trop long refusé");
    await adminA.post(`${SP}/${A}/seo/404/action`, { path: "x".repeat(5000), action: "supprimer" });
    assert.equal((await adminA.get(`${SP}/${A}/seo/404?q=${"a".repeat(3000)}`)).status, 200);
    assert.equal((await adminA.get(`${SP}/${A}/seo/analyse?analyse=abc&gravite=zzz&categorie=<x>`)).status, 200, "filtres invalides ignorés");
    assert.equal((await adminA.get(`${SP}/${A}/seo/schema?page=999999`)).status, 200, "page inconnue : repli sans erreur");
  });

  test("volume : un site de 600 pages reste utilisable (bornes affichées, temps raisonnables)", async () => {
    const ins = db.prepare("INSERT INTO mk_landing_pages (organization_id, name, slug, title, status, site_id, published_at, indexable) VALUES (?, ?, ?, ?, 'published', ?, datetime('now'), 1)");
    db.exec("BEGIN"); for (let i = 0; i < 600; i++) ins.run(orgId, `vol-${i}`, `vol-${i}`, `VOLUME ${i}`, B); db.exec("COMMIT");
    const timings = {};
    for (const p of ["", "/meta", "/indexation", "/sitemap", "/schema", "/open-graph", "/robots"]) {
      const t0 = Date.now(); const r = await adminB.get(`${SP}/${B}/seo${p}`); timings[p || "/"] = Date.now() - t0;
      assert.equal(r.status, 200, p); assert.ok(timings[p || "/"] < 30000, `${p} en ${timings[p || "/"]} ms`);
      if (["", "/meta", "/indexation", "/schema", "/open-graph"].includes(p)) assert.match(r.text, /500 premières/, `bornage annoncé (${p})`);
    }
    console.log("[volume 600 pages] durées (ms) :", JSON.stringify(timings));
    const xml = (await hostGet(srv, "deux.test", "/sitemap.xml")).text; assert.equal((xml.match(/<loc>/g) || []).length >= 600, true, "le plan servi contient toutes les pages");
  });

  test("pas de fuite par paramètre : ?site=, site_id et identifiants falsifiés sont ignorés partout", async () => {
    for (const p of ["", "/analyse", "/meta", "/indexation", "/sitemap", "/schema", "/open-graph", "/robots", "/404"]) {
      const t = (await adminA.get(`${SP}/${A}/seo${p}?site=${B}&site_id=${B}&page=${one("SELECT id FROM mk_landing_pages WHERE slug = 'seul-b'").id}`)).text;
      assert.doesNotMatch(t, /SEUL-BRAVO|seul-b|ancienne-page-b|prive-b|image-bravo|deux\.test/, `rubrique ${p || "vue générale"}`);
    }
  });
});
