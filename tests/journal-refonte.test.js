// Journal d'activité, refonte : libellés et niveaux déduits, filtres réels (période à l'heure de Paris, catégorie, acteur, niveau, site, recherche), pagination,
// détail, portée par site (accès direct par identifiant), export CSV (portée, neutralisation, trace), secrets, déconnexion de l'équipe tracée, performance sur volume.
const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const journal = require("../src/marketing/auditJournal");
const { startServer, loginInstructor, newStudent } = require("./helpers");

const TEST_KEY = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
const LOGS = "/marketing/site-web/outils/logs";
let srv, db, boss, A, B, adminA, adminB;
const one = (sql, ...a) => db.prepare(sql).get(...a);
const idOf = (c) => one("SELECT id FROM users WHERE email = ?", c.email).id;
const put = (action, { site = null, user = null, rt = "x", rid = "1", meta = "{}", at } = {}) =>
  Number(db.prepare("INSERT INTO mk_audit_logs (organization_id, user_id, action, resource_type, resource_id, metadata, site_id" + (at ? ", created_at" : "") + ") VALUES (1, ?, ?, ?, ?, ?, ?" + (at ? ", ?" : "") + ")").run(...[user, action, rt, rid, meta, site].concat(at ? [at] : [])).lastInsertRowid);

before(async () => {
  srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
  boss = await loginInstructor(srv); db = srv.db();
  A = Number((await boss.post("/marketing/site-web/sites", { name: "Site Alpha" })).location.match(/sites\/(\d+)/)[1]);
  B = Number((await boss.post("/marketing/site-web/sites", { name: "Site Bravo" })).location.match(/sites\/(\d+)/)[1]);
  adminA = await newStudent(srv); adminB = await newStudent(srv);
  db.prepare("INSERT INTO mk_site_members (site_id, user_id, role) VALUES (?, ?, 'admin')").run(A, idOf(adminA));
  db.prepare("INSERT INTO mk_site_members (site_id, user_id, role) VALUES (?, ?, 'admin')").run(B, idOf(adminB));
});
after(() => { db.close(); return srv.stop(); });

test("libellés et niveaux déduits : échec = alerte, droits = sensible, le reste = courant ; action inconnue lisible", () => {
  assert.equal(journal.labelOf("page.published"), "Page : publié");
  assert.equal(journal.labelOf("auth.login_failed"), "Échec de connexion");
  assert.equal(journal.labelOf("zz_inconnu.mystere_total"), "zz inconnu : mystere total");
  assert.equal(journal.levelOf("auth.login_failed"), "alert"); assert.equal(journal.levelOf("api_key.out_of_scope"), "alert"); assert.equal(journal.levelOf("page.schedule_failed"), "alert");
  assert.equal(journal.levelOf("user.role_changed"), "sensitive"); assert.equal(journal.levelOf("webhook.created"), "sensitive"); assert.equal(journal.levelOf("page.published"), "normal");
});

test("filtres réels : niveau, catégorie, acteur, recherche, n° d'événement ; chaque niveau est un tri exact de la base entière", () => {
  const ctx = { db, organizationId: 1 };
  const uid = idOf(adminA);
  const e1 = put("zz_cat.created", { user: uid, rid: "77" }); put("auth.login_failed", { rt: "auth" }); put("role.updated", { rt: "role" });
  const all = journal.list(ctx, {}).total;
  const sum = ["alert", "sensitive", "normal"].reduce((n, l) => n + journal.list(ctx, { niveau: l }).total, 0);
  assert.equal(sum, all, "alerte + sensible + courant = tout (aucune ligne perdue ni comptée deux fois)");
  assert.ok(journal.list(ctx, { niveau: "alert" }).rows.every((r) => r.level === "alert"));
  assert.ok(journal.list(ctx, { niveau: "normal", taille: 100 }).rows.every((r) => r.level === "normal"));
  assert.deepEqual(journal.list(ctx, { categorie: "zz_cat" }).rows.map((r) => r.id), [e1]);
  assert.equal(journal.list(ctx, { acteur: String(uid) }).total, 1);
  assert.equal(journal.list(ctx, { q: "77" }).rows[0].id, e1);
  assert.equal(journal.list(ctx, { q: `#${e1}` }).rows[0].id, e1);
  assert.equal(journal.list(ctx, { q: "%_\\" }).total, 0, "caractères spéciaux cherchés tels quels");
  assert.equal(journal.list(ctx, { niveau: "inconnu", categorie: "x'; DROP", acteur: "1 OR 1=1" }).total, all, "valeurs invalides ignorées, jamais concaténées");
});

test("période à l'heure de Paris : bornes du jour incluses, lendemain exclu", () => {
  const ctx = { db, organizationId: 1 };
  // 2026-03-10 23:30 UTC = 11 mars 00:30 à Paris (hiver : UTC+1)
  const late = put("zz_tz.event", { at: "2026-03-10 23:30:00", rid: "tz1" }), early = put("zz_tz.event", { at: "2026-03-10 22:59:00", rid: "tz2" });
  const day11 = journal.list(ctx, { categorie: "zz_tz", du: "2026-03-11", au: "2026-03-11" }).rows.map((r) => r.id);
  const day10 = journal.list(ctx, { categorie: "zz_tz", du: "2026-03-10", au: "2026-03-10" }).rows.map((r) => r.id);
  assert.deepEqual(day11, [late]); assert.deepEqual(day10, [early]);
});

test("acteur : compte supprimé et absence de compte sont dits tels quels (jamais « Système » par défaut)", () => {
  const ctx = { db, organizationId: 1 };
  const gone = put("zz_act.event", { user: 99999, rid: "g" }), none = put("zz_act.event", { rid: "n" });
  const rows = Object.fromEntries(journal.list(ctx, { categorie: "zz_act" }).rows.map((r) => [r.id, r]));
  assert.match(rows[gone].actor, /Compte supprimé \(n° 99999\)/); assert.match(rows[none].actor, /Aucun compte associé/); assert.doesNotMatch(rows[none].actor, /^Système$/);
});

test("détail : informations lisibles, secrets remasqués même dans d'anciennes lignes, événements liés de la même portée", () => {
  const ctx = { db, organizationId: 1 };
  const id = put("zz_det.updated", { rt: "form", rid: "5", meta: JSON.stringify({ name: "Contact", api_key: "sk_live_SECRET", nested: { password: "hunter2", ok: 1 } }) });
  put("zz_det.deleted", { rt: "form", rid: "5" });
  const e = journal.get(ctx, id);
  const text = JSON.stringify(e.meta);
  assert.ok(!text.includes("SECRET") && !text.includes("hunter2"));
  assert.ok(e.meta.some((m) => m.masked)); assert.equal(e.related.length, 1);
  assert.equal(journal.get(ctx, "1 OR 1=1"), null); assert.equal(journal.get(ctx, 99999999), null);
});

test("écran : liste, filtres actifs, détail avec retour conservant les filtres ; événement inexistant = 404", async () => {
  put("zz_ui.published", { rt: "landing", rid: "9" });
  const r = await boss.get(`${LOGS}?categorie=zz_ui&niveau=normal`);
  assert.equal(r.status, 200);
  assert.match(r.text, /zz ui : publié/); assert.match(r.text, /Filtres actifs/); assert.match(r.text, /aria-label="Retirer le filtre/);
  const id = Number(r.text.match(new RegExp(`${LOGS}/(\\d+)\\?`))[1]);
  const d = await boss.get(`${LOGS}/${id}?categorie=zz_ui&niveau=normal`);
  assert.equal(d.status, 200); assert.match(d.text, /Retour à la liste/); assert.match(d.text, /categorie=zz_ui/);
  assert.equal((await boss.get(`${LOGS}/99999999`)).status, 404);
  const empty = await boss.get(`${LOGS}?q=zzzz_introuvable_zzzz`);
  assert.match(empty.text, /Aucun événement ne correspond/); assert.match(empty.text, /Réinitialiser/);
});

test("accès direct par identifiant : un administrateur de site ne lit ni l'événement d'un autre site ni celui de l'organisation", async () => {
  const mine = put("zz_iso.alpha", { site: A }), other = put("zz_iso.bravo", { site: B }), org = put("zz_iso.org", { site: null });
  assert.equal((await adminA.get(`${LOGS}/${mine}?site=${A}`)).status, 200);
  for (const id of [other, org]) { const r = await adminA.get(`${LOGS}/${id}?site=${A}`); assert.equal(r.status, 404, `événement ${id}`); assert.doesNotMatch(r.text, /zz_iso\.(bravo|org)/); }
  assert.equal((await adminB.get(`${LOGS}/${mine}?site=${B}`)).status, 404);
  assert.equal((await adminB.get(`${LOGS}/${mine}?site=${A}`)).status, 403, "site non autorisé");
  const list = (await adminA.get(`${LOGS}?site=${A}&categorie=zz_iso`)).text;
  assert.match(list, /zz_iso\.alpha/); assert.doesNotMatch(list, /zz_iso\.(bravo|org)/);
  const csv = (await adminA.get(`${LOGS}/export.csv?site=${A}&categorie=zz_iso`)).text;
  assert.match(csv, /zz_iso\.alpha/); assert.doesNotMatch(csv, /zz_iso\.(bravo|org)/);
});

test("export CSV : mêmes filtres que l'écran, formules neutralisées, secrets absents, export tracé sans son contenu", async () => {
  put("zz_csv.created", { rt: "=cmd|calc", rid: "1", meta: JSON.stringify({ password: "monsecret", note: "+1" }) });
  const r = await boss.get(`${LOGS}/export.csv?categorie=zz_csv`);
  assert.equal(r.status, 200); assert.match(r.headers.get("content-type") || "", /text\/csv/); assert.match(r.headers.get("content-disposition") || "", /attachment/);
  assert.match(r.text, /Identifiant,Date \(UTC\),Niveau/); assert.match(r.text, /zz_csv\.created/);
  assert.ok(!r.text.includes("monsecret")); assert.match(r.text, /"'=cmd\|calc n° 1"/); assert.ok(!/(^|,)"=cmd/.test(r.text), "aucune cellule ne commence par =");
  const exported = db.prepare("SELECT * FROM mk_audit_logs WHERE action = 'audit.exported' ORDER BY id DESC").get();
  assert.ok(exported); assert.equal(JSON.parse(exported.metadata).rows, 1); assert.ok(!exported.metadata.includes("zz_csv.created"));
  const nothing = await adminA.get(`${LOGS}/export.csv?site=${A}`); assert.equal(nothing.status, 200);
});

test("la déconnexion d'un compte de l'équipe est tracée ; celle d'un élève ne l'est pas", async () => {
  const before = one("SELECT COUNT(*) n FROM mk_audit_logs WHERE action = 'auth.logout'").n;
  const e = await newStudent(srv); await e.post("/deconnexion", {});
  assert.equal(one("SELECT COUNT(*) n FROM mk_audit_logs WHERE action = 'auth.logout'").n, before, "élève : pas de ligne");
  const team = await loginInstructor(srv); await team.post("/deconnexion", {});
  assert.equal(one("SELECT COUNT(*) n FROM mk_audit_logs WHERE action = 'auth.logout'").n, before + 1);
});

test("écriture seule toujours garantie par la base, et nouveaux index présents", () => {
  assert.throws(() => db.prepare("UPDATE mk_audit_logs SET action = 'x.y' WHERE id = 1").run(), /lecture seule/);
  assert.throws(() => db.prepare("DELETE FROM mk_audit_logs WHERE id = 1").run(), /lecture seule/);
  const idx = db.prepare("SELECT name FROM sqlite_master WHERE type = 'index' AND tbl_name = 'mk_audit_logs'").all().map((r) => r.name);
  for (const n of ["idx_mk_audit_created", "idx_mk_audit_action", "idx_mk_audit_user"]) assert.ok(idx.includes(n), n);
});

test("volume : 30 000 événements, pages et filtres restent rapides et utilisent les index", () => {
  const ctx = { db, organizationId: 1 };
  db.exec("BEGIN"); const ins = db.prepare("INSERT INTO mk_audit_logs (organization_id, user_id, action, resource_type, resource_id, metadata, created_at) VALUES (1, ?, ?, 'v', ?, '{}', datetime('now', ?))");
  for (let i = 0; i < 30000; i++) ins.run(i % 7 ? null : 1, `zz_vol.step_${i % 9}`, String(i), `-${i % 4000} minutes`);
  db.exec("COMMIT");
  const t = (fn) => { const s = process.hrtime.bigint(); fn(); return Number(process.hrtime.bigint() - s) / 1e6; };
  const ms = [t(() => journal.list(ctx, {})), t(() => journal.list(ctx, { categorie: "zz_vol", page: "300" })), t(() => journal.list(ctx, { acteur: "1" })), t(() => journal.list(ctx, { du: "2026-01-01", au: "2099-01-01", niveau: "alert" }))];
  console.log("durées (ms) :", ms.map((x) => x.toFixed(1)).join(" · "));
  assert.ok(Math.max(...ms) < 1500, `trop lent : ${ms}`);
  const plan = db.prepare("EXPLAIN QUERY PLAN SELECT * FROM mk_audit_logs l WHERE l.organization_id = 1 AND l.user_id = 1 ORDER BY l.id DESC LIMIT 50").all().map((r) => r.detail).join(" ");
  assert.match(plan, /idx_mk_audit/);
});
