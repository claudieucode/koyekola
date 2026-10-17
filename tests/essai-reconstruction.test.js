// Essai de reconstruction (palier 3, livraison 1) : outil d'essai sur copie temporaire d'une sauvegarde. Aucune reconstruction n'est faite sur la base en service.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const os = require("os");
const path = require("path");
const crypto = require("crypto");
const { DatabaseSync } = require("node:sqlite");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, loginInstructor, newStudent, Client } = require("./helpers");
const tables = require("../src/services/reconstructionTables");
const essai = require("../src/services/essaiReconstruction");

const ESSAI = "/formateur/gestion/sauvegardes/essai-reconstruction";
let srv, boss, db, workDir, backupName, backupFile;
const sha = (f) => crypto.createHash("sha256").update(fs.readFileSync(f)).digest("hex");
const cols = (d, t) => d.prepare(`PRAGMA table_info(${t})`).all().map((c) => c.name);
const copyOf = (name) => { const f = path.join(workDir, name); fs.rmSync(f, { force: true }); const ro = new DatabaseSync(backupFile, { readOnly: true }); ro.exec(`VACUUM INTO '${f}'`); ro.close(); const d = new DatabaseSync(f); d.exec("PRAGMA foreign_keys=ON"); return d; };

before(async () => {
  workDir = fs.mkdtempSync(path.join(os.tmpdir(), "essai-test-"));
  srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
  boss = await loginInstructor(srv);
  db = srv.db();
  const org = db.prepare("SELECT id FROM mk_organizations").get().id;
  const ins = (sql, ...a) => Number(db.prepare(sql).run(...a).lastInsertRowid);
  const ids = []; for (let i = 0; i < 12; i++) ids.push(ins("INSERT INTO posts (slug, title, content, status, published) VALUES (?, ?, 'texte', 'published', 1)", `art-${i}`, `Titre-Confidentiel-${i}`));
  for (const id of ids.slice(0, 6)) { db.prepare("INSERT INTO post_revisions (post_id, title) VALUES (?, 'r')").run(id); db.prepare("INSERT INTO blog_comments (post_id, body, author_name, author_email) VALUES (?, 'bravo', 'Nom-Prive', 'prive@exemple.test')").run(id); db.prepare("INSERT INTO post_slug_history (old_slug, post_id) VALUES (?, ?)").run("ancien-" + id, id); }
  const t1 = ins("INSERT INTO taxonomy_terms (taxonomy, name, slug) VALUES ('category', 'Parent', 'parent')");
  const t2 = ins("INSERT INTO taxonomy_terms (taxonomy, name, slug, parent_id) VALUES ('category', 'Enfant', 'enfant', ?)", t1);
  for (const id of ids.slice(0, 8)) db.prepare("INSERT INTO taxonomy_relations (content_type, content_id, term_id) VALUES ('post', ?, ?)").run(id, t2);
  const f = []; for (let i = 0; i < 4; i++) f.push(ins("INSERT INTO mk_forms (organization_id, name, slug, consent_text) VALUES (?, ?, ?, 'ok')", org, "Formulaire " + i, "formulaire-" + i));
  ins("INSERT INTO mk_landing_pages (organization_id, name, slug, title, status, form_id) VALUES (?, 'P', 'p-x', 'P', 'published', ?)", org, f[0]);
  const ct = ins("INSERT INTO mk_contacts (organization_id, email) VALUES (?, 'prive@exemple.test')", org);
  db.prepare("INSERT INTO mk_pending_confirmations (organization_id, form_id, contact_id, token_hash, consent_text, expires_at, created_at) VALUES (?, ?, ?, 'h', 'c', 9000000000000, 1)").run(org, f[0], ct);
  for (let i = 0; i < 3; i++) ins("INSERT INTO mk_page_templates (organization_id, name, content) VALUES (?, ?, '{}')", org, "Modèle " + i);
  db.prepare("DELETE FROM posts WHERE id = ?").run(ids[11]); // la séquence dépasse le plus grand identifiant
  await boss.post("/formateur/gestion/sauvegardes", {});
  const html = (await boss.get("/formateur/gestion/sauvegardes")).text;
  backupName = [...html.matchAll(/name="source" value="([^"]+\.db)"/g)].map((m) => m[1])[0];
  backupFile = path.join(srv.dir, "data", "backups", backupName);
});
after(async () => { await srv.stop(); fs.rmSync(workDir, { recursive: true, force: true }); });

describe("essai de reconstruction dans l'interface", () => {
  test("la page Sauvegardes propose l'essai sur chaque sauvegarde", () => {
    assert.ok(backupName, "un bouton d'essai existe pour la sauvegarde créée");
    assert.ok(fs.existsSync(backupFile));
  });

  test("essai complet : conforme, base en service ET sauvegarde intactes, copie supprimée", async () => {
    const shaBefore = sha(backupFile);
    const live = () => ({ posts: db.prepare("SELECT COUNT(*) n FROM posts").get().n, forms: db.prepare("SELECT COUNT(*) n FROM mk_forms").get().n, cols: cols(db, "posts").includes("site_id") });
    const liveBefore = live();
    const res = await boss.post(ESSAI, { source: backupName });
    assert.equal(res.status, 200);
    assert.match(res.text, /Essai conforme/);
    assert.match(res.text, /Inexpliquées[\s\S]{0,80}Aucune\./);
    for (const t of tables.PLAN_TABLES) assert.match(res.text, new RegExp(`<td data-label="Table">${t}</td>`));
    assert.match(res.text, /Dossier temporaire supprimé : <strong>oui<\/strong> · verrou libéré : <strong>oui<\/strong> · restes d'essais précédents : <strong>0<\/strong>/);
    assert.match(res.text, /Échec provoqué après « posts »/);
    assert.doesNotMatch(res.text, /✖|NON/);
    assert.equal(sha(backupFile), shaBefore, "la sauvegarde n'a pas changé d'un octet");
    assert.ok(!fs.existsSync(backupFile + "-wal") && !fs.existsSync(backupFile + "-shm"));
    assert.deepEqual(live(), liveBefore, "la base en service n'est pas touchée");
    assert.equal(live().cols, false, "aucune colonne site_id ajoutée à la base en service : le démarrage ne reconstruit rien");
    const ro = new DatabaseSync(backupFile, { readOnly: true });
    // R7 lot 2 : mk_forms.site_id vient désormais de la migration 081 (ajout simple, déjà dans la sauvegarde) ; les tables que l'OUTIL reconstruira (articles, termes…) restent sans site_id
    assert.equal(cols(ro, "mk_forms").includes("site_id"), true); assert.equal(cols(ro, "posts").includes("site_id"), false); ro.close();
    const root = path.join(srv.dir, "data", "essais-temporaires");
    assert.deepEqual(fs.readdirSync(root), [], "ni dossier d'essai ni verrou ne subsistent");
  });

  test("aucune donnée personnelle ni contenu dans l'écran de résultat", async () => {
    const res = await boss.post(ESSAI, { source: backupName });
    assert.doesNotMatch(res.text, /Titre-Confidentiel|Nom-Prive|prive@exemple|Parent|Enfant|Formulaire 0|Modèle 0|bravo/);
  });

  test("accès réservé, nom contrôlé, GET sans effet", async () => {
    const anon = new Client(srv.base);
    assert.ok([302, 303, 401, 403].includes((await anon.post(ESSAI, { source: backupName })).status));
    const student = await newStudent(srv);
    assert.ok([302, 303, 401, 403].includes((await student.post(ESSAI, { source: backupName })).status));
    for (const bad of ["../../etc/passwd", "inconnue.db", "..%2F..%2Fdata%2FKOYEKOLA.db", "", backupName + "/../x.db"]) assert.equal((await boss.post(ESSAI, { source: bad })).status, 404, bad);
    assert.equal((await boss.get(ESSAI)).status, 302);
    assert.equal(fs.existsSync(path.join(srv.dir, "data", "essais-temporaires", ".verrou")), false);
  });

  test("deux essais en même temps : un seul s'exécute, l'autre est refusé proprement", async () => {
    const [a, b] = await Promise.all([boss.post(ESSAI, { source: backupName }), boss.post(ESSAI, { source: backupName })]);
    const statuses = [a.status, b.status].sort();
    assert.deepEqual(statuses, [200, 302], "l'un réussit, l'autre est renvoyé vers les sauvegardes");
    const refused = a.status === 302 ? a : b;
    assert.match(refused.location, /\/formateur\/gestion\/sauvegardes/);
    assert.deepEqual(fs.readdirSync(path.join(srv.dir, "data", "essais-temporaires")), []);
  });
});

describe("essai : isolation, nettoyage et erreurs (service)", () => {
  test("délai dépassé : essai interrompu, dossier supprimé, verrou libéré", async () => {
    const root = path.join(workDir, "r1");
    const r = await essai.runOnFile(backupFile, { root, timeoutMs: 1 });
    assert.equal(r.verdict, "erreur"); assert.match(r.error, /Délai dépassé/);
    assert.equal(r.cleanup.workDirRemoved, true); assert.equal(r.cleanup.lockReleased, true);
    assert.deepEqual(fs.readdirSync(root), []);
  });
  test("restes d'un essai interrompu (dossier + verrou abandonné) nettoyés au prochain essai", async () => {
    const root = path.join(workDir, "r2");
    fs.mkdirSync(path.join(root, "essai-ancien"), { recursive: true }); fs.writeFileSync(path.join(root, "essai-ancien", "copie.db"), "reste");
    fs.mkdirSync(path.join(root, ".verrou")); const old = new Date(Date.now() - 3600 * 1000); fs.utimesSync(path.join(root, ".verrou"), old, old);
    const r = await essai.runOnFile(backupFile, { root });
    assert.equal(r.verdict, "conforme");
    assert.deepEqual(fs.readdirSync(root), []);
  });
  test("verrou récent : refus sans toucher à l'essai en cours", async () => {
    const root = path.join(workDir, "r3"); fs.mkdirSync(path.join(root, ".verrou"), { recursive: true });
    await assert.rejects(essai.runOnFile(backupFile, { root }), (e) => e instanceof essai.EssaiError && /déjà en cours/.test(e.message));
    assert.ok(fs.existsSync(path.join(root, ".verrou")), "le verrou de l'autre essai est conservé");
  });
  test("dossier privé (0700) et environnement vide : aucun secret transmis au processus d'essai", async () => {
    const root = path.join(workDir, "r4"); const stub = path.join(workDir, "stub.js");
    fs.writeFileSync(stub, `const fs=require("fs");const st=fs.statSync(process.argv[3]);process.stdout.write(JSON.stringify({verdict:"inutile",steps:[],behaviour:[],rollback:[],expected:[],unexplained:[],env:Object.keys(process.env).sort(),mode:(st.mode&0o777).toString(8),entries:fs.readdirSync(process.argv[3]).length}));`);
    const r = await essai.runOnFile(backupFile, { root, script: stub });
    assert.deepEqual(r.env.filter((k) => k !== "PATH" && !/^(__CF|LC_|LANG)/.test(k)), []);
    assert.ok(!r.env.includes("ENCRYPTION_KEY") && !r.env.includes("SESSION_SECRET") && !r.env.includes("FORMATEUR_PASSWORD"));
    assert.equal(r.mode, "700"); assert.equal((fs.statSync(root).mode & 0o777).toString(8), "700");
    assert.ok(!path.resolve(root).startsWith(path.resolve(__dirname, "..", "public")) && !path.resolve(root).includes(`${path.sep}uploads${path.sep}`));
  });
  test("sortie illisible du processus d'essai : erreur claire, nettoyage fait", async () => {
    const root = path.join(workDir, "r5"); const stub = path.join(workDir, "stub2.js"); fs.writeFileSync(stub, `process.stdout.write("pas du json")`);
    const r = await essai.runOnFile(backupFile, { root, script: stub });
    assert.equal(r.verdict, "erreur"); assert.deepEqual(fs.readdirSync(root), []);
  });
  test("sauvegarde en lecture seule (fichier non modifiable) : l'essai fonctionne et ne la modifie pas", async () => {
    const f = path.join(workDir, "lecture-seule.db"); fs.copyFileSync(backupFile, f); fs.chmodSync(f, 0o444);
    const h = sha(f); const root = path.join(workDir, "r6");
    const r = await essai.runOnFile(f, { root });
    assert.equal(r.verdict, "conforme"); assert.equal(sha(f), h);
    assert.ok(!fs.existsSync(f + "-wal") && !fs.existsSync(f + "-shm"));
  });
  test("fichier qui n'est pas une base SQLite : erreur propre, rien ne reste", async () => {
    const f = path.join(workDir, "faux.db"); fs.writeFileSync(f, "ceci n'est pas une base"); const root = path.join(workDir, "r7");
    const r = await essai.runOnFile(f, { root });
    assert.equal(r.verdict, "erreur"); assert.deepEqual(fs.readdirSync(root), []);
  });
});

describe("reconstruction : le comparateur détecte les vraies différences", () => {
  const rebuiltCopy = (name) => { const d = copyOf(name); const A = tables.snapshot(d); tables.rebuild(d); return { d, A }; };
  const unexplainedAfter = (A, d) => tables.compare(A, tables.snapshot(d, A)).unexplained;

  test("reconstruction correcte : aucune différence inexpliquée, 17 différences attendues documentées (10 pour articles, termes, formulaires, modèles ; 7 pour pages, redirections et historiques d'adresses : R6 lot 5)", () => {
    const { d, A } = rebuiltCopy("ok.db"); const c = tables.compare(A, tables.snapshot(d, A));
    assert.deepEqual(c.unexplained, []); assert.equal(c.expected.length, 17); // R7 lot 2 : mk_forms porte déjà site_id (migration 081) — l'outil n'ajoute plus que l'unicité par site (−2 : colonne et relation) ; seul « uq_mk_forms_site_slug » reste attendu pour cette table
    assert.deepEqual(c.expected.filter((e) => /mk_forms/.test(e)), ["unicité par site ajoutée : uq_mk_forms_site_slug"]);
    // Le détail des 7 différences ajoutées par le lot 5 : 2 unicités de pages, 1 de redirections, colonne + unicité + relation de l'historique d'articles, 1 de l'historique CMS
    const added = c.expected.filter((e) => /mk_landing_pages|seo_redirects|post_slug_history|cms_url_history/.test(e));
    assert.equal(added.length, 7, added.join(" | ")); d.close();
  });
  const sabotages = {
    "une ligne supprimée": (d) => d.exec("DELETE FROM taxonomy_relations WHERE rowid = (SELECT MIN(rowid) FROM taxonomy_relations)"),
    "une valeur modifiée": (d) => d.exec("UPDATE posts SET title = title || 'x' WHERE id = (SELECT MIN(id) FROM posts)"),
    "un index perdu": (d) => d.exec("DROP INDEX idx_posts_cms"),
    "un déclencheur perdu": (d) => d.exec("DROP TRIGGER trg_posts_taxonomy_delete"),
    "une séquence réinitialisée": (d) => d.exec("UPDATE sqlite_sequence SET seq = 1 WHERE name = 'posts'"),
    "une table supplémentaire": (d) => d.exec("CREATE TABLE intrus (id INTEGER)"),
    "un identifiant changé": (d) => { d.exec("PRAGMA foreign_keys=OFF"); d.exec("UPDATE mk_page_templates SET id = id + 1000"); d.exec("PRAGMA foreign_keys=ON"); },
  };
  for (const [what, sabotage] of Object.entries(sabotages)) {
    test(`détecte : ${what}`, () => {
      const { d, A } = rebuiltCopy("sab.db"); sabotage(d);
      assert.ok(unexplainedAfter(A, d).length > 0, what + " doit être signalé comme inexpliqué"); d.close();
    });
  }
  test("détecte la perte en cascade d'une reconstruction faite clés étrangères ACTIVES (le piège réel)", () => {
    const d = copyOf("naif.db"); const A = tables.snapshot(d);
    d.exec("PRAGMA foreign_keys=ON"); d.exec("BEGIN");
    d.exec("CREATE TABLE f2 AS SELECT * FROM mk_forms"); d.exec("DROP TABLE mk_forms"); d.exec("COMMIT"); // supprime en cascade les confirmations en attente
    const lost = tables.compare(A, tables.snapshot(d, A)).unexplained;
    assert.ok(lost.some((x) => /mk_pending_confirmations/.test(x)), lost.join(" | ")); d.close();
  });
  test("échec en cours de route : tout est annulé, clés étrangères réactivées", () => {
    const d = copyOf("echec.db"); const A = tables.snapshot(d);
    assert.throws(() => tables.rebuild(d, { inject: "mk_forms" }), /provoquée/);
    const c = tables.compare(A, tables.snapshot(d, A), { rebuilt: [] });
    assert.deepEqual(c.unexplained, []); assert.deepEqual(c.expected, []);
    assert.equal(d.prepare("PRAGMA foreign_keys").get().foreign_keys, 1); d.close();
  });
  test("définition inattendue (unicité introuvable) : refus AVANT toute modification", () => {
    const d = new DatabaseSync(":memory:"); d.exec("CREATE TABLE mk_forms (id INTEGER PRIMARY KEY AUTOINCREMENT, organization_id INTEGER, slug TEXT)"); d.exec("INSERT INTO mk_forms (organization_id, slug) VALUES (1, 'a')");
    assert.throws(() => tables.rebuild(d), /introuvable dans la définition réelle/);
    assert.equal(d.prepare("SELECT COUNT(*) n FROM mk_forms").get().n, 1); assert.equal(cols(d, "mk_forms").includes("site_id"), false);
    assert.equal(d.isTransaction, false); d.close();
  });
  test("réexécution : sans effet, et l'essai répond « rien à reconstruire »", async () => {
    const { d } = rebuiltCopy("deja.db");
    assert.deepEqual(tables.rebuild(d).rebuilt, []); assert.deepEqual(tables.pending(d), []); d.close();
    const root = path.join(workDir, "r8"); const done = path.join(workDir, "deja.db");
    const r = await essai.runOnFile(done, { root });
    assert.equal(r.verdict, "inutile");
  });
  test("tables jamais remplies (aucune séquence AUTOINCREMENT) : conforme, sans fausse alerte — et une vraie dérive de séquence reste détectée", () => {
    const d = copyOf("vides.db");
    for (const t of tables.PLAN_TABLES) { d.exec(`DELETE FROM ${t}`); d.exec(`DELETE FROM sqlite_sequence WHERE name = '${t}'`); } // clés étrangères actives : les lignes liées partent en cascade, aucune orpheline
    const A = tables.snapshot(d); tables.rebuild(d);
    assert.deepEqual(tables.compare(A, tables.snapshot(d, A)).unexplained, []);
    d.exec("INSERT INTO sqlite_sequence (name, seq) VALUES ('mk_forms_fictive', 5)"); // ligne de séquence qui n'existait pas : écart réel
    assert.ok(tables.compare(A, tables.snapshot(d, A)).unexplained.some((x) => /mk_forms_fictive/.test(x))); d.close();
  });
  test("comportement de la base reconstruite : tous les contrôles réussis", () => {
    const { d } = rebuiltCopy("comp.db"); const b = tables.behaviour(d);
    assert.ok(b.length >= 19); assert.deepEqual(b.filter((x) => x.ok !== true), []); d.close();
  });
});
