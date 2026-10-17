// R7 (lot 6.2) — Assistant IA multisite : migration 086 (consommation attribuée au site, transition explicite du studio de pages), module « ai » requis, quota COMMUN, secrets,
// routes ouvertes aux sites. Client factice (service) et faux serveur d'API local avec le vrai SDK (parcours HTTP) : aucune vraie demande à Anthropic.
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const http = require("node:http");
const { test, describe, before, after, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const { DatabaseSync } = require("node:sqlite");
const { migrate } = require("../src/marketing/db/migrate");
const { freshMarketing, TEST_KEY, MIGRATIONS, quiet } = require("./marketing-helpers");
const aiCore = require("../src/services/aiCore");
const ai = require("../src/marketing/ai");
const modules = require("../src/marketing/siteModules");
const { startServer, loginInstructor, newStudent } = require("./helpers");

const NOW = Date.UTC(2026, 9, 5, 12);
const rows = (db, sql, ...a) => db.prepare(sql).all(...a).map((r) => ({ ...r }));

describe("migration 086 + transition unique : colonne ajoutée, historique sans site, accès IA préservé seulement là où il existait", () => {
  const transitions = require("../src/marketing/transitions");
  // Base d'avant 086 (vraies migrations < 086), avec deux organisations, des comptes et des sites de tous les cas
  const avant = () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "mig86-"));
    for (const f of fs.readdirSync(MIGRATIONS)) if (f < "086") fs.copyFileSync(path.join(MIGRATIONS, f), path.join(dir, f));
    const db = new DatabaseSync(":memory:"); db.exec("PRAGMA foreign_keys = ON");
    db.exec("CREATE TABLE users (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT, email TEXT, password_hash TEXT DEFAULT 'x', role TEXT NOT NULL DEFAULT 'etudiant', status TEXT DEFAULT 'active', created_at TEXT DEFAULT (datetime('now')))");
    migrate(db, { dir, dbPath: ":memory:", log: quiet });
    fs.rmSync(dir, { recursive: true, force: true });
    for (let i = 1; i <= 9; i++) db.prepare("INSERT INTO users (id, username, email) VALUES (?, ?, ?)").run(i, `u${i}`, `u${i}@x.fr`);
    db.exec("UPDATE users SET status = 'suspended' WHERE id = 6");
    db.exec("INSERT INTO mk_organizations (name, slug) VALUES ('A', 'a'), ('B', 'b')");
    const site = (org, name, extra = "") => { const r = db.prepare("INSERT INTO mk_sites (organization_id, name, slug, tokens) VALUES (?, ?, ?, '{}')").run(org, name, name.toLowerCase().replace(/\W/g, "")); if (extra) db.exec(`UPDATE mk_sites SET ${extra} WHERE id = ${r.lastInsertRowid}`); return Number(r.lastInsertRowid); };
    const member = (siteId, userId, role) => db.prepare("INSERT INTO mk_site_members (site_id, user_id, role) VALUES (?, ?, ?)").run(siteId, userId, role);
    return { db, site, member };
  };
  const enabled = (db) => rows(db, "SELECT site_id FROM mk_site_modules WHERE module = 'ai' AND enabled = 1 ORDER BY site_id").map((r) => r.site_id);

  test("C1/C2/C7 : accès préservé pour la preuve réelle (éditeur actif hors équipe, rôle personnalisé avec forms.write) ; rien pour les simples présences, sites vides, archivés, supprimés, comptes suspendus, membres de l'équipe", () => {
    const { db, site, member } = avant();
    db.exec("INSERT INTO mk_org_members (organization_id, user_id, role) VALUES (1, 5, 'editor'), (1, 9, 'viewer')");
    db.exec("INSERT INTO mk_roles (organization_id, key, name, permissions) VALUES (1, 'redacteur', 'Rédacteur', '[\"forms.write\",\"forms.read\"]'), (1, 'lecteurplus', 'Lecteur plus', '[\"forms.read\"]'), (2, 'redacteur', 'Rédacteur B', '[]')");
    const s = {
      editeur: site(1, "Editeur"), personnalise: site(1, "Personnalise"), lecteur: site(1, "Lecteur"), auteur: site(1, "Auteur"), contributeur: site(1, "Contributeur"),
      roleSansDroit: site(1, "RoleSansDroit"), suspendu: site(1, "Suspendu"), equipe: site(1, "Equipe"), vide: site(1, "Vide"), archive: site(1, "Archive", "status = 'archived'"),
      supprime: site(1, "Supprime", "deleted_at = datetime('now')"), autreOrg: site(2, "AutreOrg"),
    };
    member(s.editeur, 1, "editor"); member(s.personnalise, 2, "redacteur"); member(s.lecteur, 3, "viewer"); member(s.auteur, 4, "author"); member(s.contributeur, 4, "contributor");
    member(s.roleSansDroit, 2, "lecteurplus"); member(s.suspendu, 6, "editor"); member(s.equipe, 5, "editor"); member(s.equipe, 9, "admin");
    member(s.archive, 1, "editor"); member(s.supprime, 1, "editor");
    member(s.autreOrg, 8, "redacteur"); // rôle de même clé que celui de l'organisation A, mais défini SANS droit dans B (cloisonnement des rôles)
    assert.throws(() => member(s.lecteur, 7, "fantome"), /rôle invalide/, "un rôle inconnu est refusé par la base : cas impossible");
    db.exec("INSERT INTO mk_ai_requests (organization_id, user_id, action, ok, created_at) VALUES (1, 7, 'rewrite', 1, 1), (1, NULL, 'sms', 0, 2)");
    const before = rows(db, "SELECT * FROM mk_ai_requests");
    assert.deepEqual(migrate(db, { dir: MIGRATIONS, dbPath: ":memory:", log: quiet }).applied.filter((v) => v === "086"), ["086"]);
    assert.equal(rows(db, "SELECT COUNT(*) n FROM mk_site_modules WHERE module = 'ai'")[0].n, 0, "la migration SQL seule n'active rien");
    assert.deepEqual(rows(db, "SELECT * FROM mk_ai_requests").map(({ site_id, ...r }) => ({ ...r, site_id })), before.map((r) => ({ ...r, site_id: null })), "historique intact, site inconnu non deviné");
    const preview = transitions.aiEligibility(db);
    assert.deepEqual(preview.eligible.map((e) => e.siteId), [s.editeur, s.personnalise]);
    assert.equal(enabled(db).length, 0, "l'aperçu est en lecture seule");
    const r = transitions.runAiOnce(db, { log: {} });
    assert.deepEqual([r.done, r.enabled], [true, 2]);
    assert.deepEqual(enabled(db), [s.editeur, s.personnalise].sort((a, b) => a - b));
    for (const nom of ["lecteur", "auteur", "contributeur", "roleSansDroit", "suspendu", "equipe", "vide", "archive", "supprime", "autreOrg"]) assert.equal(modules.isEnabled(db, 1, s[nom], "ai"), false, nom);
    assert.equal(db.prepare("PRAGMA foreign_key_check").all().length, 0);
    db.close();
  });

  test("C3/C4/C5 : site créé ensuite désactivé ; transition rejouée sans effet ; module désactivé volontairement jamais réactivé (même si le repère disparaît et la transition est rejouée)", () => {
    const { db, site, member } = avant();
    const a = site(1, "A"), b = site(1, "B");
    member(a, 1, "editor"); member(b, 2, "editor");
    db.exec(`INSERT INTO mk_site_modules (site_id, organization_id, module, enabled) VALUES (${b}, 1, 'ai', 0)`); // l'équipe l'avait volontairement désactivé
    migrate(db, { dir: MIGRATIONS, dbPath: ":memory:", log: quiet });
    assert.equal(transitions.runAiOnce(db, { log: {} }).enabled, 1);
    assert.deepEqual(enabled(db), [a], "B reste désactivé");
    // site créé après, même avec un éditeur dessus : aucune activation automatique
    const c = site(1, "C"); member(c, 3, "editor");
    assert.equal(modules.isEnabled(db, 1, c, "ai"), false);
    assert.deepEqual(transitions.runAiOnce(db, { log: {} }), { done: false, reason: "déjà exécutée" });
    assert.equal(modules.isEnabled(db, 1, c, "ai"), false, "rejouée : le nouveau site n'est pas activé");
    // l'équipe désactive A après la transition ; deuxième passage de migrate : aucun changement
    modules.setEnabled({ db, organizationId: 1, userId: null }, 1, "ai", false);
    assert.deepEqual(migrate(db, { dir: MIGRATIONS, dbPath: ":memory:", log: quiet }).applied, []);
    transitions.runAiOnce(db, { log: {} });
    assert.equal(modules.isEnabled(db, 1, a, "ai"), false, "désactivation volontaire respectée");
    // même repère effacé par erreur : INSERT OR IGNORE ne réactive pas une ligne existante
    db.exec("DELETE FROM schema_migrations WHERE scope = 'transition'");
    transitions.runAiOnce(db, { log: {} });
    assert.equal(modules.isEnabled(db, 1, a, "ai"), false, "ligne existante jamais écrasée");
    assert.equal(modules.isEnabled(db, 1, b, "ai"), false);
    db.close();
  });

  test("C6 : deux organisations — chaque transition reste dans son organisation, les lignes d'activation portent la bonne organisation", () => {
    const { db, site, member } = avant();
    db.exec("INSERT INTO mk_roles (organization_id, key, name, permissions) VALUES (2, 'redacteur', 'Rédacteur', '[\"forms.write\"]')");
    const a = site(1, "A"), b = site(2, "B"), c = site(2, "C");
    member(a, 1, "editor"); member(b, 2, "redacteur"); member(c, 3, "viewer");
    migrate(db, { dir: MIGRATIONS, dbPath: ":memory:", log: quiet });
    transitions.runAiOnce(db, { log: {} });
    assert.deepEqual(rows(db, "SELECT site_id, organization_id FROM mk_site_modules WHERE module = 'ai' ORDER BY site_id"), [{ site_id: a, organization_id: 1 }, { site_id: b, organization_id: 2 }]);
    assert.equal(modules.isEnabled(db, 2, c, "ai"), false);
    assert.equal(modules.isEnabled(db, 1, b, "ai"), false, "le site d'une autre organisation n'est pas lisible depuis la mauvaise organisation");
    db.close();
  });

  test("C8 : la transition ne touche ni aux permissions, ni aux quotas, ni aux secrets, ni à aucune table hors activation et repère", () => {
    const { db, site, member } = avant();
    const a = site(1, "A"); member(a, 1, "editor");
    db.exec("INSERT INTO mk_settings (organization_id, key, value) VALUES (1, 'ai_quota', '5')");
    db.exec("INSERT INTO mk_roles (organization_id, key, name, permissions) VALUES (1, 'x', 'X', '[\"forms.write\"]')");
    migrate(db, { dir: MIGRATIONS, dbPath: ":memory:", log: quiet });
    const snap = () => Object.fromEntries(["mk_settings", "mk_roles", "mk_org_members", "mk_site_members", "mk_sites", "mk_ai_requests", "users"].map((t) => [t, JSON.stringify(rows(db, `SELECT * FROM ${t}`))]));
    const before = snap();
    transitions.runAiOnce(db, { log: {} });
    assert.deepEqual(snap(), before);
    assert.deepEqual(rows(db, "SELECT scope, version FROM schema_migrations WHERE scope = 'transition'"), [{ scope: "transition", version: "086" }]);
    const src = fs.readFileSync(path.join(__dirname, "../src/marketing/transitions.js"), "utf8");
    assert.ok(!/ANTHROPIC|process\.env|api[_-]?key/i.test(src), "aucun accès aux secrets");
    db.close();
  });
});

describe("service : module requis, consommation attribuée au site, quota commun (client factice)", () => {
  let m, A, requests;
  const code = async (p) => { try { await p; } catch (e) { return e.code; } return null; };
  beforeEach(() => {
    m = freshMarketing();
    m.db.exec("INSERT INTO users (id, username, email) VALUES (7, 'admin', 'admin@x.fr')");
    m.db.exec("INSERT INTO mk_sites (organization_id, name, slug, tokens) VALUES (1, 'S1', 's1', '{}'), (1, 'S2', 's2', '{}'), (2, 'Autre', 'autre', '{}')");
    A = m.ctx(1, { now: () => NOW, baseUrl: "https://k.test" });
    requests = [];
    aiCore.setClientForTests({ beta: { messages: { create: async (r) => { requests.push(r); return { stop_reason: "end_turn", model: r.model, usage: { output_tokens: 42 }, content: [{ type: "text", text: JSON.stringify({ text: "Texte réécrit" }) }] }; } } } });
  });
  after(() => aiCore.setClientForTests(null));
  const S = (id) => ({ ...A, siteScope: id });
  const rewrite = (ctx) => ai.rewrite(ctx, { text: "Bonjour le monde", mode: "reecrire" });

  test("le registre déclare l'IA ouverte aux sites (état affiché dans l'écran Modules)", () => { assert.equal(modules.MODULES.ai.ready, true); assert.equal(modules.listFor(A, 1).find((x) => x.key === "ai").ready, true); });
  test("module requis : un accès limité sans module activé n'obtient rien — aucune demande au fournisseur, aucune ligne de consommation ; l'équipe n'est jamais bloquée", async () => {
    assert.equal(await code(rewrite(S(1))), "module_disabled");
    assert.equal(requests.length, 0); assert.equal(rows(m.db, "SELECT COUNT(*) n FROM mk_ai_requests")[0].n, 0);
    await rewrite(A); assert.equal(requests.length, 1);
    modules.setEnabled(A, 1, "ai", true);
    await rewrite(S(1)); assert.equal(requests.length, 2);
    assert.equal(await code(rewrite(S(2))), "module_disabled", "le module d'un autre site ne s'applique pas");
  });
  test("consommation attribuée : accès limité → SON site (jamais un site passé par l'appelant) ; équipe → aucun site, ou le site explicite relu en base (page) ; site inconnu, d'une autre organisation ou non entier → aucun", async () => {
    modules.setEnabled(A, 1, "ai", true); modules.setEnabled(A, 2, "ai", true);
    const last = () => rows(m.db, "SELECT site_id FROM mk_ai_requests ORDER BY id DESC LIMIT 1")[0].site_id;
    await rewrite(S(1)); assert.equal(last(), 1);
    await ai.call(S(1), "test", { prompt: "x", schema: { type: "object", properties: { text: { type: "string" } }, required: ["text"], additionalProperties: false }, siteId: 2 }); assert.equal(last(), 1, "un accès limité reste attribué à son site");
    await rewrite(A); assert.equal(last(), null, "équipe sans contexte de site");
    for (const [forged, expected] of [[2, 2], [999, null], [3, null], ["1", null], [1.5, null], [null, null]]) {
      await ai.call(A, "test", { prompt: "x", schema: { type: "object", properties: { text: { type: "string" } }, required: ["text"], additionalProperties: false }, siteId: forged }); assert.equal(last(), expected, JSON.stringify(forged));
    }
  });
  test("quota COMMUN : toutes les demandes (équipe, site 1, site 2) comptent dans le même plafond ; la consommation se lit par site (accès limité : la sienne seulement) ; l'équipe voit la répartition", async () => {
    modules.setEnabled(A, 1, "ai", true); modules.setEnabled(A, 2, "ai", true);
    ai.saveAiSettings(A, { voice: "", dailyLimit: 4 });
    await rewrite(S(1)); await rewrite(S(1)); await rewrite(S(2)); await rewrite(A);
    assert.equal(await code(rewrite(S(2))), "quota", "plafond de l'organisation atteint par l'ensemble des sites");
    assert.equal(await code(rewrite(A)), "quota");
    const lim1 = ai.usage(S(1)), lim2 = ai.usage(S(2)), team = ai.usage(A);
    assert.equal(lim1.last24h, 2); assert.equal(lim2.last24h, 1); assert.equal(team.last24h, 4);
    assert.equal(lim1.bySite24h, undefined, "un accès limité ne voit pas la répartition");
    assert.deepEqual(team.bySite24h.map((x) => [x.siteId, x.n]).sort((a, b) => (a[0] ?? 0) - (b[0] ?? 0)), [[null, 1], [1, 2], [2, 1]]);
    assert.equal(rows(m.db, "SELECT COUNT(*) n FROM mk_ai_requests")[0].n, 4, "les refus de quota ne consomment rien");
  });
  test("désactiver le module conserve l'historique de consommation ; aucune tâche d'arrière-plan dans le moteur IA (appels synchrones)", async () => {
    modules.setEnabled(A, 1, "ai", true); await rewrite(S(1));
    const before = JSON.stringify(rows(m.db, "SELECT * FROM mk_ai_requests"));
    modules.setEnabled(A, 1, "ai", false);
    assert.equal(JSON.stringify(rows(m.db, "SELECT * FROM mk_ai_requests")), before);
    assert.equal(ai.usage(A).bySite24h[0].n, 1, "l'équipe lit toujours la consommation");
    for (const f of ["index.js", "studio.js"]) assert.doesNotMatch(fs.readFileSync(path.join(__dirname, "..", "src", "marketing", "ai", f), "utf8"), /enqueue|setTimeout|setInterval|queue\/jobs/, `${f} : aucune tâche d'arrière-plan`);
  });
});

describe("de bout en bout (serveur réel, faux serveur d'API) : routes ouvertes aux sites, studio de pages, secrets", () => {
  let srv, db, boss, api, apiRequests = [], A, B, editorA, adminA, adminB, readerA;
  const KEY = "sk-ant-test-factice";
  const one = (sql, ...a) => db.prepare(sql).get(...a);
  const idOf = (c) => one("SELECT id FROM users WHERE email = ?", c.email).id;
  const M = (site) => `/marketing/site-web/sites/${site}/modules`;
  const consumption = () => rows(db, "SELECT action, site_id FROM mk_ai_requests ORDER BY id");
  before(async () => {
    api = http.createServer((req, res) => {
      let body = ""; req.on("data", (d) => (body += d));
      req.on("end", () => {
        const r = JSON.parse(body || "{}"); apiRequests.push({ key: req.headers["x-api-key"], body: r });
        const text = JSON.stringify({ proposals: [{ subject: "Objet du faux serveur", preheader: "Préheader", why: "test" }], text: "Texte", operations: [], summary: "", question: "Pouvez-vous préciser ?" });
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ id: "msg_test", type: "message", role: "assistant", model: r.model, content: [{ type: "text", text }], stop_reason: "end_turn", stop_sequence: null, usage: { input_tokens: 10, output_tokens: 20 } }));
      });
    });
    await new Promise((resolve) => api.listen(0, "127.0.0.1", resolve));
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "", ANTHROPIC_API_KEY: KEY, ANTHROPIC_BASE_URL: `http://127.0.0.1:${api.address().port}` });
    boss = await loginInstructor(srv); db = srv.db();
    const mk = async (name) => Number((await boss.post("/marketing/site-web/sites", { name })).location.match(/sites\/(\d+)/)[1]);
    A = await mk("Site Alpha"); B = await mk("Site Bravo");
    const member = async (site, role) => { const c = await newStudent(srv); db.prepare("INSERT INTO mk_site_members (site_id, user_id, role) VALUES (?, ?, ?)").run(site, idOf(c), role); return c; };
    editorA = await member(A, "editor"); adminA = await member(A, "admin"); adminB = await member(B, "admin");
    await boss.post("/marketing/site-web/utilisateurs/roles", { name: "Contacts seuls", description: "t", perm: ["contacts.read"] });
    readerA = await member(A, one("SELECT key FROM mk_roles WHERE name = 'Contacts seuls'").key);
  });
  after(async () => { db.close(); await srv.stop(); api.close(); });
  const ask = (client, site, extra = {}) => client.post("/marketing/ia/objets", JSON.parse(JSON.stringify({ content: "Contenu de l'e-mail à titrer", site, ...extra })) && { content: "Contenu de l'e-mail à titrer", ...(site ? { site } : {}), ...extra });

  test("module désactivé : l'assistant est refusé aux membres du site (aucun appel au fournisseur, aucune consommation) ; l'équipe l'utilise comme avant (consommation sans site)", async () => {
    const n = apiRequests.length;
    for (const c of [editorA, adminA]) for (const r of [await ask(c, A), await c.get(`/marketing/ia/etat?site=${A}`)]) assert.ok([403, 404].includes(r.status), String(r.status));
    assert.equal(apiRequests.length, n); assert.equal(consumption().length, 0);
    const team = await boss.post("/marketing/ia/objets", { content: "Contenu de l'e-mail à titrer" });
    assert.equal(team.status, 200); assert.match(team.text, /Objet du faux serveur/);
    assert.deepEqual(consumption(), [{ action: "subjects", site_id: null }]);
  });
  test("module activé pour A : l'éditeur et l'administrateur de A utilisent l'assistant ; consommation attribuée à A ; le rôle sans droit de rédaction, l'administrateur de B et les paramètres forgés sont refusés", async () => {
    assert.equal((await boss.post(`${M(A)}/ai`, { etat: "activer" })).status, 302);
    const ok = await ask(editorA, A); assert.equal(ok.status, 200); assert.match(ok.text, /Objet du faux serveur/);
    assert.equal((await ask(adminA, A)).status, 200);
    assert.deepEqual(consumption().slice(-2), [{ action: "subjects", site_id: A }, { action: "subjects", site_id: A }]);
    const etat = await editorA.get(`/marketing/ia/etat?site=${A}`); assert.equal(etat.status, 200); assert.doesNotMatch(etat.text, /voice|dailyLimit|plafond/i);
    const n = apiRequests.length, c = consumption().length;
    for (const [who, r] of [["lecteur", await ask(readerA, A)], ["adminB sur A", await ask(adminB, A)], ["adminB sur B (module off)", await ask(adminB, B)], ["éditeur A sur B", await ask(editorA, B)], ["sans site", await ask(editorA, undefined)], ["site invalide", await ask(editorA, "abc")]]) assert.ok([302, 403, 404].includes(r.status), `${who} -> ${r.status}`);
    const forged = await editorA.post(`/marketing/ia/objets?site=${A}`, { content: "x y z contenu", site: B, site_id: B, siteId: B }); assert.equal(forged.status, 200);
    assert.equal(consumption().at(-1).site_id, A, "le site imposé reste A même si le corps désigne B");
    assert.equal(apiRequests.length, n + 1); assert.equal(consumption().length, c + 1);
  });
  test("réglages de l'assistant (voix de marque, plafond) : organisation seulement ; aucune clé ni secret dans aucune réponse ; la page de l'équipe montre la répartition par site", async () => {
    await boss.post("/marketing/ia", { voice: "VOIX-SECRETE-DE-LA-MARQUE", dailyLimit: "50" });
    const texts = [];
    for (const c of [editorA, adminA]) for (const p of ["/marketing/ia", `/marketing/ia?site=${A}`]) { const r = await c.get(p); assert.ok([302, 403, 404].includes(r.status), `${p} ${r.status}`); texts.push(r.text); }
    texts.push((await ask(editorA, A)).text, (await editorA.get(`/marketing/ia/etat?site=${A}`)).text);
    for (const t of texts) { assert.doesNotMatch(t, /VOIX-SECRETE/); assert.ok(!t.includes(KEY)); }
    assert.ok(apiRequests.every((r) => r.key === KEY), "la clé du serveur est la seule utilisée");
    const team = await boss.get("/marketing/ia"); assert.equal(team.status, 200); assert.match(team.text, /Site Alpha/); assert.ok(!team.text.includes(KEY));
  });
  test("studio de pages IA : requiert le module pour un accès limité ; consommation attribuée au site de la page (aussi pour l'équipe) ; page d'un autre site refusée", async () => {
    await boss.post("/marketing/pages", { name: "Page Alpha", site_id: A, kind: "page" }); await boss.post("/marketing/pages", { name: "Page Bravo", site_id: B, kind: "page" });
    const pa = one("SELECT id, revision FROM mk_landing_pages WHERE name = 'Page Alpha'"), pb = one("SELECT id, revision FROM mk_landing_pages WHERE name = 'Page Bravo'");
    const body = (p) => ({ instruction: "Ajoute un titre", revision: p.revision, mode: "modify" });
    const on = await editorA.post(`/marketing/pages/${pa.id}/ia/proposer?site=${A}`, body(pa)); assert.equal(on.status, 200, on.text.slice(0, 200));
    assert.deepEqual(consumption().at(-1), { action: "studio_modify", site_id: A });
    const other = await editorA.post(`/marketing/pages/${pb.id}/ia/proposer?site=${A}`, body(pb)); assert.ok([403, 404].includes(other.status), `page d'un autre site : ${other.status}`);
    const t = await boss.post(`/marketing/pages/${pb.id}/ia/proposer`, body(pb)); assert.equal(t.status, 200);
    assert.deepEqual(consumption().at(-1), { action: "studio_modify", site_id: B }, "l'équipe sur une page du site B : consommation de B");
    // module désactivé : refusé AVANT tout appel
    assert.equal((await boss.post(`${M(A)}/ai`, { etat: "desactiver" })).status, 302);
    const n = apiRequests.length;
    const off = await editorA.post(`/marketing/pages/${pa.id}/ia/proposer?site=${A}`, body(pa)); assert.ok([400, 403].includes(off.status), `module désactivé : ${off.status}`);
    assert.equal(apiRequests.length, n, "aucun appel au fournisseur");
    assert.equal(one("SELECT COUNT(*) n FROM mk_ai_requests WHERE site_id = ?", A).n >= 3, true, "l'historique est conservé");
  });
});
