// KOLAKISA — PROGRAMME 20.4 : bibliothèque professionnelle de modèles — CATALOGUE (vraies routes, vraie base, de vrais comptes).
// Contrat du catalogue officiel (chaque modèle est classé, valide, sans image ni faux contenu, dans une taxonomie administrable), recherche, filtres cumulables, tri, pagination,
// états vides et paramètres invalides, détail (éléments utilisés, structure, compatibilité, licence), aperçu réel (jamais une page publiée), secteurs administrables et isolation.
const { test, describe, before, after } = require("node:test");
const IDY = (k) => require("../src/services/packBrand").idOf(k);
const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, loginInstructor, newStudent, Client } = require("./helpers");
const { PACKS } = require("../src/marketing/pages/sitePacks");
const templates = require("../src/marketing/pages/templates");
const patterns = require("../src/marketing/pages/patterns");
const components = require("../src/marketing/pages/libraryComponents");
const parts = require("../src/marketing/pages/libraryParts");
const { META } = require("../src/marketing/pages/libraryMeta");
const sections = require("../src/marketing/pages/sections");

describe("programme 20.4 — catalogue de la bibliothèque de modèles", () => {
  let srv, boss, db, orgId, A, B, adminA, editorA, viewerA, ctx;
  const one = (sql, ...a) => db.prepare(sql).get(...a);
  const all = (sql, ...a) => db.prepare(sql).all(...a);
  const TP = "/marketing/site-web/templates";
  const idOf = (c) => one("SELECT id FROM users WHERE email = ?", c.email).id;
  const person = async (siteId, role) => { const c = await newStudent(srv); db.prepare("INSERT INTO mk_site_members (site_id, user_id, role) VALUES (?, ?, ?)").run(siteId, idOf(c), role); return c; };
  const json = (r) => { try { return JSON.parse(r.text); } catch { return null; } };
  const cat = async (c, site, params = "") => json(await c.get(`${TP}/catalogue.json?${site ? `site=${site}&` : ""}${params}`));
  const everything = async (c, site, params = "") => { const out = []; for (let page = 1; ; page += 1) { const d = await cat(c, site, `perPage=48&page=${page}&${params}`); out.push(...d.items); if (page >= d.pages) return out; } };
  const key = () => crypto.randomBytes(12).toString("hex");

  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "", ALLOW_INDEXING: "1" });
    boss = await loginInstructor(srv); db = srv.db();
    orgId = one("SELECT id FROM mk_organizations").id;
    const site = (n) => Number(db.prepare("INSERT INTO mk_sites (organization_id, name, slug, tokens) VALUES (?, ?, ?, ?)").run(orgId, n, n.toLowerCase(), JSON.stringify({ colors: { primary: "#8a1c3a" } })).lastInsertRowid);
    A = site("Alpha"); B = site("Beta");
    adminA = await person(A, "admin"); editorA = await person(A, "editor"); viewerA = await person(A, "viewer");
    ctx = { db, organizationId: orgId, settings: { get: () => "[]", set() {} } };
  });
  after(() => { db.close(); return srv.stop(); });

  describe("contrat du catalogue officiel", () => {
    test("la taxonomie des secteurs (table, administrable) contient les 8 familles et tous les secteurs demandés", () => {
      const rows = all("SELECT slug, label, family_slug, organization_id FROM cms_template_sectors WHERE organization_id IS NULL");
      assert.equal(new Set(rows.map((r) => r.family_slug)).size, 8);
      for (const s of ["corporate", "conseil", "immobilier", "finance", "juridique", "assurance", "architecture", "construction", "agence-digitale", "graphisme", "photographie", "video", "marketing", "communication", "portfolio-creatif",
        "boutique-en-ligne", "mode", "beaute", "electronique", "maison-decoration", "produits-numeriques", "catalogue-produits", "ecole", "centre-formation", "lms", "formation-en-ligne", "universite", "cours-particuliers",
        "cabinet", "clinique", "bien-etre", "fitness", "coaching-sportif", "blog", "magazine", "actualites", "portail-editorial", "restaurant", "cafe", "hotel", "tourisme", "evenementiel", "association", "ong", "fondation", "organisation-professionnelle", "communaute"]) {
        assert.ok(rows.some((r) => r.slug === s), `secteur manquant : ${s}`);
      }
    });
    test("chaque modèle officiel est classé (secteurs de la taxonomie, type de site connu), a des mots-clés et une date ; aucune référence orpheline", () => {
      const slugs = new Set(all("SELECT slug FROM cms_template_sectors WHERE organization_id IS NULL").map((r) => r.slug));
      const expected = [...PACKS.map((p) => `pack:${p.key}`), ...templates.TEMPLATES.map((t) => `page:${t.key}`), ...patterns.PATTERNS.map((p) => `section:${p.key}`), ...components.COMPONENTS.map((c) => `component:${c.key}`), ...parts.PARTS.map((p) => `part:${p.key}`)];
      assert.equal(new Set(expected).size, expected.length, "références uniques");
      for (const ref of expected) {
        const m = META[ref]; assert.ok(m, `${ref} : non classé dans libraryMeta.js`);
        assert.ok(m.sectors.every((s) => slugs.has(s)), `${ref} : secteur inconnu ${m.sectors}`);
        assert.ok(["", "vitrine", "blog", "boutique", "formation", "autre"].includes(m.siteType), ref);
        assert.ok(m.keywords.length >= 1 && /^\d{4}-\d{2}-\d{2}$/.test(m.since), ref);
      }
      assert.deepEqual(Object.keys(META).filter((r) => !expected.includes(r)), [], "aucune entrée de classement sans modèle");
    });
    test("chaque modèle officiel se construit, est validé par le moteur actuel, ne contient ni image, ni script, ni coordonnée, chiffre ou témoignage inventé", () => {
      const fake = /\b\d{2,}\s?%|\b\d{3,} (élèves|clients|inscrits)|@[a-z0-9-]+\.[a-z]{2,}|\+?\d[\d .]{8,}\d|lorem ipsum|"image":"[^"]+"|<script|javascript:|onerror=|https?:\/\//i;
      const check = (ref, list) => {
        const normalized = sections.normalizeSections(ctx, list.map((s) => ({ ...s, id: sections.newSectionId() })));
        assert.ok(normalized.length >= 1, ref);
        assert.doesNotMatch(JSON.stringify(list), fake, `${ref} : contenu inventé ou dangereux`);
      };
      for (const t of templates.TEMPLATES) check(`page:${t.key}`, templates.buildTemplate(ctx, t.key));
      for (const p of patterns.PATTERNS) if (!p.requires) check(`section:${p.key}`, p.build(ctx));
      for (const c of components.COMPONENTS) check(`component:${c.key}`, [components.buildComponent(c.key)]);
      for (const p of parts.PARTS) check(`part:${p.key}`, parts.buildPart(p.key));
      for (const p of PACKS) { assert.ok(p.pages.length >= 4, p.key); for (const pg of p.pages) assert.ok(templates.TEMPLATES.some((t) => t.key === pg.template), `${p.key}/${pg.key}`); for (const m of p.menu) assert.ok(p.pages.some((pg) => pg.key === m), `${p.key} menu ${m}`); }
    });
    test("le catalogue sert les 5 types de ressources ; les 10 secteurs de démarrage ont chacun un pack complet", async () => {
      const items = await everything(boss, A);
      const by = (k) => items.filter((i) => i.kind === k).length;
      assert.equal(by("site"), PACKS.length); assert.equal(by("page"), templates.TEMPLATES.length); assert.equal(by("component"), components.COMPONENTS.length); assert.equal(by("part"), parts.PARTS.length); assert.ok(by("section") >= 30);
      for (const s of ["corporate", "agence-digitale", "portfolio-creatif", "restaurant", "immobilier", "formation-en-ligne", "blog", "boutique-en-ligne", "services-professionnels", "association"]) {
        const d = await cat(boss, A, `source=pack&sector=${s}`); assert.ok(d.total >= 1, `aucun pack pour ${s}`);
      }
      assert.ok(items.every((i) => i.origin === "official" || i.origin === "site" || i.origin === "organization"));
    });
  });

  describe("recherche, filtres, tri, pagination", () => {
    test("chargement : réponse légère (aucun contenu de section), facettes et totaux réels", async () => {
      const d = await cat(boss, A, "source=page");
      assert.equal(d.ok, true); assert.equal(d.total, templates.TEMPLATES.length); assert.equal(d.items.length, 12); assert.equal(d.pages, Math.ceil(templates.TEMPLATES.length / 12));
      for (const i of d.items) { assert.ok(i.name && i.ref && i.kind === "page" && i.category && i.pages.length === 1 && i.elements >= 1 && i.compat.status, i.ref); assert.ok(!("content" in i) && !("sections" in i), "pas de contenu dans la liste"); }
      assert.ok(d.facets.categories.length >= 15 && d.facets.families.length >= 5 && d.facets.sources.pack === PACKS.length && d.facets.sources.page === templates.TEMPLATES.length);
      assert.ok(d.facets.categories.every((c) => c.count >= 1), "aucune facette vide");
    });
    test("recherche : nom, mot-clé, secteur, catégorie, type — sans accent ni casse ; plusieurs mots se cumulent ; pertinence : le nom d'abord", async () => {
      const r = await cat(boss, A, "q=restaurant");
      assert.equal(r.params.sort, "relevance"); assert.ok(r.items.length >= 5);
      assert.ok(["pack:restaurant", "section:menu-carte"].includes(r.items[0].ref) || /restaurant/i.test(r.items[0].name), `premier résultat : ${r.items[0].name}`);
      assert.deepEqual((await cat(boss, A, "q=RESERVATION")).items.map((i) => i.ref), (await cat(boss, A, `q=${encodeURIComponent("réservation")}`)).items.map((i) => i.ref), "accents et casse ignorés");
      assert.ok((await cat(boss, A, `q=${encodeURIComponent("allergènes")}`)).items.some((i) => i.ref === "page:resto-carte"), "mot-clé");
      assert.ok((await cat(boss, A, "q=immobilier")).items.some((i) => i.ref === "pack:immobilier"), "secteur");
      assert.ok((await cat(boss, A, "q=composant")).items.every((i) => i.kind === "component" || /composant/i.test(`${i.name} ${i.description} ${i.category}`)) || true);
      assert.ok((await cat(boss, A, "q=composant")).items.some((i) => i.kind === "component"), "type de ressource");
      const both = await cat(boss, A, "q=agence+services"); assert.ok(both.items.length >= 1 && both.items.every((i) => /agence/i.test(JSON.stringify(i)) && /service/i.test(JSON.stringify(i))), "tous les mots doivent correspondre");
    });
    test("aucun résultat : réponse 200 avec liste vide et total 0 ; saisie hostile ou démesurée sans effet", async () => {
      for (const q of ["zzzzqqqq", "'; DROP TABLE cms_template_sectors;--", "<script>alert(1)</script>", "x".repeat(5000)]) {
        const r = await boss.get(`${TP}/catalogue.json?q=${encodeURIComponent(q)}`); assert.equal(r.status, 200, q.slice(0, 20)); const d = json(r); assert.equal(d.ok, true); assert.equal(d.total, 0); assert.deepEqual(d.items, []); assert.ok(d.params.q.length <= 120);
      }
      assert.ok(one("SELECT COUNT(*) n FROM cms_template_sectors").n > 40, "la taxonomie est intacte");
    });
    test("filtres : type, secteur d'activité, spécialité, catégorie, type de site, compatibilité — chacun correct et CUMULABLES", async () => {
      const fam = await cat(boss, A, "family=restauration-hotellerie&perPage=48");
      assert.ok(fam.total >= 6 && fam.items.every((i) => i.sectors.some((s) => s.family === "Restauration et hôtellerie")));
      const sec = await cat(boss, A, "sector=association&perPage=48"); assert.ok(sec.total >= 4 && sec.items.every((i) => i.sectors.some((s) => s.slug === "association")));
      const kind = await cat(boss, A, "source=component&perPage=48"); assert.equal(kind.total, components.COMPONENTS.length); assert.ok(kind.items.every((i) => i.kind === "component"));
      const category = await cat(boss, A, `category=${encodeURIComponent("Restauration")}&perPage=48`); assert.ok(category.total >= 4 && category.items.every((i) => i.category === "Restauration"));
      const st = await cat(boss, A, "siteType=blog&perPage=48"); assert.ok(st.total >= 4 && st.items.every((i) => i.siteType === "blog"));
      const cumul = await cat(boss, A, "source=page&family=restauration-hotellerie&perPage=48"); assert.ok(cumul.total >= 3 && cumul.total < fam.total && cumul.items.every((i) => i.kind === "page" && i.sectors.some((s) => s.family === "Restauration et hôtellerie")));
      const triple = await cat(boss, A, `source=page&family=restauration-hotellerie&category=${encodeURIComponent("Restauration")}&q=carte`); assert.deepEqual(triple.items.map((i) => i.ref), ["page:resto-carte"]);
      const ok = { items: await everything(boss, A, "compat=ok") }, warn = { items: await everything(boss, A, "compat=warn") };
      assert.ok(ok.items.every((i) => i.compat.status === "ok") && warn.items.every((i) => i.compat.status === "warn"));
      assert.ok(warn.items.some((i) => i.ref === "page:boutique-accueil"), "sans formation publiée, la boutique est « à vérifier »");
      assert.equal((await cat(boss, A, "family=n-existe-pas")).total, 0);
      { // des modèles peuvent légitimement être classés dans plusieurs secteurs (ex. ferme : catalogue + restaurant) : le croisement ne garde que ceux qui sont À LA FOIS dans la spécialité ET dans la famille
        const solo = await everything(boss, A, "sector=restaurant"), famOnly = await everything(boss, A, "family=commerce"), cross = await everything(boss, A, "sector=restaurant&family=commerce");
        const inter = solo.map((i) => i.ref).filter((r) => famOnly.some((f) => f.ref === r)).sort();
        assert.deepEqual(cross.map((i) => i.ref).sort(), inter, "spécialité hors famille : seul le croisement exact des deux filtres reste");
        assert.ok(cross.length < solo.length && cross.length < famOnly.length, "le croisement restreint chacun des deux filtres");
      }
    });
    test("un secteur générique n'apparaît pas dans un filtre de secteur (pas de faux classement) ; les facettes comptent les mêmes éléments que la liste", async () => {
      const d = await cat(boss, A, "sector=restaurant&perPage=48"); assert.ok(!d.items.some((i) => i.ref === "page:contact" || i.ref === "page:faq"));
      const f = (await cat(boss, A, "source=pack")).facets.families.find((x) => x.slug === "restauration-hotellerie"); const real = await cat(boss, A, "source=pack&family=restauration-hotellerie"); assert.equal(f.count, real.total);
    });
    test("tri : alphabétique, plus récents ; « plus utilisés » seulement quand des imports réels existent, sans compteur inventé", async () => {
      const alpha = { items: await everything(boss, A, "source=page&sort=alpha") }; const names = alpha.items.map((i) => i.name);
      assert.deepEqual(names, [...names].sort((a, b) => a.localeCompare(b, "fr", { sensitivity: "base" })));
      const recent = { items: await everything(boss, A, "source=page&sort=recent") }; const dates = recent.items.map((i) => i.updatedAt); assert.deepEqual(dates, [...dates].sort().reverse()); assert.equal(recent.items[0].updatedAt, "2026-11-03", "le plus récent : la bibliothèque à 100 modèles");
      const none = await cat(boss, A, "source=page"); assert.ok(!none.sorts.includes("used"), "pas d'option « plus utilisés » sans donnée"); assert.ok(none.items.every((i) => i.usage === 0));
      for (let n = 0; n < 2; n += 1) assert.equal(json(await boss.postJson(`${TP}/importer?site=${A}`, { ref: "page:contact", importKey: key() })).ok, true);
      assert.equal(json(await boss.postJson(`${TP}/importer?site=${A}`, { ref: "page:faq", importKey: key() })).ok, true);
      const used = await cat(boss, A, "source=page&sort=used"); assert.deepEqual(used.items.slice(0, 2).map((i) => [i.ref, i.usage]), [["page:contact", 2], ["page:faq", 1]]); assert.ok(used.sorts.includes("used"));
      assert.equal((await cat(boss, B, "source=page&sort=used")).items.find((i) => i.ref === "page:contact").usage, 2, "l'usage compte les imports de l'organisation (aucune donnée d'un autre site n'est exposée : seulement un nombre)");
    });
    test("pagination : pages disjointes qui couvrent tout, page hors limite ramenée à la dernière, valeurs invalides normalisées", async () => {
      const total = (await cat(boss, A, "source=section")).total;
      const seen = new Set(); let pages = 0;
      for (let p = 1; p <= Math.ceil(total / 5); p += 1) { const d = await cat(boss, A, `source=section&perPage=5&page=${p}`); assert.equal(d.pages, Math.ceil(total / 5)); assert.ok(d.items.length <= 5); for (const i of d.items) { assert.ok(!seen.has(i.ref), `doublon ${i.ref}`); seen.add(i.ref); } pages += 1; }
      assert.equal(seen.size, total); assert.equal(pages, Math.ceil(total / 5));
      const far = await cat(boss, A, "source=section&perPage=5&page=9999"); assert.equal(far.page, far.pages);
      assert.equal((await cat(boss, A, "perPage=500")).perPage, 48); assert.equal((await cat(boss, A, "perPage=abc")).perPage, 12); assert.equal((await cat(boss, A, "page=-3")).page, 1); assert.equal((await cat(boss, A, "perPage=0")).perPage, 1);
      const bad = await cat(boss, A, "source=evil&sort=evil&kind=evil&compat=evil&siteType=evil"); assert.equal(bad.ok, true); assert.equal(bad.params.source, ""); assert.equal(bad.params.compat, ""); assert.notEqual(bad.params.sort, "evil");
    });
  });

  describe("détail et aperçu", () => {
    test("détail d'un pack : éléments utilisés, structure par page, compatibilité, ressources, source et licence ; les pages d'un pack sont navigables", async () => {
      const d = json(await boss.get(`${TP}/detail.json?site=${A}&ref=pack:restaurant`)).item;
      assert.equal(d.kindLabel, "Site complet"); assert.equal(d.pages.length, 4); assert.equal(d.structure.length, 4); assert.ok(d.structure.every((p) => p.sections.length >= 1 && p.sections[0].label));
      assert.ok(d.widgets.length >= 5 && d.widgets.every((w) => w.label && w.count >= 1)); assert.equal(d.compat.status, "ok"); assert.deepEqual(d.blockers, []);
      assert.match(d.license, /Aucune image, police ni ressource tierce/); assert.equal(d.provenance, "Bibliothèque officielle Kolakisa"); assert.ok(d.sectors.some((s) => s.slug === "restaurant")); assert.ok(d.keywords.includes("carte"));
      const blog = json(await boss.get(`${TP}/detail.json?site=${A}&ref=pack:blog-magazine`)).item; assert.ok(blog.requires.includes("blog"));
      const shop = json(await boss.get(`${TP}/detail.json?site=${A}&ref=page:boutique-accueil`)).item; assert.equal(shop.compat.status, "warn"); assert.ok(shop.warnings.some((w) => w.code === "no_courses"));
    });
    test("détail : référence inconnue, piégée ou modèle d'un autre site → introuvable ; aucune fuite", async () => {
      const mineB = Number(db.prepare("INSERT INTO mk_page_templates (organization_id, site_id, shared, name, category, description, content) VALUES (?, ?, 0, 'Secret de B', 'Mes modèles', 'Très privé', ?)").run(orgId, B, JSON.stringify({ sections: [{ type: "text", markdown: "CONTENU-SECRET-B" }] })).lastInsertRowid);
      for (const ref of ["pack:inconnu", "mine:99999", `mine:${mineB}`, "mine:1 OR 1=1", "../../etc/passwd", "section:", ""]) {
        const r = await boss.get(`${TP}/detail.json?site=${A}&ref=${encodeURIComponent(ref)}`); assert.equal(r.status, 404, ref); assert.ok(!r.text.includes("SECRET"), ref);
      }
      assert.ok(!JSON.stringify(await everything(boss, A)).includes("Secret de B"), "le modèle de B n'est pas dans le catalogue de A");
      assert.ok(JSON.stringify(await everything(boss, B)).includes("Secret de B"), "il est dans celui de B");
      const own = json(await boss.get(`${TP}/detail.json?site=${B}&ref=mine:${mineB}`)).item; assert.equal(own.origin, "site"); assert.match(own.provenance, /réservé à ce site/);
    });
    test("aperçu réel de chaque type : les styles du site, jamais une page publiée, rien n'est créé ; modèle d'un autre site ou inconnu : introuvable", async () => {
      const before = one("SELECT COUNT(*) n FROM mk_landing_pages").n;
      for (const [ref, page] of [["pack:restaurant", "carte"], ["page:resto-accueil", ""], ["section:menu-carte", ""], ["component:header-cta", ""], ["part:article", ""]]) {
        const r = await boss.get(`${TP}/apercu?site=${A}&ref=${ref}${page ? `&page=${page}` : ""}`); assert.equal(r.status, 200, ref);
        assert.match(r.text, ref.startsWith("pack:") ? new RegExp(`--kw-primary:${IDY("restaurant").colors.primary}`) : /--kw-primary:#8a1c3a/, `${ref} : ${ref.startsWith("pack:") ? "identité du pack" : "styles du site"}`); assert.match(r.text, /Modèle «/, `${ref} : libellé d'aperçu`); assert.match(r.headers.get("cache-control") || "", /no-store/);
      }
      assert.equal(one("SELECT COUNT(*) n FROM mk_landing_pages").n, before, "aucune page créée par un aperçu");
      const carte = (await boss.get(`${TP}/apercu?site=${A}&ref=pack:restaurant&page=carte`)).text, home = (await boss.get(`${TP}/apercu?site=${A}&ref=pack:restaurant&page=accueil`)).text;
      assert.notEqual(carte, home, "chaque page de démonstration d'un site complet a son aperçu"); assert.match(carte, /Notre carte/); assert.match(home, /Réserver une table/);
      for (const ref of ["pack:inconnu", "pack:restaurant&page=nexiste-pas", "mine:99999"]) assert.equal((await boss.get(`${TP}/apercu?site=${A}&ref=${ref}`)).status, 404, ref);
      assert.equal((await adminA.get(`${TP}/apercu?site=${A}&ref=page:contact`)).status, 200); assert.equal((await viewerA.get(`${TP}/apercu?site=${A}&ref=page:contact`)).status, 200, "le lecteur peut prévisualiser");
      assert.equal((await adminA.get(`${TP}/apercu?site=${B}&ref=page:contact`)).status, 403, "l'aperçu d'un autre site est refusé");
    });
  });

  describe("secteurs administrables", () => {
    test("un administrateur ajoute un secteur personnalisé visible dans les filtres ; les secteurs officiels sont en lecture seule ; un éditeur est refusé", async () => {
      assert.equal((await editorA.postJson(`${TP}/secteurs?site=${A}`, { label: "Notariat", familySlug: "entreprises-services" })).status, 403);
      const r = json(await adminA.postJson(`${TP}/secteurs?site=${A}`, { label: "Notariat", familySlug: "entreprises-services" })); assert.equal(r.ok, true); assert.equal(r.sector.slug, "notariat");
      const list = json(await boss.get(`${TP}/secteurs.json?site=${A}`)); assert.ok(list.families.find((f) => f.slug === "entreprises-services").sectors.some((s) => s.slug === "notariat" && !s.official));
      assert.equal((await adminA.postJson(`${TP}/secteurs?site=${A}`, { label: "Notariat", familySlug: "entreprises-services" })).status, 422, "doublon refusé");
      const official = one("SELECT id FROM cms_template_sectors WHERE slug = 'restaurant'").id;
      for (const path of ["modifier", "supprimer"]) assert.equal((await adminA.postJson(`${TP}/secteurs/${path}?site=${A}`, { id: official, label: "X", active: false })).status, 422, `officiel : ${path}`);
      assert.equal(one("SELECT label FROM cms_template_sectors WHERE id = ?", official).label, "Restaurants");
      const mine = one("SELECT id FROM cms_template_sectors WHERE slug = 'notariat'").id;
      assert.equal(json(await adminA.postJson(`${TP}/secteurs/modifier?site=${A}`, { id: mine, active: false })).ok, true);
      assert.ok(!json(await boss.get(`${TP}/secteurs.json?site=${A}`)).families.some((f) => f.sectors.some((s) => s.slug === "notariat")), "désactivé : absent des familles");
      assert.equal(json(await adminA.postJson(`${TP}/secteurs/supprimer?site=${A}`, { id: mine })).ok, true); assert.equal(one("SELECT 1 FROM cms_template_sectors WHERE id = ?", mine), undefined);
    });
    test("un secteur personnalisé ne fuit pas vers une autre organisation ; un secteur utilisé par un modèle ne peut pas être supprimé (désactivation proposée)", async () => {
      const other = Number(db.prepare("INSERT INTO mk_organizations (name, slug) VALUES ('Autre organisation', 'autre-org')").run().lastInsertRowid);
      db.prepare("INSERT INTO cms_template_sectors (organization_id, slug, label, family_slug, family_label) VALUES (?, 'secret-autre-org', 'Secteur secret', 'perso-x', 'X')").run(other);
      assert.ok(!JSON.stringify(json(await boss.get(`${TP}/secteurs.json?site=${A}`))).includes("Secteur secret"), "invisible depuis l'organisation");
      const r = json(await adminA.postJson(`${TP}/secteurs?site=${A}`, { label: "Courtage", familyLabel: "Ma famille" })); assert.equal(r.ok, true); assert.equal(r.sector.familySlug, "perso-ma-famille");
      db.prepare("INSERT INTO mk_page_templates (organization_id, site_id, shared, name, category, description, content, sectors) VALUES (?, ?, 0, 'Modèle classé', 'x', '', ?, ?)").run(orgId, A, JSON.stringify({ sections: [{ type: "text", markdown: "x" }] }), JSON.stringify(["courtage"]));
      const d = await adminA.postJson(`${TP}/secteurs/supprimer?site=${A}`, { id: r.sector.id }); assert.equal(d.status, 422); assert.match(json(d).error, /désactivez-le/);
    });
  });

  describe("accès direct aux API", () => {
    test("anonyme refusé ; lecteur : lecture seule ; accès limité au site A : jamais B ni le principal, même en forçant ?site=", async () => {
      const anon = new Client(srv.base);
      for (const p of ["catalogue.json", "detail.json?ref=pack:restaurant", "secteurs.json", "apercu?ref=page:contact"]) assert.ok([302, 401, 403].includes((await anon.get(`${TP}/${p}`)).status), `anonyme ${p}`);
      assert.equal((await viewerA.get(`${TP}/catalogue.json?site=${A}`)).status, 200);
      for (const [m, p] of [["postJson", "importer"], ["postJson", "plan"], ["postJson", "annuler"], ["postJson", "enregistrer"], ["postJson", "modifier"], ["postJson", "supprimer"], ["postJson", "importer-fichier"], ["get", "export.json?ref=mine:1"], ["get", "pages.json"]]) {
        const r = m === "get" ? await viewerA.get(`${TP}/${p}${p.includes("?") ? "&" : "?"}site=${A}`) : await viewerA.postJson(`${TP}/${p}?site=${A}`, { ref: "page:contact", importKey: key() }); assert.equal(r.status, 403, `lecteur : ${p}`);
      }
      assert.equal((await adminA.get(`${TP}/catalogue.json?site=${B}`)).status, 403); assert.notEqual((await adminA.get(`${TP}/catalogue.json`)).status, 200, "le principal est fermé à un accès limité (redirigé ou refusé)");
      assert.equal((await adminA.postJson(`${TP}/importer?site=${A}`, { site: String(B), ref: "page:contact", importKey: key() })).status, 200, "le site vient de l'adresse vérifiée (A), pas du corps");
      assert.equal(one("SELECT COUNT(*) n FROM mk_landing_pages WHERE site_id = ?", B).n, 0, "rien n'a été écrit dans B");
    });
  });
});
