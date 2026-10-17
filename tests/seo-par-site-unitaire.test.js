// R8 lot 6B — SEO par site (service, sans serveur) : résolution « site → neutre » (jamais le site principal), redirections uniques par site et résolues par l'hôte, journal 404 par site,
// robots.txt, données structurées, titre/description/canonical et plan du site propres au domaine. Base jetable (DATA_DIR créé par ce test) ; AUCUNE base réelle.
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const SCRATCH = fs.mkdtempSync(path.join(os.tmpdir(), "koyekola-r8seo-"));
process.env.DATA_DIR = path.join(SCRATCH, "data");
process.env.UPLOADS_DIR = path.join(SCRATCH, "uploads");
process.env.SITE_URL = "https://k.test";
process.env.ALLOW_INDEXING = "1";
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { MIGRATIONS, quiet } = require("./marketing-helpers");
after(() => fs.rmSync(SCRATCH, { recursive: true, force: true }));

describe("SEO par site", () => {
  let db, settings, redirects, notfound, robots, schema, resolver, webPages, sitemap, store, A, B, ORG;
  const one = (sql, ...a) => db.prepare(sql).get(...a);
  const reqFor = (site, p = "/") => ({ protocol: "https", method: "GET", path: p, originalUrl: p, hostname: site ? site.host : "k.test", kwSite: site ? { id: site.id, base: site.base } : null, seoBase: site ? site.base : undefined, headers: {}, get: (h) => (String(h).toLowerCase() === "host" ? (site ? site.host : "k.test") : undefined) });
  const siteA = () => ({ id: A, host: "un.test", base: "https://un.test" });
  const siteB = () => ({ id: B, host: "deux.test", base: "https://deux.test" });
  // Rejoue le middleware de redirection avec une requête simulée ; renvoie { status, location } ou null s'il laisse passer
  const run = (site, p) => { let out = null; redirects.middleware({ ...reqFor(site, p), method: "GET", get: () => "", headers: {} }, { redirect: (s, l) => { out = { status: s, location: l }; } }, () => {}); return out; };

  before(() => {
    db = require("../src/config/database");
    settings = require("../src/seo/settings"); redirects = require("../src/seo/redirects"); notfound = require("../src/seo/notfound"); robots = require("../src/seo/robots");
    schema = require("../src/seo/schema"); resolver = require("../src/seo/resolver"); webPages = require("../src/seo/webPages"); sitemap = require("../src/seo/sitemap"); store = require("../src/seo/store");
    const { migrate } = require("../src/marketing/db/migrate");
    migrate(db, { dir: MIGRATIONS, dbPath: path.join(SCRATCH, "data", "KOYEKOLA.db"), backupDir: path.join(SCRATCH, "backups"), log: quiet });
    ORG = Number(db.prepare("INSERT INTO mk_organizations (name, slug) VALUES ('O', 'o')").run().lastInsertRowid);
    const mk = (n, slug) => Number(db.prepare("INSERT INTO mk_sites (organization_id, name, slug, tokens) VALUES (?, ?, ?, '{}')").run(ORG, n, slug).lastInsertRowid);
    A = mk("Site Alpha", "alpha"); B = mk("Site Beta", "beta");
    // Réglages du SITE PRINCIPAL (globaux) : une marque reconnaissable partout où elle ne doit pas apparaître
    const g = settings.save({ site_name: "MARQUE-PRINCIPALE", org_name: "ORG-PRINCIPALE", org_description: "DESC-ORG-PRINCIPALE", default_description: "DESCRIPTION-PRINCIPALE", robots_custom: "User-agent: *\nDisallow: /secret-principal", social_profiles: ["https://facebook.com/principale"], default_social_image: "" }, null);
    assert.equal(g.ok, true, JSON.stringify(g));
  });

  test("résolution : valeur propre au site, sinon valeur NEUTRE — jamais la marque, la description, l'organisation ni les profils du site principal", () => {
    assert.equal(settings.saveForSite(A, { site_name: "Alpha Officiel", org_name: "Alpha SA", robots_custom: "User-agent: *\nDisallow: /secret-a", social_profiles: ["https://facebook.com/alpha"] }, null).ok, true);
    const a = settings.allFor(A), b = settings.allFor(B), main = settings.allFor(null);
    assert.deepEqual([a.site_name, a.org_name_effective, a.robots_custom, a.social_profiles], ["Alpha Officiel", "Alpha SA", "User-agent: *\nDisallow: /secret-a", ["https://facebook.com/alpha"]]);
    assert.equal(b.site_name, "Site Beta", "sans réglage : le nom propre du site (jamais la marque principale)");
    assert.deepEqual([b.org_name_effective, b.default_description, b.org_description, b.org_logo, b.robots_custom, b.social_profiles], ["Site Beta", "", "", "", "", []]);
    assert.equal(main.site_name, "MARQUE-PRINCIPALE", "le site principal est inchangé");
    for (const s of [a, b]) assert.doesNotMatch(JSON.stringify(s), /PRINCIPALE|principale/, "aucune donnée de marque du principal");
  });
  test("écriture : seules les clés propres aux sites sont acceptées, validées comme les globales ; un site inexistant ou une clé globale sont refusés ; le retrait revient au neutre ; tout est journalisé avec le site", () => {
    assert.equal(settings.saveForSite(999, { site_name: "X" }, null).ok, false);
    const g = settings.saveForSite(A, { publish_guard: "block_critical" }, null); assert.equal(g.ok, false); assert.match(g.errors[0], /global/);
    assert.equal(settings.saveForSite(A, { title_template: "{inconnu}" }, null).ok, false, "variable inconnue refusée");
    assert.equal(settings.saveForSite(A, { robots_custom: "Sitemap: https://x" }, null).ok, false, "règle robots invalide refusée");
    assert.equal(settings.saveForSite(A, { site_name: "" }, null).ok, false, "le nom du site reste obligatoire");
    assert.equal(settings.saveForSite(A, { default_description: "" }, null).ok, true, "description vide permise pour un site");
    assert.equal(settings.allFor(A).site_name, "Alpha Officiel", "un lot refusé ne modifie rien");
    assert.equal(settings.saveForSite(B, { org_description: "Chez Beta" }, 7).ok, true);
    assert.equal(settings.allFor(B).org_description, "Chez Beta");
    assert.equal(settings.saveForSite(B, { org_description: null }, 7).ok, true); assert.equal(settings.allFor(B).org_description, "");
    const rows = db.prepare("SELECT site_id, field, user_id FROM seo_changes WHERE entity_type = 'settings' AND site_id = ?").all(B);
    assert.deepEqual(rows.map((r) => r.field), ["org_description", "org_description"]); assert.ok(rows.every((r) => r.user_id === 7));
    assert.equal(store.listChanges({ site: A }).every((c) => c.site_id === A), true); assert.equal(store.listChanges({ site: B }).every((c) => c.site_id === B), true);
    assert.equal(store.listChanges({ site: null }).every((c) => c.site_id === null), true, "le journal global ne mélange pas les sites");
  });
  test("titre, description, canonical, robots/indexation et partage d'une page de site : ceux du SITE, avec le domaine du site", () => {
    const page = { id: 1, name: "Accueil", title: "Bienvenue", description: "", slug: "accueil", status: "published", site_id: A, indexable: 1, sections: [], seo: "{}", updated_at: "2026-01-01 00:00:00" };
    const siteRow = (id, extra = {}) => ({ id, name: id === A ? "Site Alpha" : "Site Beta", home_page_id: null, settings: { seo: { title: "", ogImage: "", publicUrl: id === A ? "https://un.test" : "https://deux.test", follow: true }, extras: { language: "fr", noindex: false, ...extra }, identity: {} } });
    const ra = reqFor(siteA(), "/accueil"), rb = reqFor(siteB(), "/accueil");
    const ia = webPages.inputs(ra, { page, site: siteRow(A) }), ib = webPages.inputs(rb, { page: { ...page, site_id: B }, site: siteRow(B) });
    const ha = resolver.finalize(ra, "/accueil", ia.s), hb = resolver.finalize(rb, "/accueil", ib.s);
    assert.match(ha.title, /Alpha Officiel/); assert.match(hb.title, /Site Beta/);
    assert.equal(ha.description, ""); assert.equal(hb.description, "", "pas de description empruntée au site principal");
    assert.match(ha.canonical, /^https:\/\/un\.test\//); assert.match(hb.canonical, /^https:\/\/deux\.test\//);
    for (const h of [ha, hb]) assert.doesNotMatch(JSON.stringify(h), /PRINCIPALE|k\.test|principale/);
    // site entier en noindex : propre à ce site, l'autre n'est pas touché
    const ib2 = webPages.inputs(rb, { page: { ...page, site_id: B }, site: siteRow(B, { noindex: true }) });
    assert.match(ib2.s.robots, /noindex/); assert.doesNotMatch(ia.s.robots, /noindex/);
  });
  test("données structurées : l'organisation, le nom et les profils sont ceux du site (ou neutres) — jamais ceux du site principal ; le principal reste inchangé", () => {
    const graph = (site) => { const r = reqFor(site); const out = schema.build(r, { page: { url: `${site ? site.base : "https://k.test"}/`, name: "P" }, siteId: site ? site.id : null }); return out[0]["@graph"]; };
    const org = (g) => g.find((n) => /Organization/.test(n["@type"]));
    const ga = graph(siteA()), gb = graph(siteB()), gm = graph(null);
    assert.equal(org(ga).name, "Alpha SA"); assert.deepEqual(org(ga).sameAs, ["https://facebook.com/alpha"]);
    assert.equal(org(gb).name, "Site Beta"); assert.equal(org(gb).sameAs, undefined); assert.equal(org(gb).description, undefined); assert.equal(org(gb).logo, undefined);
    assert.equal(org(gm).name, "ORG-PRINCIPALE"); assert.deepEqual(org(gm).sameAs, ["https://facebook.com/principale"]);
    assert.doesNotMatch(JSON.stringify([ga, gb]), /PRINCIPALE|principale/);
    assert.equal(ga.find((n) => n["@type"] === "WebSite").name, "Alpha Officiel"); assert.equal(gb.find((n) => n["@type"] === "WebSite").name, "Site Beta");
  });
  test("robots.txt : chaque domaine a SES règles supplémentaires (vides par défaut) ; le principal garde les siennes ; l'indexation n'est pas modifiée", () => {
    const ta = robots.text(reqFor(siteA())), tb = robots.text(reqFor(siteB())), tm = robots.text(reqFor(null));
    assert.match(ta, /Disallow: \/secret-a/); assert.doesNotMatch(ta, /secret-principal/);
    assert.doesNotMatch(tb, /secret-/); assert.match(tm, /Disallow: \/secret-principal/); assert.doesNotMatch(tm, /secret-a/);
    for (const [t, base] of [[ta, "https://un.test"], [tb, "https://deux.test"], [tm, "https://k.test"]]) { assert.match(t, new RegExp(`Sitemap: ${base.replace(/\./g, "\\.")}/sitemap\\.xml`)); assert.match(t, /Disallow: \/formateur/, "espaces privés toujours interdits"); assert.doesNotMatch(t, /^Disallow: \/\s*$/m, "aucun site n'est fermé par erreur"); }
  });
  test("redirections : la même ancienne adresse sur deux sites ; unicité par site ; commune réservée ; le site du DOMAINE décide (jamais la requête) ; priorité site > commune", () => {
    assert.equal(redirects.create({ source: "/promo", target: "/promo-commune" }, 1).ok, true);          // commune
    assert.equal(redirects.createForSite(A, { source: "/ancien", target: "/a-page", siteId: B /* ignoré */ }, 2).ok, true);
    assert.equal(redirects.createForSite(B, { source: "/ancien", target: "/b-page" }, 3).ok, true);     // même adresse, autre site : permis
    assert.equal(redirects.createForSite(A, { source: "/ancien", target: "/autre" }, 2).ok, false, "doublon sur le même site refusé");
    assert.equal(redirects.createForSite(A, { source: "/promo", target: "/promo-a" }, 2).ok, true, "le site peut surcharger la commune pour son domaine");
    assert.equal(redirects.create({ source: "/promo", target: "/x" }, 1).ok, false, "deux communes refusées");
    assert.equal(one("SELECT site_id FROM seo_redirects WHERE target = '/a-page'").site_id, A, "le site est celui de l'appelant, pas celui des données");
    assert.deepEqual(run(siteA(), "/ancien"), { status: 301, location: "/a-page" });
    assert.deepEqual(run(siteB(), "/ancien"), { status: 301, location: "/b-page" });
    assert.equal(run(null, "/ancien"), null, "l'hôte principal n'est pas touché par les redirections des sites");
    assert.deepEqual(run(siteA(), "/promo"), { status: 301, location: "/promo-a" }, "site avant commune");
    assert.deepEqual(run(siteB(), "/promo"), { status: 301, location: "/promo-commune" }, "la commune reste active partout (comportement d'origine)");
    assert.deepEqual(run(null, "/promo"), { status: 301, location: "/promo-commune" });
    const spoof = reqFor(null, "/ancien"); spoof.query = { site: String(A) }; spoof.headers = { "x-site": String(A) }; spoof.body = { site_id: A };
    let hit = null; redirects.middleware({ ...spoof, get: () => "" }, { redirect: (s, l) => { hit = l; } }, () => {}); assert.equal(hit, null, "un site_id injecté dans la requête ne change rien");
  });
  test("redirections : un site ne lit, ne modifie ni ne supprime celles d'un autre site ni les communes ; boucles et chaînes contrôlées dans la portée du site", () => {
    const own = db.prepare("SELECT id FROM seo_redirects WHERE site_id = ? AND source_path = '/ancien'").get(A).id;
    const other = db.prepare("SELECT id FROM seo_redirects WHERE site_id = ? AND source_path = '/ancien'").get(B).id;
    const common = db.prepare("SELECT id FROM seo_redirects WHERE site_id IS NULL AND source_path = '/promo'").get().id;
    assert.equal(redirects.getForSite(A, other), null); assert.equal(redirects.getForSite(A, common), null); assert.ok(redirects.getForSite(A, own));
    assert.deepEqual(redirects.queryForSite(A).rows.map((r) => r.source_path).sort(), ["/ancien", "/promo"]);
    assert.ok(redirects.queryForSite(A).rows.every((r) => r.site_id === A));
    for (const id of [other, common]) {
      assert.equal(redirects.updateForSite(A, id, { source: "/z", target: "/y" }, 2).ok, false); assert.equal(redirects.removeForSite(A, id, 2), false);
    }
    assert.equal(db.prepare("SELECT COUNT(*) n FROM seo_redirects").get().n, 4, "rien n'a été touché");
    // modifier la sienne ne peut pas la déplacer vers un autre site
    assert.equal(redirects.updateForSite(A, own, { source: "/ancien", target: "/a-page-2", siteId: B }, 2).ok, true);
    assert.equal(db.prepare("SELECT site_id, target FROM seo_redirects WHERE id = ?").get(own).site_id, A);
    // boucle (A→B puis B→A) et chaîne dans le même site
    assert.equal(redirects.createForSite(A, { source: "/x1", target: "/x2" }, 2).ok, true);
    const loop = redirects.createForSite(A, { source: "/x2", target: "/x1" }, 2); assert.equal(loop.ok, false); assert.match(loop.errors.join(" "), /Boucle/);
    assert.equal(redirects.createForSite(B, { source: "/x2", target: "/x1" }, 3).ok, true, "la même paire sur un AUTRE site ne forme pas de boucle avec le premier");
    assert.throws(() => redirects.createForSite(null, { source: "/q", target: "/r" }), /site non vérifié/);
    assert.equal(redirects.removeForSite(A, own, 2), true);
    // journal : les changements portent le site
    assert.ok(db.prepare("SELECT COUNT(*) n FROM seo_changes WHERE entity_type = 'redirect' AND site_id = ?").get(A).n >= 3);
  });
  test("journal 404 : une ligne par adresse ET par site (même adresse sur deux sites = deux lignes) ; chaque lecture est bornée ; les actions visent la bonne ligne", () => {
    const rec = (site, p) => notfound.record({ ...reqFor(site, p), originalUrl: p, get: (h) => (/user-agent/i.test(h) ? "Mozilla/5.0" : undefined) });
    rec(siteA(), "/introuvable"); rec(siteA(), "/introuvable"); rec(siteB(), "/introuvable"); rec(null, "/introuvable"); rec(siteB(), "/seulement-b");
    assert.equal(db.prepare("SELECT COUNT(*) n FROM seo_404 WHERE path = '/introuvable'").get().n, 3);
    assert.equal(notfound.list({ site: A }).length, 1); assert.equal(notfound.list({ site: A })[0].hits_human, 2);
    assert.deepEqual(notfound.list({ site: B }).map((r) => r.path).sort(), ["/introuvable", "/seulement-b"]);
    assert.deepEqual(notfound.list({ site: null }).map((r) => r.path), ["/introuvable"], "l'hôte principal ne voit pas les 404 des sites");
    assert.equal(notfound.list({ site: A }).some((r) => r.path === "/seulement-b"), false, "pas de fuite d'un site à l'autre");
    assert.equal(notfound.stats({ site: B }).urls, 2); assert.equal(notfound.stats({ site: A }).urls, 1);
    assert.equal(notfound.setIgnored("/introuvable", true, { site: B }), true);
    assert.equal(notfound.list({ site: A }).length, 1, "ignorer côté B ne touche pas A"); assert.equal(notfound.list({ site: null }).length, 1);
    assert.equal(notfound.remove("/seulement-b", { site: A }), false, "supprimer l'adresse d'un autre site : sans effet");
    assert.equal(notfound.remove("/seulement-b", { site: B }), true);
    assert.equal(notfound.list({}).length >= 2, true, "l'équipe (sans filtre) voit toutes les lignes");
  });
  test("plan du site : chaque domaine ne liste que SES pages ; une redirection d'un AUTRE site n'exclut rien ici", () => {
    const mkPage = (slug, site) => Number(db.prepare("INSERT INTO mk_landing_pages (organization_id, name, slug, title, status, site_id, published_at, indexable) VALUES (?, ?, ?, ?, 'published', ?, datetime('now'), 1)").run(ORG, slug, slug, slug, site).lastInsertRowid);
    const pa = mkPage("page-a", A), pb = mkPage("page-b", B);
    db.prepare("UPDATE mk_sites SET settings = ? WHERE id = ?").run(JSON.stringify({ seo: { publicUrl: "https://un.test" } }), A);
    db.prepare("UPDATE mk_sites SET settings = ? WHERE id = ?").run(JSON.stringify({ seo: { publicUrl: "https://deux.test" } }), B);
    require("../src/services/urls").invalidateSites();
    const ea = sitemap.entries({ hostSite: { id: A } }).included.map((e) => e.path), eb = sitemap.entries({ hostSite: { id: B } }).included.map((e) => e.path);
    assert.ok(ea.some((p) => /page-a/.test(p))); assert.ok(!ea.some((p) => /page-b/.test(p))); assert.ok(eb.some((p) => /page-b/.test(p))); assert.ok(!eb.some((p) => /page-a/.test(p)));
    // une redirection du site B sur « /page-a » ne retire pas la page de A du plan de A
    db.prepare("INSERT INTO seo_redirects (source_path, target, site_id) VALUES ('/page-a', '/ailleurs', ?)").run(B);
    redirects.invalidate();
    assert.ok(sitemap.entries({ hostSite: { id: A } }).included.some((e) => /page-a/.test(e.path)), "redirection d'un autre site sans effet");
    assert.ok(pa && pb);
  });
});
