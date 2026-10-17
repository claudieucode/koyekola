// R4 — visibilité des listes par site : mécanisme central (visibility.js) et application aux listes des modules (listes, campagnes, segments, modèles, automatisations,
// tunnels, tests A/B, pages, analytics). Vraies migrations, base en mémoire ; les droits sont injectés (aucun serveur, aucune base de l'application).
const { test, describe, before } = require("node:test");
const assert = require("node:assert/strict");
const { freshMarketing } = require("./marketing-helpers");
const visibility = require("../src/marketing/visibility");
const { siteSql } = require("../src/marketing/audience/shared");
const audience = require("../src/marketing/audience");
const sending = require("../src/marketing/sending");
const templates = require("../src/marketing/templates");
const segments = require("../src/marketing/segments");
const automations = require("../src/marketing/automations");
const funnels = require("../src/marketing/funnels");
const abtests = require("../src/marketing/pages/abtests");
const pages = require("../src/marketing/pages");
const cmsPages = require("../src/marketing/pages/cmsPages");
const engine = require("../src/marketing/analytics/engine");
const { createRepository } = require("../src/marketing/db/repository");

let m, db, A, B, ctxOf;
const row = (sql, ...a) => Number(db.prepare(sql).run(...a).lastInsertRowid);

before(() => {
  m = freshMarketing();
  db = m.db;
  A = row("INSERT INTO mk_sites (organization_id, name, slug, tokens) VALUES (1, 'Alpha', 'alpha', '{}')");
  B = row("INSERT INTO mk_sites (organization_id, name, slug, tokens) VALUES (1, 'Beta', 'beta', '{}')");
  for (const [k, s] of [["A", A], ["B", B], ["M", null]]) {
    const list = row("INSERT INTO mk_lists (organization_id, name, site_id) VALUES (1, ?, ?)", `liste-${k}`, s);
    row("INSERT INTO mk_segments (organization_id, name, definition, site_id) VALUES (1, ?, '{}', ?)", `seg-${k}`, s);
    row("INSERT INTO mk_templates (organization_id, name, site_id) VALUES (1, ?, ?)", `mod-${k}`, s);
    row("INSERT INTO mk_campaigns (organization_id, name, target_type, target_id, site_id) VALUES (1, ?, 'list', ?, ?)", `camp-${k}`, list, s);
    row("INSERT INTO mk_automations (organization_id, name, trigger_event, site_id) VALUES (1, ?, 'contact_created', ?)", `auto-${k}`, s);
    row("INSERT INTO mk_funnels (organization_id, name, site_id) VALUES (1, ?, ?)", `tun-${k}`, s);
    const page = row("INSERT INTO mk_landing_pages (organization_id, name, slug, title, status, site_id, created_by) VALUES (1, ?, ?, 't', 'draft', ?, NULL)", `page-${k}`, `pg-${k}`, s);
    // un événement de page vue par site (analytics) : événement du journal avec site
    m.bus.emit({ organizationId: 1, name: "form.submitted", email: `e-${k}@ex.fr`, siteId: s, idempotencyKey: `ev-${k}`, occurredAt: Date.now() });
  }
  ctxOf = (extra = {}) => ({ ...m.ctx(1), ...extra });
});

const letters = (names) => names.map((n) => n.split("-").pop()).sort().join("");

describe("visibility.js : permissions, sites cachés, fragment SQL", () => {
  test("seules les familles filtrées par R4 donnent une permission de lecture ; les autres ne sont jamais filtrées (comportement historique)", () => {
    for (const [perm, read] of [["lists.read", "lists.read"], ["lists.write", "lists.read"], ["campaigns.send", "campaigns.read"], ["campaigns.write", "campaigns.read"], ["segments.write", "segments.read"],
      ["templates.write", "templates.read"], ["automations.activate", "automations.read"], ["funnels.write", "funnels.read"], ["forms.write", "forms.read"], ["pages.publish", "forms.read"], ["analytics.read", "analytics.read"], ["tools.export", "tools.view"]]) {
      assert.equal(visibility.readPermissionOf(perm), read, perm);
    }
    for (const perm of ["users.manage_roles", "articles.write", "media.upload", "settings.write", "contacts.read", undefined, null, 5]) assert.equal(visibility.readPermissionOf(perm), null, String(perm));
  });
  test("hiddenSites : sans affectation de site, rien n'est caché (chemin rapide) ; avec des droits sur chaque site au moins égaux à l'équipe, rien non plus", () => {
    const calls = [];
    const effective = (userId, { siteId }) => { calls.push(siteId); return new Set(["lists.read"]); };
    assert.deepEqual(visibility.hiddenSites({ db, organizationId: 1, userId: 7, permission: "lists.read", effective }), []);
    assert.equal(calls.length, 0, "aucun calcul de droits sans affectation de site");
    db.prepare("INSERT INTO users (username, email) VALUES ('v1', 'v1@ex.fr')").run();
    const uid = Number(db.prepare("SELECT id FROM users WHERE username = 'v1'").get().id);
    db.prepare("INSERT INTO mk_site_members (site_id, user_id, role) VALUES (?, ?, 'viewer')").run(A, uid);
    assert.deepEqual(visibility.hiddenSites({ db, organizationId: 1, userId: uid, permission: "lists.read", effective }), []);
    assert.deepEqual(calls.sort(), [A, B].sort(), "un calcul par site, rien de plus");
  });
  test("hiddenSites : les sites où la lecture manque sont cachés, selon la permission de l'écran (écriture → lecture de la même famille)", () => {
    const uid = Number(db.prepare("SELECT id FROM users WHERE username = 'v1'").get().id);
    const effective = (userId, { siteId }) => new Set(siteId === B ? ["segments.read", "campaigns.read"] : ["lists.read", "segments.read", "campaigns.read"]);
    assert.deepEqual(visibility.hiddenSites({ db, organizationId: 1, userId: uid, permission: "lists.read", effective }), [B]);
    assert.deepEqual(visibility.hiddenSites({ db, organizationId: 1, userId: uid, permission: "lists.write", effective }), [B]);
    assert.deepEqual(visibility.hiddenSites({ db, organizationId: 1, userId: uid, permission: "segments.read", effective }), []);
    assert.deepEqual(visibility.hiddenSites({ db, organizationId: 1, userId: uid, permission: "settings.write", effective }), [], "famille non filtrée");
  });
  test("attach : posé pour l'équipe, retiré quand la liste est vide, jamais pour un accès limité à un site", () => {
    const uid = Number(db.prepare("SELECT id FROM users WHERE username = 'v1'").get().id);
    const effective = (userId, { siteId }) => new Set(siteId === B ? [] : ["lists.read"]);
    const req = { mk: { siteOnly: false, ctx: { db, organizationId: 1, userId: uid } } };
    visibility.attach(req, "lists.read", { effective });
    assert.deepEqual(req.mk.ctx.hiddenSites, [B]);
    visibility.attach(req, "lists.read", { effective: () => new Set(["lists.read"]) });
    assert.equal(req.mk.ctx.hiddenSites, undefined);
    const limited = { mk: { siteOnly: true, ctx: { db, organizationId: 1, userId: uid } } };
    visibility.attach(limited, "lists.read", { effective });
    assert.equal(limited.mk.ctx.hiddenSites, undefined);
  });
  test("notHiddenSql : fragment SQL et paramètres liés ; valeurs non entières ignorées", () => {
    assert.deepEqual(visibility.notHiddenSql(undefined, "x.site_id"), { sql: "1 = 1", params: [] });
    assert.deepEqual(visibility.notHiddenSql([], "x.site_id"), { sql: "1 = 1", params: [] });
    assert.deepEqual(visibility.notHiddenSql([3, 5], "x.site_id"), { sql: "(x.site_id IS NULL OR x.site_id NOT IN (?,?))", params: [3, 5] });
    assert.deepEqual(visibility.notHiddenSql(["1; DROP TABLE x"], "x.site_id"), { sql: "1 = 1", params: [] });
  });
});

describe("siteSql : combinaison avec le filtre d'affichage et l'accès limité", () => {
  test("sans site caché : exactement le comportement historique", () => {
    assert.deepEqual(siteSql({}, "l"), { sql: "1 = 1", params: [] });
    assert.deepEqual(siteSql({ siteFilter: "principal" }, "l"), { sql: "l.site_id IS NULL", params: [] });
    assert.deepEqual(siteSql({ siteFilter: 4 }, "l"), { sql: "l.site_id = ?", params: [4] });
    assert.deepEqual(siteSql({ siteScope: 4 }, "l"), { sql: "l.site_id = ?", params: [4] });
  });
  test("avec sites cachés : toujours exclus ; un accès limité n'est pas concerné", () => {
    assert.deepEqual(siteSql({ hiddenSites: [9] }, "l"), { sql: "(l.site_id IS NULL OR l.site_id NOT IN (?))", params: [9] });
    assert.deepEqual(siteSql({ hiddenSites: [9], siteFilter: 4 }, "l"), { sql: "l.site_id = ? AND (l.site_id IS NULL OR l.site_id NOT IN (?))", params: [4, 9] });
    assert.deepEqual(siteSql({ hiddenSites: [9], siteFilter: "principal" }, "l"), { sql: "l.site_id IS NULL AND (l.site_id IS NULL OR l.site_id NOT IN (?))", params: [9] });
    assert.deepEqual(siteSql({ hiddenSites: [9], siteScope: 4 }, "l"), { sql: "l.site_id = ?", params: [4] });
  });
});

describe("listes des modules : les éléments d'un site caché disparaissent, rien d'autre ne change", () => {
  const modules = {
    listes: (ctx) => audience.listLists(ctx).map((r) => r.name),
    campagnes: (ctx) => sending.listCampaigns(ctx).map((r) => r.name),
    "campagnes (recherche)": (ctx) => sending.searchCampaigns(ctx, {}, { page: 1, pageSize: 50 }).rows.map((r) => r.name),
    segments: (ctx) => segments.listSegments(ctx).map((r) => r.name),
    modeles: (ctx) => templates.listTemplates(ctx).map((r) => r.name),
    automatisations: (ctx) => automations.listAutomations(ctx).map((r) => r.name),
    tunnels: (ctx) => funnels.listFunnels(ctx).map((r) => r.name),
    pages: (ctx) => pages.listPages(ctx).map((r) => r.name),
    "pages (liste du CMS)": (ctx) => cmsPages.queryPages(ctx, {}).rows.map((r) => r.name),
  };
  // Les pages se filtrent par site avec leur propre paramètre (?site= → siteId), pas par ctx.siteFilter / ctx.siteScope (un accès limité n'atteint pas la liste des pages) :
  // seuls les sites cachés sont à vérifier pour elles.
  const ownSiteFilter = new Set(["pages", "pages (liste du CMS)"]);
  for (const [name, list] of Object.entries(modules)) {
    test(`${name} : témoin sans site caché = tous ; B caché = A et principal ; A et B cachés = principal ; filtre d'affichage + B caché ; accès limité inchangé`, () => {
      assert.equal(letters(list(ctxOf())), "ABM", "témoin non plafonné : comportement historique");
      assert.equal(letters(list(ctxOf({ hiddenSites: [B] }))), "AM");
      assert.equal(letters(list(ctxOf({ hiddenSites: [A, B] }))), "M");
      if (ownSiteFilter.has(name)) return;
      assert.equal(letters(list(ctxOf({ hiddenSites: [B], siteFilter: A }))), "A");
      assert.equal(letters(list(ctxOf({ hiddenSites: [B], siteFilter: B }))), "");
      assert.equal(letters(list(ctxOf({ hiddenSites: [B], siteFilter: "principal" }))), "M");
      assert.equal(letters(list(ctxOf({ siteScope: A, hiddenSites: [B] }))), "A", "un accès limité à un site garde sa portée");
    });
  }
  test("compteurs et auteurs de la liste des pages : les pages d'un site caché ne sont pas comptées", () => {
    assert.equal(cmsPages.queryPages(ctxOf(), {}).counts.toutes, 3);
    assert.equal(cmsPages.queryPages(ctxOf({ hiddenSites: [B] }), {}).counts.toutes, 2);
    assert.equal(cmsPages.queryPages(ctxOf({ hiddenSites: [B] }), {}).total, 2);
  });
  test("tests A/B : la liste d'une famille filtrée utilise le même mécanisme (aucune erreur, liste vide ici)", () => {
    assert.deepEqual(abtests.listTests(ctxOf({ hiddenSites: [B] })), []);
  });
  test("dépôt de données : le comptage et la liste excluent les sites cachés ; lecture par identifiant et écriture inchangées", () => {
    const repo = (h) => createRepository(db, 1, { hiddenSites: h }).table("mk_lists");
    assert.equal(repo([B]).list({ limit: 50 }).rows.length, 2);
    assert.equal(repo(undefined).list({ limit: 50 }).rows.length, 3);
    const listB = db.prepare("SELECT id FROM mk_lists WHERE site_id = ?").get(B).id;
    assert.ok(repo([B]).get(listB), "lecture par identifiant : déjà contrôlée par la portée de la route");
  });
});

describe("analytics : l'agrégat de l'organisation exclut les sites cachés", () => {
  test("événements du journal comptés par site : B caché → ni B ni son compteur ; témoin non plafonné inchangé", () => {
    const total = (ctx) => {
      const d = engine.dashboard(ctx, { range: "30d" });
      return JSON.stringify(d);
    };
    const all = total(ctxOf()), noB = total(ctxOf({ hiddenSites: [B] })), onlyB = total(ctxOf({ siteFilter: B }));
    assert.notEqual(all, noB, "l'agrégat change quand B est caché");
    assert.notEqual(noB, onlyB);
    assert.equal(total(ctxOf({ hiddenSites: [] })), all, "liste vide = comportement historique");
  });
});
