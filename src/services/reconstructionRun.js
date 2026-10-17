// Point d'exécution DÉDIÉ des reconstructions (R6 lot 5) — hors du lanceur de migrations marketing.
// Pourquoi hors du lanceur : (1) le lanceur applique chaque migration dans UNE transaction (BEGIN IMMEDIATE) ; or SQLite ignore « PRAGMA foreign_keys=OFF » à l'intérieur d'une transaction,
// et reconstruire une table (DROP + RENAME) avec les clés étrangères actives supprime en cascade les lignes des tables liées (pages → versions, événements, tests A/B…) ;
// (2) la reconstruction exige l'application ARRÊTÉE (une seule connexion), une sauvegarde vérifiée et une comparaison avant/après exhaustive, ce qu'une migration SQL ne peut pas faire ;
// (3) le lanceur refuse une migration appliquée dont le fichier est absent : le marqueur d'exécution est donc écrit dans une AUTRE portée (« reconstruction ») de schema_migrations,
// que le lanceur ne lit pas ; il ne peut ni être rejoué par erreur, ni bloquer le démarrage.
// Étapes (journalisées, une ligne JSON par étape) : verrou → contrôles (arrêt si bloquant) → sauvegarde + empreinte + intégrité + TEST DE RESTAURATION → essai complet sur une copie jetable
// (reconstruction, reprise, comparaison, comportement) → [mode « reel » seulement] reconstruction réelle dans UNE transaction (marqueur compris) → comparaison → restauration automatique si écart.
// Le mode par défaut (« essai ») ne modifie JAMAIS la base d'origine.
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const { DatabaseSync } = require("node:sqlite");
const tables = require("./reconstructionTables");
const checks = require("./reconstructionChecks");
const backfill = require("./reconstructionBackfill");

const MARKER_SCOPE = "reconstruction";
const stamp = () => new Date().toISOString().replace(/[-:T]/g, "").slice(0, 14);
const sha256File = (f) => crypto.createHash("sha256").update(fs.readFileSync(f)).digest("hex");
const q = (s) => `'${String(s).replace(/'/g, "''")}'`;
const planChecksum = () => crypto.createHash("sha256").update(JSON.stringify(tables.PLAN.map((p) => [p.table, p.drops.map(String), p.keeps, p.uniques, p.relax]))).digest("hex");
const sameSnapshot = (a, b) => Object.keys(a.tables).length === Object.keys(b.tables).length && Object.entries(a.tables).every(([t, v]) => b.tables[t] && b.tables[t].rows === v.rows && b.tables[t].hash === v.hash);

// _test : crochets réservés aux TESTS (sabotage après reconstruction, erreur provoquée) pour prouver l'arrêt et la restauration ; absents en usage normal
function run({ dbPath, backupDir, mode = "essai", appStopped = false, confirm = "", marker = "076", allowLive = false, log = () => {}, _test = {} } = {}) {
  const events = [];
  const journalFile = path.join(backupDir || ".", `JOURNAL-RECONSTRUCTION-${stamp()}.jsonl`);
  const note = (step, ok, detail = {}) => { const e = { at: new Date().toISOString(), step, ok, ...detail }; events.push(e); try { fs.appendFileSync(journalFile, JSON.stringify(e) + "\n"); } catch { /* journal indisponible : le résultat reste renvoyé */ } log(e); return e; };
  const finish = (status, extra = {}) => { note("fin", status === "essai-conforme" || status === "reconstruite", { status }); return { status, events, journalFile, ...extra }; };
  const lock = `${dbPath}.reconstruction.lock`;
  let lockFd = null, source = null, work = null, backupFile = null, workFile = null;
  const cleanup = () => { for (const d of [source, work]) { try { d && d.close(); } catch { /* déjà fermée */ } } if (workFile) for (const s of ["", "-wal", "-shm"]) fs.rmSync(workFile + s, { force: true }); if (lockFd !== null) { try { fs.closeSync(lockFd); } catch { /* fermé */ } fs.rmSync(lock, { force: true }); } };
  try {
    // ---- 0. Conditions ----
    if (!dbPath || !fs.existsSync(dbPath)) return finish("refus", { reason: "Base introuvable." });
    if (!backupDir) return finish("refus", { reason: "Dossier de sauvegarde obligatoire." });
    fs.mkdirSync(backupDir, { recursive: true });
    if (!["essai", "reel"].includes(mode)) return finish("refus", { reason: "Mode inconnu (essai ou reel)." });
    if (mode === "reel") {
      if (!appStopped) return finish("refus", { reason: "L'application doit être ARRÊTÉE (une seule connexion à la base) : confirmez-le (--app-arretee)." });
      if (confirm !== "RECONSTRUIRE") return finish("refus", { reason: "Confirmation explicite requise : --confirmer RECONSTRUIRE." });
      let liveFile = null; try { liveFile = require("../config/paths").dbFile; } catch { /* hors application */ }
      if (liveFile && path.resolve(dbPath) === path.resolve(liveFile) && !allowLive) return finish("refus", { reason: "C'est la base de l'application : une reconstruction réelle exige une autorisation expresse (allowLive), jamais par défaut." });
    }
    try { lockFd = fs.openSync(lock, "wx"); } catch { return finish("refus", { reason: "Une reconstruction est déjà en cours (verrou présent)." }); }
    note("verrou", true, { lock });

    // ---- 1. Marqueur déjà posé ? contrôles (lecture seule) ----
    source = new DatabaseSync(dbPath, { readOnly: true });
    const done = (() => { try { return source.prepare("SELECT 1 FROM schema_migrations WHERE scope = ? AND version = ?").get(MARKER_SCOPE, marker); } catch { return null; } })();
    if (done) return finish("deja-executee", { reason: `Le marqueur ${marker} est déjà posé : reconstruction déjà exécutée.` });
    const found = checks.run(source);
    note("controles", !found.blocking, { block: found.totals.block, warn: found.totals.warn, excluded: found.totals.excluded, codes: found.findings.map((f) => `${f.severity}:${f.code}:${f.count}`) });
    if (found.blocking) return finish("arret-controles", { findings: found.findings, exclusions: found.exclusions });
    const pre = tables.snapshot(source);
    const preMarketing = (() => { try { return JSON.stringify(source.prepare("SELECT version, checksum FROM schema_migrations WHERE scope = 'marketing' ORDER BY version").all()); } catch { return "[]"; } })();
    if (pre.integrity !== "ok" || pre.fkcheck !== 0) return finish("arret-base-incoherente", { reason: `Base d'origine incohérente (intégrité ${pre.integrity}, relations ${pre.fkcheck}).` });
    const toBuild = tables.pending(source);
    note("a_reconstruire", true, { tables: toBuild });
    if (!toBuild.length) return finish("rien-a-faire", { reason: "Aucune table à reconstruire." });

    // ---- 2. Sauvegarde vérifiable + test de restauration ----
    backupFile = path.join(backupDir, `AVANT-RECONSTRUCTION-${stamp()}.db`);
    if (fs.existsSync(backupFile)) return finish("refus", { reason: "Une sauvegarde de même nom existe déjà : aucune sauvegarde n'est jamais écrasée." });
    source.exec(`VACUUM INTO ${q(backupFile)}`);
    const sum = sha256File(backupFile);
    const backupDb = new DatabaseSync(backupFile, { readOnly: true });
    const bsnap = tables.snapshot(backupDb); backupDb.close();
    const backupOk = bsnap.integrity === "ok" && sameSnapshot(pre, bsnap);
    note("sauvegarde", backupOk, { file: path.basename(backupFile), sha256: sum, bytes: fs.statSync(backupFile).size });
    if (!backupOk) return finish("arret-sauvegarde", { reason: "La sauvegarde ne reproduit pas exactement la base d'origine." });
    workFile = path.join(backupDir, `ESSAI-${stamp()}-${process.pid}.db`);
    fs.copyFileSync(backupFile, workFile);
    const restored = new DatabaseSync(workFile, { readOnly: true }); const rsnap = tables.snapshot(restored); restored.close();
    note("test_restauration", sameSnapshot(pre, rsnap), { identique: sameSnapshot(pre, rsnap) });
    if (!sameSnapshot(pre, rsnap)) return finish("arret-restauration", { reason: "Le test de restauration ne redonne pas la base d'origine." });
    source.close(); source = null;

    // ---- 3. Essai complet sur la copie jetable ----
    work = new DatabaseSync(workFile);
    work.exec("PRAGMA foreign_keys = ON");
    const trial = tables.rebuild(work, { inject: _test.injectEssai, after: (d) => { backfill.apply(d, backfill.plan(d, found)); if (_test.afterEssai) _test.afterEssai(d); } });
    const after = tables.snapshot(work, pre);
    const cmp = tables.compare(pre, after, { rebuilt: trial.rebuilt.map((r) => r.table) });
    const behaviour = tables.behaviour(work);
    const behaviourOk = behaviour.every((b) => b.ok !== false);
    note("essai", cmp.unexplained.length === 0 && behaviourOk, { rebuilt: trial.rebuilt.map((r) => r.table), expected: cmp.expected.length, unexplained: cmp.unexplained, behaviourFailed: behaviour.filter((b) => b.ok === false).map((b) => b.name) });
    work.close(); work = null;
    if (cmp.unexplained.length || !behaviourOk) return finish("arret-essai", { unexplained: cmp.unexplained, backup: backupFile });
    if (mode === "essai") return finish("essai-conforme", { backup: backupFile, expected: cmp.expected, rebuilt: trial.rebuilt, sha256: sum });

    // ---- 4. Reconstruction RÉELLE : une transaction, marqueur et reprise inclus ----
    const real = new DatabaseSync(dbPath);
    let outcome;
    try {
      real.exec("PRAGMA foreign_keys = ON");
      const result = tables.rebuild(real, { inject: _test.injectReel, after: (d) => {
        backfill.apply(d, backfill.plan(d, found));
        if (_test.afterReel) _test.afterReel(d);
        d.exec("CREATE TABLE IF NOT EXISTS schema_migrations (scope TEXT NOT NULL, version TEXT NOT NULL, name TEXT NOT NULL, checksum TEXT NOT NULL, applied_at TEXT NOT NULL DEFAULT (datetime('now')), PRIMARY KEY (scope, version))");
        d.prepare("INSERT INTO schema_migrations (scope, version, name, checksum) VALUES (?, ?, ?, ?)").run(MARKER_SCOPE, marker, "reconstruction_adresses_par_site", planChecksum());
      } });
      const post = tables.snapshot(real, pre);
      const verdict = tables.compare(pre, post, { rebuilt: result.rebuilt.map((r) => r.table) });
      // Le marqueur d'exécution (portée « reconstruction ») est la SEULE écriture attendue dans schema_migrations : les lignes du lanceur (portée « marketing ») doivent rester identiques
      verdict.unexplained = verdict.unexplained.filter((u) => !/schema_migrations/.test(u));
      const rows = (d) => JSON.stringify(d.prepare("SELECT version, checksum FROM schema_migrations WHERE scope = 'marketing' ORDER BY version").all());
      if (preMarketing !== rows(real)) verdict.unexplained.push("schema_migrations : lignes du lanceur modifiées");
      if (!real.prepare("SELECT 1 FROM schema_migrations WHERE scope = ? AND version = ?").get(MARKER_SCOPE, marker)) verdict.unexplained.push("marqueur d'exécution absent");
      outcome = { result, verdict };
      note("reel", verdict.unexplained.length === 0, { rebuilt: result.rebuilt.map((r) => r.table), unexplained: verdict.unexplained });
    } catch (error) {
      note("reel", false, { error: String(error.message).slice(0, 300) });
      outcome = { error };
    }
    try { real.close(); } catch { /* déjà fermée */ }
    if (outcome.error || outcome.verdict.unexplained.length) {
      // Restauration automatique : la sauvegarde vérifiée remplace la base ; la restauration est elle-même vérifiée
      for (const s of ["-wal", "-shm"]) fs.rmSync(dbPath + s, { force: true });
      fs.copyFileSync(backupFile, dbPath);
      const check = new DatabaseSync(dbPath, { readOnly: true }); const snap = tables.snapshot(check); check.close();
      const ok = sameSnapshot(pre, snap) && snap.integrity === "ok";
      note("restauration", ok, { identique: ok });
      return finish(ok ? "restauree" : "restauration-echouee", { reason: outcome.error ? outcome.error.message : "écart inexpliqué après reconstruction", unexplained: outcome.verdict ? outcome.verdict.unexplained : [], backup: backupFile });
    }
    return finish("reconstruite", { backup: backupFile, expected: outcome.verdict.expected, rebuilt: outcome.result.rebuilt, sha256: sum });
  } catch (error) {
    note("erreur", false, { error: String(error.message).slice(0, 300) });
    return finish("erreur", { reason: error.message, backup: backupFile });
  } finally { cleanup(); }
}

module.exports = { run, MARKER_SCOPE, planChecksum };
