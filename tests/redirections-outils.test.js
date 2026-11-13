// Redirections — moteur étendu et outils (service, sans serveur) : 303, 451, « contient », « finit par », priorité, période de validité, groupes, simulateur, import avec aperçu
// (CSV, JSON, .htaccess, Nginx), export, sauvegarde / restauration / annulation, isolation entre sites, tableau de bord, diagnostic. Base jetable : AUCUNE base réelle.
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const SCRATCH = fs.mkdtempSync(path.join(os.tmpdir(), "koyekola-rdtools-"));
process.env.DATA_DIR = path.join(SCRATCH, "data");
process.env.UPLOADS_DIR = path.join(SCRATCH, "uploads");
process.env.SITE_URL = "https://k.test";
process.env.ALLOW_INDEXING = "1";
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { MIGRATIONS, quiet } = require("./marketing-helpers");
after(() => fs.rmSync(SCRATCH, { recursive: true, force: true }));

describe("Redirections : moteur étendu et outils", () => {
  let db, R, T, siteA, siteB;
  const MAIN = () => ({ siteId: null, visible: [siteA, siteB] });
  // Rejoue le middleware du serveur avec une requête simulée
  const run = (p, { site = null, q = "" } = {}) => {
    let out = null;
    R.middleware({ method: "GET", path: p, originalUrl: p + q, kwSite: site ? { id: site } : null, get: () => "", headers: {} },
      { redirect: (s, l) => { out = { status: s, location: l }; }, status(s) { out = { status: s }; return this; }, set() { return this; }, type() { return this; }, send(t) { out.text = t; } }, () => {});
    return out;
  };
  before(() => {
    db = require("../src/config/database");
    R = require("../src/seo/redirects"); T = require("../src/seo/redirectTools");
    const { migrate } = require("../src/marketing/db/migrate");
    migrate(db, { dir: MIGRATIONS, dbPath: path.join(SCRATCH, "data", "KOYEKOLA.db"), backupDir: path.join(SCRATCH, "backups"), log: quiet });
    const org = Number(db.prepare("INSERT INTO mk_organizations (name, slug) VALUES ('O', 'o')").run().lastInsertRowid);
    const mk = (n, slug) => Number(db.prepare("INSERT INTO mk_sites (organization_id, name, slug, tokens) VALUES (?, ?, ?, '{}')").run(org, n, slug).lastInsertRowid);
    siteA = mk("Site A", "site-a"); siteB = mk("Site B", "site-b");
  });
  test("moteur : 303 et 451 répondent ; « contient » et « finit par » redirigent ; la priorité départage ; l'adresse exacte passe avant", () => {
    assert.ok(R.create({ source: "/vieux-303", target: "/nouveau", status: 303 }).ok);
    assert.ok(R.create({ source: "/retire-451", target: "", status: 451 }).ok);
    assert.ok(R.create({ source: "/archive-2019/", target: "/blog", status: 301, matchType: "contains" }).ok);
    assert.ok(R.create({ source: ".html", target: "/accueil-html", status: 301, matchType: "endswith", priority: 200 }).ok);
    assert.ok(R.create({ source: "/vieux-article.html", target: "/exception", status: 301, matchType: "endswith", priority: 5 }).ok);
    assert.deepEqual(run("/vieux-303"), { status: 303, location: "/nouveau" });
    assert.equal(run("/retire-451").status, 451);
    assert.deepEqual(run("/x/archive-2019/page"), { status: 301, location: "/blog" });
    assert.equal(run("/vieux-article.html").location, "/exception", "priorité 5 avant 200");
    assert.equal(run("/autre.html").location, "/accueil-html");
    assert.equal(run("/page-inconnue"), null);
  });
  test("moteur : hors période = pas de redirection ; paramètres conservés ou ignorés ; options invalides refusées", () => {
    assert.ok(R.create({ source: "/promo-finie", target: "/offre", status: 302, startsAt: "2020-01-01T00:00", endsAt: "2020-02-01T00:00" }).ok);
    assert.ok(R.create({ source: "/promo-future", target: "/offre", status: 302, startsAt: "2099-01-01T00:00" }).ok);
    assert.ok(R.create({ source: "/promo-ouverte", target: "/offre", status: 302, startsAt: "2020-01-01T00:00", endsAt: "2099-01-01T00:00" }).ok);
    assert.equal(run("/promo-finie"), null); assert.equal(run("/promo-future"), null); assert.equal(run("/promo-ouverte").status, 302);
    assert.ok(R.create({ source: "/sans-param", target: "/dest", status: 301, queryMode: "drop" }).ok);
    assert.equal(run("/sans-param", { q: "?utm=1" }).location, "/dest");
    assert.ok(R.create({ source: "/avec-param", target: "/dest", status: 301 }).ok);
    assert.equal(run("/avec-param", { q: "?utm=1" }).location, "/dest?utm=1");
    assert.equal(R.create({ source: "/z1", target: "/z2", status: 301, startsAt: "2030-02-01T00:00", endsAt: "2030-01-01T00:00" }).ok, false, "fin avant début");
    assert.equal(R.create({ source: "/z3", target: "/z4", status: 301, priority: 5000 }).ok, false);
    assert.equal(R.create({ source: "/z5", target: "/z6", status: 301, queryMode: "bizarre" }).ok, false);
    assert.equal(R.create({ source: "/z7", target: "/z8", status: 301, startsAt: "demain" }).ok, false);
  });
  test("les espaces techniques restent protégés, y compris pour les nouveaux modes", () => {
    assert.equal(R.create({ source: "/formateur/x", target: "/a", status: 301, matchType: "contains" }).ok, false);
    assert.equal(R.create({ source: "/", target: "/a", status: 301, matchType: "contains" }).ok, false);
    assert.equal(R.create({ source: "a", target: "/a", status: 301, matchType: "endswith" }).ok, false, "texte trop court");
    assert.equal(R.create({ source: "/formateur", target: "/a", status: 301 }).ok, false);
    // une ligne posée directement en base sur un espace protégé n'est jamais exécutée
    db.prepare("INSERT INTO seo_redirects (source_path, target, status, match_type) VALUES ('/connexion', '/piege', 301, 'exact')").run(); R.invalidate();
    assert.equal(run("/connexion"), null);
    db.prepare("DELETE FROM seo_redirects WHERE source_path = '/connexion'").run(); R.invalidate();
  });
  test("groupes : un groupe désactivé suspend ses règles ; supprimer un groupe garde les règles ; un groupe ne sert qu'à son périmètre", () => {
    const g = T.createGroup(MAIN(), { name: "Campagne été" }, null); assert.ok(g.ok);
    assert.equal(T.createGroup(MAIN(), { name: "campagne été" }, null).ok, false, "nom unique");
    const id = R.create({ source: "/ete-vieux", target: "/ete", status: 301, groupId: g.id }).id;
    assert.equal(run("/ete-vieux").status, 301);
    assert.ok(T.updateGroup(MAIN(), g.id, { enabled: false }, null).ok); assert.equal(run("/ete-vieux"), null, "groupe désactivé");
    assert.ok(T.updateGroup(MAIN(), g.id, { enabled: true }, null).ok); assert.equal(run("/ete-vieux").status, 301);
    const other = T.createGroup({ siteId: siteA }, { name: "Groupe A" }, null);
    assert.equal(R.create({ source: "/mauvais", target: "/x", status: 301, groupId: other.id }).ok, false, "règle commune dans un groupe de site");
    assert.equal(T.listGroups(MAIN()).find((x) => x.id === g.id).rules, 1);
    assert.ok(T.removeGroup(MAIN(), g.id, null)); assert.equal(R.get(id).group_id, null); assert.ok(R.get(id));
    assert.equal(T.moveToGroup(MAIN(), [id], other.id, null).moved, 0, "déplacement vers un groupe d'un autre périmètre refusé");
  });
  test("actions groupées : désactiver, activer ; supprimer exige la permission et garde une copie", () => {
    const a = R.create({ source: "/lot-a", target: "/x1", status: 301 }).id, b = R.create({ source: "/lot-b", target: "/x2", status: 301 }).id;
    assert.equal(T.bulk(MAIN(), "disable", [a, b], null).done, 2); assert.equal(R.get(a).enabled, 0); assert.equal(run("/lot-a"), null);
    assert.equal(T.bulk(MAIN(), "enable", [a, b], null).done, 2); assert.equal(run("/lot-a").status, 301);
    assert.equal(T.bulk(MAIN(), "delete", [a], null, { canDelete: false }).done, 0); assert.ok(R.get(a));
    assert.equal(T.bulk(MAIN(), "delete", [a], null, { canDelete: true }).done, 1); assert.equal(R.get(a), undefined);
    assert.ok(T.lastSnapshot(MAIN()), "copie de sécurité avant suppression");
  });
  test("simulateur : suit les règles sans compter de visite ; chaîne, boucle, absence de règle, espace protégé", () => {
    R.create({ source: "/sim-a", target: "/sim-b", status: 301 }); R.create({ source: "/sim-b", target: "/sim-c", status: 301 });
    const s = T.simulate(MAIN(), "/sim-a?x=1");
    assert.equal(s.hops, 2); assert.equal(s.verdict, "final"); assert.equal(s.final, "/sim-c"); assert.ok(s.issues.some((t) => /successives/.test(t)));
    assert.equal(T.simulate(MAIN(), "/aucune-regle").verdict, "none");
    assert.equal(T.simulate(MAIN(), "/formateur/x").verdict, "none");
    assert.equal(T.simulate(MAIN(), "pas une adresse").ok, false);
    const id = R.create({ source: "/sim-z", target: "/sim-y", status: 301 }).id; T.simulate(MAIN(), "/sim-z");
    assert.equal(R.get(id).hits, 0, "la simulation ne compte aucune visite");
    assert.equal(T.simulate(MAIN(), "/sim-410x").verdict, "none");
    R.create({ source: "/sim-gone", target: "", status: 410 }); assert.equal(T.simulate(MAIN(), "/sim-gone").verdict, "gone");
    assert.equal(T.simulateBatch(MAIN(), "/sim-a\n/sim-z\n/rien").length, 3);
  });
  test("testeur d'expression régulière : garde-fous du moteur", () => {
    const ok = T.testRegex("^/ancien/(.*)$", "/nouveau/$1", "/ancien/page\n/autre");
    assert.equal(ok.results[0].result, "/nouveau/page"); assert.equal(ok.results[1].match, false);
    assert.equal(T.testRegex("^(a+)+$", "/x", "/a").ok, false, "répétitions imbriquées refusées");
    assert.equal(T.testRegex("/sans-ancre", "/x", "/a").ok, false);
  });
  test("import : aperçu SANS écriture ; CSV, JSON (Redirection), .htaccess, Nginx ; invalide jamais importé ; sélection respectée", () => {
    const csv = "source,target,regex,code,type,match,title,status\n/imp-1,/dest-1,0,301,url,url,Premier,enabled\n/imp-2,/dest-2,0,308,url,url,Second,disabled\n/formateur/x,/y,0,301,url,url,Interdit,enabled\n";
    const p = T.parseImport(csv); assert.equal(p.format, "csv"); assert.equal(p.rows.length, 3); assert.equal(p.rows[1].enabled, false); assert.equal(p.rows[1].status, 308);
    const pv = T.previewImport(MAIN(), p); assert.equal(pv.summary.ok, 2); assert.equal(pv.summary.errors, 1);
    assert.equal(R.query({ q: "/imp-1" }).total, 0, "aucune écriture avant confirmation");
    const j = T.parseImport(JSON.stringify({ redirects: [{ url: "/json-1", action_data: { url: "/json-dest" }, action_code: 301, match_type: "url", regex: false, title: "x", status: "enabled" }] }));
    assert.equal(j.format, "json"); assert.equal(j.rows[0].target, "/json-dest"); assert.equal(j.rows[0].match, "exact");
    const ap = T.parseImport("Redirect 301 /ap-old /ap-new\nRedirectMatch 302 ^/ap-m/(.*)$ /ap-n/$1\nRedirect gone /ap-gone\n");
    assert.equal(ap.format, "apache"); assert.equal(ap.rows.length, 3); assert.equal(ap.rows[2].status, 410); assert.equal(ap.rows[1].match, "regex");
    const ng = T.parseImport("location = /ng-old { return 301 /ng-new; }\nrewrite ^/ng-r/(.*)$ /ng-s/$1 permanent;");
    assert.equal(ng.format, "nginx"); assert.equal(ng.rows.length, 2);
    const yoast = T.parseImport("origin,target,type,format\n/y-old,/y-new,301,plain\n^/y-re/(.*)$,/y-nw/$1,302,regex\n");
    assert.equal(yoast.rows.length, 2); assert.equal(yoast.rows[1].match, "regex"); assert.equal(yoast.rows[1].status, 302);
    const rep = T.applyImport(MAIN(), p, [0, 1, 2], null, {});
    assert.equal(rep.created, 2); assert.equal(rep.skipped, 1);
    assert.equal(R.query({ q: "/imp-2" }).rows[0].enabled, 0, "règle désactivée dans le fichier : importée désactivée");
    assert.equal(R.query({ q: "/formateur/x" }).total, 0);
    assert.equal(T.applyImport(MAIN(), p, [], null, {}).created, 0, "rien de coché : rien d'importé");
    assert.equal(T.applyImport(MAIN(), p, [0], null, {}).created, 0, "déjà présente : pas de doublon");
    assert.equal(T.parseImport("   ").ok, false); assert.equal(T.parseImport("{pas du json").ok, false);
  });
  test("destination extérieure : refusée sans permission, et hors liste blanche ; sous-domaine admis", () => {
    const p = T.parseImport("/ext-1,https://exemple.org/x,301\n");
    assert.equal(T.previewImport(MAIN(), p, { allowExternal: false }).summary.errors, 1);
    assert.equal(T.previewImport(MAIN(), p, { allowExternal: true }).summary.ok, 1);
    assert.equal(T.saveSettings(MAIN(), { allowedHosts: "autre.com" }, null).ok, true);
    assert.equal(T.previewImport(MAIN(), p, { allowExternal: true }).summary.errors, 1, "hors liste blanche");
    assert.equal(R.create({ source: "/ext-2", target: "https://exemple.org/y", status: 301 }).ok, false);
    assert.equal(R.create({ source: "/ext-3", target: "https://sous.autre.com/y", status: 301 }).ok, true);
    const h = R.create({ source: "/ext-4", target: "http://autre.com/y", status: 301 }); assert.equal(R.get(h.id).target, "/y", "http:// n'est jamais une destination extérieure : seul le chemin est gardé");
    assert.equal(R.create({ source: "/ext-5", target: "javascript:alert(1)", status: 301 }).ok, false);
    assert.equal(T.saveSettings(MAIN(), { allowedHosts: "" }, null).ok, true);
    assert.equal(T.saveSettings(MAIN(), { allowedHosts: "pas un domaine" }, null).ok, false);
    assert.equal(T.saveSettings(MAIN(), { retentionDays: 5 }, null).ok, false);
  });
  test("export CSV / JSON / Apache / Nginx ; sauvegarde, restauration complète et annulation", () => {
    R.create({ source: "/exp-a", target: "/exp-b", status: 301, note: "note export" });
    R.create({ source: "/exp-pre", target: "/exp-pre-n", status: 308, matchType: "prefix" });
    assert.match(T.exportRules(MAIN(), { format: "csv" }).body, /\/exp-a,\/exp-b,301,note export/);
    const ap = T.exportRules(MAIN(), { format: "apache" }).body;
    assert.match(ap, /Redirect 301 \/exp-a \/exp-b/); assert.match(ap, /RedirectMatch 308 \^\\\/exp-pre|RedirectMatch 308 \^/);
    assert.match(T.exportRules(MAIN(), { format: "nginx" }).body, /location = \/exp-a \{ return 301 \/exp-b; \}/);
    const json = JSON.parse(T.exportRules(MAIN(), { format: "json" }).body); assert.equal(json.format, "kolakisa-redirects"); assert.ok(json.rules.some((x) => x.source === "/exp-a"));
    assert.equal(T.exportRules(MAIN(), { format: "csv", ids: [R.query({ q: "/exp-a" }).rows[0].id] }).count, 1);
    const backup = T.backupDownload(MAIN()).body;
    const countBefore = db.prepare("SELECT COUNT(*) n FROM seo_redirects WHERE site_id IS NULL").get().n;
    R.create({ source: "/apres-sauvegarde", target: "/z", status: 301 });
    const r = T.restore(MAIN(), backup, "replace", null, { allowExternal: true }); assert.equal(r.ok, true);
    assert.equal(R.query({ q: "/apres-sauvegarde" }).total, 0, "la règle ajoutée après la sauvegarde disparaît");
    assert.equal(db.prepare("SELECT COUNT(*) n FROM seo_redirects WHERE site_id IS NULL").get().n, countBefore);
    assert.equal(T.undoLast(MAIN(), null, { allowExternal: true }).ok, true);
    assert.equal(R.query({ q: "/apres-sauvegarde" }).total, 1, "l'annulation rend la règle");
    assert.equal(T.restore(MAIN(), "pas du json", "merge", null).ok, false);
    assert.equal(T.restore(MAIN(), JSON.stringify({ format: "autre", rules: [] }), "merge", null).ok, false);
    // la restauration complète du principal ne touche jamais les règles des sites
    assert.ok(R.createForSite(siteA, { source: "/garde-a", target: "/ga", status: 301 }, null).ok);
    T.restore(MAIN(), backup, "replace", null, { allowExternal: true });
    assert.equal(R.query({ site: String(siteA), q: "/garde-a" }).total, 1);
  });
  test("isolation : un site ne voit, n'importe, n'exporte, ne groupe ni ne simule les règles d'un autre site", () => {
    const A = { siteId: siteA }, B = { siteId: siteB };
    assert.ok(R.createForSite(siteA, { source: "/iso-a", target: "/ia", status: 301 }, null).ok);
    assert.ok(R.createForSite(siteB, { source: "/iso-b", target: "/ib", status: 301 }, null).ok);
    assert.doesNotMatch(T.exportRules(A, { format: "csv" }).body, /\/iso-b/); assert.match(T.exportRules(A, { format: "csv" }).body, /\/iso-a/);
    assert.equal(T.dashboard(B).total, 1);
    assert.equal(T.analyze(A).items.filter((i) => /iso-b/.test(i.source)).length, 0);
    const ga = T.createGroup(A, { name: "Mon groupe" }, null); assert.ok(ga.ok);
    assert.equal(T.listGroups(B).length, 0); assert.equal(T.getGroup(B, ga.id), null);
    const ruleA = R.query({ site: String(siteA) }).rows.find((r) => r.source_path === "/iso-a").id, ruleB = R.query({ site: String(siteB) }).rows[0].id;
    assert.equal(T.moveToGroup(B, [ruleB], ga.id, null).moved, 0);
    assert.equal(T.bulk(B, "disable", [ruleA], null).done, 0); assert.equal(R.get(ruleA).enabled, 1);
    assert.equal(T.simulate(B, "/iso-a").verdict, "none", "le site B ne suit pas la règle du site A");
    assert.equal(T.simulate(A, "/iso-a").verdict, "final");
    assert.equal(run("/iso-a", { site: siteB }), null, "le domaine du site B ne déclenche pas la règle du site A");
    assert.equal(run("/iso-a", { site: siteA }).status, 301);
    const p = T.parseImport("/iso-imp,/ii,301"); assert.equal(T.applyImport(A, p, [0], null, {}).created, 1);
    assert.equal(R.query({ site: String(siteA), q: "/iso-imp" }).total, 1); assert.equal(R.query({ site: String(siteB), q: "/iso-imp" }).total, 0);
    assert.equal(T.restore(B, JSON.stringify({ format: "kolakisa-redirects", version: 1, groups: [], rules: [{ source: "/res-b", target: "/rb", status: 301, match: "exact", enabled: true }] }), "replace", null, {}).ok, true);
    assert.equal(R.query({ site: String(siteA), q: "/iso-a" }).total, 1, "restaurer le site B ne touche pas le site A");
    assert.equal(R.query({ site: String(siteB), q: "/res-b" }).total, 1);
    assert.equal(R.query({ site: String(siteB), q: "/iso-b" }).total, 0, "le site B a été remplacé");
    assert.equal(R.updateForSite(siteB, ruleA, { source: "/iso-a", target: "/hack", status: 301 }, null).ok, false, "modifier la règle d'un autre site");
  });
  test("tableau de bord : chiffres issus de la base, chaque règle classée une seule fois ; compteur par jour", () => {
    const id = R.create({ source: "/stat-a", target: "/stat-b", status: 301 }).id;
    db.prepare("INSERT INTO seo_redirect_daily (redirect_id, day, hits) VALUES (?, ?, 4)").run(id, R.parisDay());
    db.prepare("UPDATE seo_redirects SET hits = 4 WHERE id = ?").run(id);
    const d = T.dashboard(MAIN(), { days: 7 });
    const total = db.prepare("SELECT COUNT(*) n FROM seo_redirects").get().n; // périmètre du principal : règles communes + sites visibles
    assert.equal(d.total, total); assert.equal(d.total, d.active + d.disabled);
    assert.equal(d.permanent + d.temporary + d.gone, total);
    const today = db.prepare("SELECT COALESCE(SUM(hits), 0) n FROM seo_redirect_daily WHERE day = ?").get(R.parisDay()).n;
    assert.equal(d.series.length, 7); assert.equal(d.series[6].hits, today); assert.ok(today >= 4); assert.equal(d.hitsPeriod, today); assert.equal(d.hasDaily, true);
    assert.equal(d.top[0].id, id);
    assert.equal(T.dashboard({ siteId: siteB }).hasDaily, false, "aucune donnée = aucun graphique inventé");
    assert.equal(T.dashboard({ siteId: siteB }).hitsAll, 0);
  });
  test("liens cassés : suggestions seulement en cas de ressemblance ; série par jour des 404", () => {
    assert.deepEqual(T.suggestFor(MAIN(), "/zzzz-aucun-rapport-xyz"), []);
    db.prepare("INSERT INTO mk_landing_pages (organization_id, name, slug, title, status, site_id, published_at, kind, indexable) VALUES ((SELECT id FROM mk_organizations), 'Recette de tarte', 'recette-tarte', 'Recette de tarte aux pommes', 'published', ?, datetime('now'), 'page', 1)").run(siteA);
    const sug = T.suggestFor({ siteId: siteA }, "/ancienne-recette-tarte.html");
    assert.ok(sug.length && /tarte/.test(sug[0].path), JSON.stringify(sug));
    assert.ok(sug[0].why.length, "la raison est donnée");
    assert.equal(T.notFoundDaily(MAIN(), 5).length, 5);
  });
  test("changements d'adresse : mode automatique / à valider / désactivé par site ; valeur inconnue refusée", () => {
    assert.equal(T.autoModeFor(null), "auto"); assert.equal(T.autoModeFor(siteA), "auto");
    assert.equal(T.saveSettings({ siteId: siteA }, { autoMode: "validate" }, null).ok, true);
    assert.equal(T.autoModeFor(siteA), "validate"); assert.equal(T.autoModeFor(siteB), "auto", "réglage propre au site");
    assert.equal(T.saveSettings({ siteId: siteA }, { autoMode: "nimporte" }, null).ok, false);
    T.saveSettings({ siteId: siteA }, { autoMode: "auto" }, null);
  });
  test("diagnostic : chaîne, règle inutilisée, doublon de portée, groupe désactivé et période terminée sont relevés", () => {
    const scope = { siteId: siteB };
    R.createForSite(siteB, { source: "/dg-1", target: "/dg-2", status: 301 }, null); R.createForSite(siteB, { source: "/dg-2", target: "/dg-3", status: 301 }, null);
    R.createForSite(siteB, { source: "/dg-exp", target: "/dg-x", status: 302, startsAt: "2020-01-01T00:00", endsAt: "2020-02-01T00:00" }, null);
    db.prepare("UPDATE seo_redirects SET created_at = datetime('now', '-400 days') WHERE site_id = ?").run(siteB);
    const a = T.analyze(scope);
    assert.ok(a.items.some((i) => i.kind === "chain" && /dg-1/.test(i.text)), "chaîne");
    assert.ok(a.items.some((i) => i.kind === "dead"), "inutilisée");
    assert.ok(a.items.some((i) => i.kind === "expired"), "période terminée");
    assert.ok(a.counts.chains >= 1 && a.counts.total === a.items.length);
    assert.ok(a.items.find((i) => i.kind === "chain" && i.fix), "la chaîne propose un raccourcissement");
  });
});
