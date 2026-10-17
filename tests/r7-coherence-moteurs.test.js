// R7 (clôture) — COHÉRENCE TRANSVERSALE des moteurs secondaires (SMS, IA, réseaux sociaux, score, revenus) : au lieu de tests propres à chaque lot, une MATRICE sur toutes les routes réellement montées
// qui appartiennent à un module (siteModules.moduleOfPath), jouée par de vraies personnes (administrateur de site, éditeur, rôle sans droit, administrateur d'un autre site) sur un vrai serveur.
// Invariants vérifiés ensemble : (1) module désactivé → aucune de ces routes ne répond 200 à une personne limitée à un site (toutes méthodes) ; (2) module activé → seules les routes déclarées « site » répondent 200,
// les routes d'organisation (réglages, comptes, règles, recalcul…) restent fermées ; (3) aucune réponse 5xx ; (4) un autre site, même module activé chez lui, n'ouvre rien de plus ; (5) l'équipe garde l'accès.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { freshMarketing, TEST_KEY } = require("./marketing-helpers");
const { declaredFamily } = require("../src/marketing/web/routeScopes");
const { createMarketingRouters } = require("../src/marketing/web");
const modules = require("../src/marketing/siteModules");
const { startServer, loginInstructor, newStudent } = require("./helpers");

function expandRegexp(re) {
  let s = re.source.replace(/\\\//g, "/").replace(/^\^/, "").replace(/\$$/, "");
  s = s.replace(/\(\?:[^()]*(?:\([^()]*\)[^()]*)*\)\?/g, "").replace(/\/\?$/, "");
  const g = /\(([^()]*\|[^()]*)\)/.exec(s);
  return g ? g[1].split("|").map((alt) => s.replace(g[0], alt)) : [s];
}
const concrete = (p, id) => (p instanceof RegExp ? expandRegexp(p) : [String(p).replace(/:[A-Za-z]+(?:\([^)]*\))?/g, String(id))]);
const prefixOf = (layer) => {
  const src = layer.regexp && layer.regexp.source;
  if (!src || src === "^\\/?(?=\\/|$)") return "";
  return src.replace(/^\^/, "").replace(/\\\//g, "/").replace(/\(\?=\/\|\$\)$/, "").replace(/\/\?$/, "");
};
function engineRoutes() {
  const { db } = freshMarketing();
  const routers = createMarketingRouters({ db });
  const out = new Map();
  (function walk(stack, prefix) {
    for (const l of stack) {
      if (l.route) { for (const method of Object.keys(l.route.methods)) for (const p of [].concat(l.route.path)) for (const c of concrete(p instanceof RegExp ? p : prefix + p, 1)) if (modules.moduleOfPath(c)) out.set(`${method.toUpperCase()} ${c}`, { method: method.toUpperCase(), path: c, module: modules.moduleOfPath(c), scope: (declaredFamily(c) || {}).scope || "?" }); }
      else if (l.name === "router" && l.handle && l.handle.stack) walk(l.handle.stack, prefix + prefixOf(l));
    }
  })(routers.admin.stack, "");
  return [...out.values()];
}

describe("matrice transversale : toutes les routes de moteur × toutes les personnes × module activé ou non", () => {
  let srv, db, boss, A, B, adminA, editorA, adminB, readerA, routes;
  const one = (sql, ...a) => db.prepare(sql).get(...a);
  const idOf = (c) => one("SELECT id FROM users WHERE email = ?", c.email).id;
  const M = (site, mod) => `/marketing/site-web/sites/${site}/modules/${mod}`;
  const call = (c, r, site) => c.request(`/marketing${r.path}?site=${site}`, { method: r.method, ...(r.method === "GET" ? {} : { form: { site, site_id: site, name: "x", body: "x", event: "page.visited", points: "5" } }) });

  before(async () => {
    routes = engineRoutes();
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv); db = srv.db();
    const mk = async (name) => Number((await boss.post("/marketing/site-web/sites", { name })).location.match(/sites\/(\d+)/)[1]);
    A = await mk("Site Alpha"); B = await mk("Site Bravo");
    const member = async (site, role) => { const c = await newStudent(srv); db.prepare("INSERT INTO mk_site_members (site_id, user_id, role) VALUES (?, ?, ?)").run(site, idOf(c), role); return c; };
    adminA = await member(A, "admin"); editorA = await member(A, "editor"); adminB = await member(B, "admin");
    await boss.post("/marketing/site-web/utilisateurs/roles", { name: "Rien", description: "t", perm: ["forms.read"] });
    readerA = await member(A, one("SELECT key FROM mk_roles WHERE name = 'Rien'").key);
  });
  after(() => { db.close(); return srv.stop(); });

  test("énumération : les routes de chaque module sont bien trouvées (garde contre une matrice vide) et chacune est classée dans une famille", () => {
    const byModule = {}; for (const r of routes) byModule[r.module] = (byModule[r.module] || 0) + 1;
    for (const m of ["sms", "social", "scoring", "ai", "commerce"]) assert.ok(byModule[m] >= 2, `${m} : ${byModule[m]} route(s)`);
    assert.ok(routes.length >= 40, `${routes.length} routes de moteur`);
    assert.deepEqual(routes.filter((r) => r.scope === "?").map((r) => `${r.method} ${r.path}`), [], "toute route de moteur est déclarée dans une famille");
  });
  test("(1) modules désactivés : AUCUNE route de moteur ne répond 200 ni 5xx à une personne limitée, quelle que soit la méthode ou la personne", async () => {
    const bad = [];
    for (const c of [adminA, editorA, readerA, adminB]) for (const r of routes) { const x = await call(c, r, A); if (x.status === 200 || x.status >= 500) bad.push(`${r.method} ${r.path} -> ${x.status}`); }
    assert.deepEqual(bad, []);
  });
  test("(2) modules activés pour Alpha : seules les routes déclarées « site » s'ouvrent à son administrateur ; toutes les routes d'organisation restent fermées ; jamais de 5xx", async () => {
    for (const mod of modules.KEYS) if (modules.MODULES[mod].ready) assert.equal((await boss.post(M(A, mod), { etat: "activer" })).status, 302, mod);
    const opened = [], closedBroken = [], errors = [];
    for (const r of routes) {
      const x = await call(adminA, r, A);
      if (x.status >= 500) errors.push(`${r.method} ${r.path} -> ${x.status}`);
      if (r.scope === "organization" && x.status === 200) closedBroken.push(`${r.method} ${r.path}`);
      if (r.scope === "site" && r.method === "GET" && x.status === 200) opened.push(r.path);
    }
    assert.deepEqual(errors, []); assert.deepEqual(closedBroken, [], "route d'organisation ouverte à un accès limité");
    for (const p of ["/sms", "/reseaux", "/score", "/revenus", "/ia/etat"]) assert.ok(opened.includes(p), `${p} devrait s'ouvrir (module activé, route de site)`);
  });
  test("(3) un autre site (module non activé chez lui) ne gagne rien ; même activé chez lui, il n'ouvre ni les routes d'organisation ni les données d'Alpha ; le rôle sans droit reste refusé", async () => {
    const leaks = [];
    for (const r of routes) { const x = await call(adminB, r, A); if (x.status === 200) leaks.push(`${r.method} ${r.path} (site=A) -> 200`); const y = await call(adminB, r, B); if (y.status === 200) leaks.push(`${r.method} ${r.path} (site=B, module désactivé) -> 200`); }
    assert.deepEqual(leaks, []);
    for (const mod of modules.KEYS) if (modules.MODULES[mod].ready) await boss.post(M(B, mod), { etat: "activer" });
    const org = [];
    for (const r of routes.filter((x) => x.scope === "organization")) { const y = await call(adminB, r, B); if (y.status === 200) org.push(`${r.method} ${r.path}`); }
    assert.deepEqual(org, []);
    for (const r of routes.filter((x) => x.method === "GET")) assert.notEqual((await call(readerA, r, A)).status, 200, `rôle sans droit : ${r.path}`);
  });
  test("(4) l'équipe garde l'accès historique à tous les écrans de moteur (aucun 5xx), avec ou sans activation de site", async () => {
    const errors = [];
    for (const r of routes.filter((x) => x.method === "GET")) { const x = await boss.get(`/marketing${r.path}`); if (x.status >= 500) errors.push(`${r.path} -> ${x.status}`); }
    assert.deepEqual(errors, []);
    for (const p of ["/sms", "/reseaux", "/score", "/revenus", "/ia"]) assert.equal((await boss.get(`/marketing${p}`)).status, 200, p);
  });
  test("(5) désactiver les modules referme tout, sans rien supprimer", async () => {
    const tables = ["mk_sms_campaigns", "mk_social_posts", "mk_score_log", "mk_order_attributions", "mk_ai_requests"];
    const before = tables.map((t) => one(`SELECT COUNT(*) n FROM ${t}`).n);
    for (const site of [A, B]) for (const mod of modules.KEYS) if (modules.MODULES[mod].ready) await boss.post(M(site, mod), { etat: "desactiver" });
    for (const r of routes.filter((x) => x.method === "GET")) assert.notEqual((await call(adminA, r, A)).status, 200, r.path);
    assert.deepEqual(tables.map((t) => one(`SELECT COUNT(*) n FROM ${t}`).n), before);
  });
});
