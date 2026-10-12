// Essai de reconstruction (palier 3, livraison 1) — cœur « pur » exécuté dans un PROCESSUS À PART (scripts/essai-reconstruction.js) :
// il n'ouvre jamais la base du site. La sauvegarde choisie est ouverte en LECTURE SEULE pour en faire une copie cohérente (VACUUM INTO) dans un
// dossier temporaire ; toutes les écritures se font sur cette copie. Résultat : des nombres et des libellés fixes — jamais un contenu.
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { DatabaseSync } = require("node:sqlite");
const tables = require("./reconstructionTables");

const clean = (m) => String(m || "").replace(/[^\x20-\x7EÀ-ſ]/g, " ").replace(/\s+/g, " ").slice(0, 160);
const quote = (f) => `'${f.replace(/'/g, "''")}'`;

function sha256File(file) {
  const h = crypto.createHash("sha256");
  const fd = fs.openSync(file, "r");
  try {
    const buf = Buffer.alloc(1 << 20);
    for (let n; (n = fs.readSync(fd, buf, 0, buf.length, null)) > 0;) h.update(buf.subarray(0, n));
  } finally { fs.closeSync(fd); }
  return h.digest("hex");
}
const stateOf = (file) => { const st = fs.statSync(file); return { size: st.size, mtimeMs: st.mtimeMs, sha: sha256File(file), wal: fs.existsSync(file + "-wal"), shm: fs.existsSync(file + "-shm") }; };

function open(file) { const db = new DatabaseSync(file); db.exec("PRAGMA foreign_keys=ON"); return db; }
function fkOn(db) { return db.prepare("PRAGMA foreign_keys").get().foreign_keys === 1; }

// source : fichier de sauvegarde (jamais modifié) ; work : dossier temporaire VIDE créé par l'appelant (tout y est écrit, et seulement là)
function runEssai(source, work) {
  const started = Date.now();
  const r = { verdict: "erreur", steps: [], tables: [], expected: [], unexplained: [], behaviour: [], rollback: [], source: null, copy: null, integrity: null, fkcheck: null, rebuilt: [], error: null };
  const step = (label, ok, detail) => r.steps.push({ label, ok, detail: detail === undefined ? null : detail });
  const opened = [];
  try {
    if (!path.isAbsolute(source) || !path.isAbsolute(work)) throw new Error("chemins absolus requis");
    if (!fs.statSync(source).isFile()) throw new Error("la sauvegarde n'est pas un fichier");
    if (!fs.statSync(work).isDirectory() || fs.readdirSync(work).length) throw new Error("dossier temporaire invalide (inexistant ou non vide)");
    if (fs.realpathSync(work) === fs.realpathSync(path.dirname(source))) throw new Error("le dossier temporaire ne peut pas être celui de la sauvegarde");
    const before = stateOf(source);
    r.source = { size: before.size, wal: before.wal, shm: before.shm };
    if (typeof fs.statfsSync === "function") {
      const fsStat = fs.statfsSync(work);
      const free = Number(fsStat.bavail) * Number(fsStat.bsize);
      if (free < before.size * 4 + 8 * 1024 * 1024) throw new Error(`espace disque insuffisant pour l'essai (libre : ${Math.round(free / 1048576)} Mo, nécessaire : ${Math.round((before.size * 4) / 1048576) + 8} Mo)`);
      step("Espace disque suffisant", true);
    } else step("Espace disque", null, "non vérifiable sur cette version de Node");

    const copy = path.join(work, "copie.db"), avant = path.join(work, "avant.db"), atomic = path.join(work, "atomicite.db");
    const ro = new DatabaseSync(source, { readOnly: true });
    try { ro.exec(`VACUUM INTO ${quote(copy)}`); } finally { ro.close(); }
    step("Copie temporaire cohérente de la sauvegarde (la sauvegarde est ouverte en lecture seule)", true);
    r.copy = { size: fs.statSync(copy).size };

    const db = open(copy); opened.push(db);
    const A = tables.snapshot(db);
    r.integrity = { before: A.integrity }; r.fkcheck = { before: A.fkcheck };
    db.exec(`VACUUM INTO ${quote(avant)}`);
    db.exec(`VACUUM INTO ${quote(atomic)}`);
    const todo = tables.pending(db);
    step("État initial relevé (lignes, empreintes, colonnes, relations, index, déclencheurs, séquences, intégrité)", A.integrity === "ok" && A.fkcheck === 0, { tables: Object.keys(A.tables).length, integrite: A.integrity, relations_invalides: A.fkcheck });
    r.pending = todo;
    if (!todo.length) { r.verdict = "inutile"; step("Les quatre tables ont déjà leur colonne de site : rien à reconstruire", true); return finish(); }

    // 1. Reconstruction sur la copie
    let rebuilt = null;
    try { rebuilt = tables.rebuild(db); step("Reconstruction des tables sur la copie", true, rebuilt.rebuilt.map((x) => ({ table: x.table, lignes: x.rows }))); r.rebuilt = rebuilt.rebuilt; }
    catch (error) { step("Reconstruction des tables sur la copie", false, clean(error.message)); r.error = clean(error.message); r.verdict = "bloque"; return finish(); }
    if (!fkOn(db)) step("Clés étrangères réactivées après la reconstruction", false); else step("Clés étrangères réactivées après la reconstruction", true);

    // 2. Comparaison exhaustive avant / après
    const B = tables.snapshot(db, A);
    const cmp = tables.compare(A, B, { rebuilt: todo });
    r.expected = cmp.expected; r.unexplained = cmp.unexplained;
    r.integrity.after = B.integrity; r.fkcheck.after = B.fkcheck;
    for (const t of tables.PLAN_TABLES) r.tables.push({ table: t, rowsBefore: A.tables[t] ? A.tables[t].rows : null, rowsAfter: B.tables[t] ? B.tables[t].rows : null, dataIdentical: Boolean(A.tables[t] && B.tables[t] && A.tables[t].hash === B.tables[t].hash) });
    r.global = { tablesBefore: Object.keys(A.tables).length, tablesAfter: Object.keys(B.tables).length, rowsBefore: Object.values(A.tables).reduce((s, x) => s + x.rows, 0), rowsAfter: Object.values(B.tables).reduce((s, x) => s + x.rows, 0), indexTriggersBefore: Object.keys(A.objects).length, indexTriggersAfter: Object.keys(B.objects).length, relationsBefore: A.fks.length, relationsAfter: B.fks.length };
    step("Comparaison avant / après", cmp.unexplained.length === 0, { attendus: cmp.expected.length, inexpliques: cmp.unexplained.length });

    // 3. Comportement (lignes fictives dans un point de sauvegarde annulé)
    r.behaviour = tables.behaviour(db);
    const afterBehaviour = tables.snapshot(db, A);
    const untouched = tables.compare(B, afterBehaviour, { rebuilt: [] });
    step("Les contrôles de comportement ne laissent aucune trace dans la copie", untouched.unexplained.length === 0 && untouched.expected.length === 0);

    // 4. Retour arrière — (a) échec en cours de route : tout est annulé ; (b) restauration depuis la copie d'avant
    for (const failAt of [...new Set([todo[0], todo[todo.length - 1]])]) {
      const atom = open(atomic); opened.push(atom);
      const X0 = tables.snapshot(atom);
      let threw = false;
      try { tables.rebuild(atom, { inject: failAt }); } catch { threw = true; }
      const X1 = tables.snapshot(atom, X0);
      const same = tables.compare(X0, X1, { rebuilt: [] });
      r.rollback.push({ name: `Échec provoqué après « ${failAt} » : tout est annulé`, ok: threw && same.unexplained.length === 0 && same.expected.length === 0 && fkOn(atom) });
      atom.close(); opened.pop();
    }
    const old = open(avant); opened.push(old);
    const C = tables.snapshot(old, A);
    const restored = tables.compare(A, C, { rebuilt: [] });
    r.rollback.push({ name: "Restauration depuis la copie d'avant : état identique à l'original", ok: restored.unexplained.length === 0 && restored.expected.length === 0 && C.integrity === "ok" });
    old.close(); opened.pop();

    // 5. La sauvegarde source n'a pas été touchée
    const after = stateOf(source);
    const untouchedSource = after.sha === before.sha && after.size === before.size && after.mtimeMs === before.mtimeMs && after.wal === before.wal && after.shm === before.shm;
    step("La sauvegarde d'origine est strictement inchangée (empreinte, taille, date, aucun fichier -wal / -shm)", untouchedSource);

    const behaviourOk = r.behaviour.every((b) => b.ok !== false);
    const rollbackOk = r.rollback.every((b) => b.ok);
    r.verdict = cmp.unexplained.length === 0 && r.steps.every((s) => s.ok !== false) && behaviourOk && rollbackOk && untouchedSource && B.integrity === "ok" && B.fkcheck === 0 ? "conforme" : "bloque";
    return finish();
  } catch (error) {
    r.error = clean(error.message); r.verdict = "erreur";
    return finish();
  }
  function finish() {
    for (const d of opened) { try { d.close(); } catch { /* déjà fermée */ } }
    r.durationMs = Date.now() - started;
    return r;
  }
}

module.exports = { runEssai, sha256File };
