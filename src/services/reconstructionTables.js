// Reconstruction des quatre tables dont l'unicité devient « par site » (palier 3) : posts, taxonomy_terms, mk_forms, mk_page_templates.
//
// ⚠ PRÉPARATION (livraison 1) : ce module n'est appelé NULLE PART au démarrage de l'application. Il ne sert qu'à l'ESSAI sur une copie temporaire
// d'une sauvegarde (voir essaiReconstruction.js et scripts/essai-reconstruction.js). Il est volontairement « pur » : il ne charge ni la base du site
// ni sa configuration, il n'agit que sur la connexion qu'on lui donne.
//
// Pourquoi du code et pas un fichier de migration SQL : SQLite ne sait pas retirer une contrainte d'unicité, il faut recréer la table ; or, clés étrangères
// actives, supprimer l'ancienne table supprime en cascade les lignes des tables liées. « PRAGMA foreign_keys=OFF » n'a aucun effet dans une transaction
// (le lanceur de migrations en ouvre une) : il doit être posé AVANT.
const crypto = require("crypto");

const NEW_COLUMN = "site_id";
// Chaque entrée : contrainte d'unicité à lever (reconnue de façon tolérante dans le CREATE TABLE réel), son remplaçant, et l'unicité « par site » (NULL = site principal)
const PLAN = [
  { table: "posts", drop: /slug\s+TEXT\s+NOT\s+NULL\s+UNIQUE/i, keep: "slug TEXT NOT NULL", unique: "CREATE UNIQUE INDEX uq_posts_site_slug ON posts(COALESCE(site_id, 0), slug)" },
  { table: "taxonomy_terms", drop: /,\s*UNIQUE\s*\(\s*taxonomy\s*,\s*slug\s*\)/i, keep: "", unique: "CREATE UNIQUE INDEX uq_taxonomy_terms_site_slug ON taxonomy_terms(COALESCE(site_id, 0), taxonomy, slug)" },
  { table: "mk_forms", drop: /,\s*UNIQUE\s*\(\s*organization_id\s*,\s*slug\s*\)/i, keep: "", unique: "CREATE UNIQUE INDEX uq_mk_forms_site_slug ON mk_forms(organization_id, COALESCE(site_id, 0), slug)" },
  { table: "mk_page_templates", drop: /,\s*UNIQUE\s*\(\s*organization_id\s*,\s*name\s*\)/i, keep: "", unique: "CREATE UNIQUE INDEX uq_mk_page_templates_site_name ON mk_page_templates(organization_id, COALESCE(site_id, 0), name)" },
];
const PLAN_TABLES = PLAN.map((p) => p.table);
const norm = (sql) => String(sql || "").replace(/--[^\n]*/g, "").replace(/\s+/g, " ").trim();
const q = (name) => `"${String(name).replace(/"/g, '""')}"`;
const has = (db, t) => Boolean(db.prepare("SELECT 1 FROM sqlite_master WHERE type='table' AND name=?").get(t));
const columnsOf = (db, t) => db.prepare(`PRAGMA table_info(${q(t)})`).all();
const hasSiteColumn = (db, t) => columnsOf(db, t).some((c) => c.name === NEW_COLUMN);

// Tables du plan qui n'ont pas encore la colonne de site (donc à reconstruire)
const pending = (db) => PLAN.filter((p) => has(db, p.table) && !hasSiteColumn(db, p.table)).map((p) => p.table);

// ---------------------------------------------------------------------------------------------------------------------------------------------
// Reconstruction : UNE transaction, clés étrangères désactivées avant, tout contrôle raté → ROLLBACK (aucune modification partielle)
// opts.inject : pour les tests uniquement — provoque une erreur après la reconstruction de la table indiquée (vérifie le retour arrière)
function rebuild(db, opts = {}) {
  if (db.isTransaction === true) throw new Error("La reconstruction doit être lancée hors transaction (les clés étrangères ne peuvent pas être désactivées dans une transaction).");
  const result = { rebuilt: [], skipped: [] };
  db.exec("PRAGMA foreign_keys=OFF");
  db.exec("BEGIN IMMEDIATE");
  try {
    for (const p of PLAN) {
      if (!has(db, p.table)) { result.skipped.push({ table: p.table, reason: "absente" }); continue; }
      if (hasSiteColumn(db, p.table)) { result.skipped.push({ table: p.table, reason: "déjà reconstruite" }); continue; }
      const t = p.table;
      const row = db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name=?").get(t);
      if (!row || !row.sql) throw new Error(`${t} : définition introuvable`);
      if (/WITHOUT\s+ROWID/i.test(row.sql)) throw new Error(`${t} : table WITHOUT ROWID non prévue`);
      if (!p.drop.test(row.sql)) throw new Error(`${t} : la contrainte d'unicité attendue est introuvable dans la définition réelle (rien n'a été modifié)`);
      const oldCols = columnsOf(db, t);
      const oldNames = oldCols.map((c) => c.name);
      let sql = row.sql.replace(p.drop, p.keep).replace(/\)\s*$/, `, ${NEW_COLUMN} INTEGER REFERENCES mk_sites(id) )`).replace(/^\s*CREATE\s+TABLE\s+("?)[\w]+\1/i, `CREATE TABLE ${t}__new`);
      if (!sql.includes(`${t}__new`)) throw new Error(`${t} : définition illisible`);
      const keptIndexes = db.prepare("SELECT name, sql FROM sqlite_master WHERE tbl_name=? AND type IN ('index','trigger') AND sql IS NOT NULL").all(t);
      const seq = has(db, "sqlite_sequence") ? db.prepare("SELECT seq FROM sqlite_sequence WHERE name=?").get(t) : null;
      const before = db.prepare(`SELECT COUNT(*) n FROM ${q(t)}`).get().n;
      db.exec(sql);
      // La nouvelle table doit avoir EXACTEMENT les anciennes colonnes (type, obligatoire, défaut, clé) + site_id : sinon la définition lue ne correspond pas
      const newCols = columnsOf(db, `${t}__new`);
      const same = newCols.length === oldCols.length + 1 && oldCols.every((c, i) => { const n = newCols[i]; return n && n.name === c.name && n.type === c.type && n.notnull === c.notnull && n.dflt_value === c.dflt_value && n.pk === c.pk; }) && newCols[newCols.length - 1].name === NEW_COLUMN;
      if (!same) throw new Error(`${t} : les colonnes de la nouvelle table ne correspondent pas à l'ancienne`);
      const list = oldNames.map(q).join(", ");
      db.exec(`INSERT INTO ${t}__new (${list}) SELECT ${list} FROM ${q(t)}`);
      const after = db.prepare(`SELECT COUNT(*) n FROM ${t}__new`).get().n;
      if (after !== before) throw new Error(`${t} : écart de lignes pendant la copie (${before} → ${after})`);
      db.exec(`DROP TABLE ${q(t)}`);
      db.exec(`ALTER TABLE ${t}__new RENAME TO ${q(t)}`);
      for (const o of keptIndexes) db.exec(o.sql);
      db.exec(p.unique);
      if (seq) db.prepare("INSERT OR REPLACE INTO sqlite_sequence (name, seq) VALUES (?, ?)").run(t, seq.seq);
      result.rebuilt.push({ table: t, rows: after, indexes: keptIndexes.length });
      if (opts.inject && opts.inject === t) throw new Error("erreur provoquée (essai du retour arrière)");
    }
    const bad = db.prepare("PRAGMA foreign_key_check").all();
    if (bad.length) throw new Error(`contrôle des relations : ${bad.length} anomalie(s)`);
    db.exec("COMMIT");
  } catch (error) {
    try { db.exec("ROLLBACK"); } catch { /* transaction déjà terminée */ }
    db.exec("PRAGMA foreign_keys=ON");
    throw error;
  }
  db.exec("PRAGMA foreign_keys=ON");
  return result;
}

// ---------------------------------------------------------------------------------------------------------------------------------------------
// Instantané comparable : jamais de contenu, seulement des nombres et des empreintes
function hashTable(db, t, names) {
  const h = crypto.createHash("sha256");
  const list = names.map(q).join(", ");
  let last = -1, n = 0;
  for (;;) {
    const rows = db.prepare(`SELECT rowid AS __r, ${list} FROM ${q(t)} WHERE rowid > ? ORDER BY rowid LIMIT 500`).all(last);
    if (!rows.length) break;
    for (const r of rows) {
      last = r.__r; n++;
      h.update(JSON.stringify(names.map((c) => { const v = r[c]; return v !== null && typeof v === "object" ? "b:" + Buffer.from(v).toString("base64") : v; })));
      h.update("\n");
    }
  }
  return { n, hash: h.digest("hex") };
}
function snapshot(db, previous = null) {
  const s = { tables: {}, objects: {}, fks: [], seq: {}, integrity: null, fkcheck: null };
  const tabs = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all().map((r) => r.name);
  for (const t of tabs) {
    const cols = columnsOf(db, t);
    const present = cols.map((c) => c.name);
    // Après : on hache exactement les colonnes qui existaient AVANT (la colonne site_id ajoutée n'en fait pas partie) ; les autres tables sont hachées en entier
    const original = previous && previous.tables[t] ? previous.tables[t].columns : present;
    const hashed = hashTable(db, t, original.filter((c) => present.includes(c)));
    s.tables[t] = { columns: present, detail: cols.map((c) => `${c.name}|${c.type}|${c.notnull}|${c.dflt_value}|${c.pk}`), rows: hashed.n, hash: hashed.hash };
    for (const f of db.prepare(`PRAGMA foreign_key_list(${q(t)})`).all()) s.fks.push(`${t}.${f.from}->${f.table}(${f.to})[${f.on_delete}/${f.on_update}]`);
    if (!PLAN_TABLES.includes(t)) s.objects["table:" + t] = norm(db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name=?").get(t).sql);
  }
  s.fks.sort();
  for (const o of db.prepare("SELECT type, name, sql FROM sqlite_master WHERE type IN ('index','trigger','view') AND sql IS NOT NULL").all()) s.objects[`${o.type}:${o.name}`] = norm(o.sql);
  if (has(db, "sqlite_sequence")) for (const r of db.prepare("SELECT name, seq FROM sqlite_sequence").all()) s.seq[r.name] = r.seq;
  s.integrity = db.prepare("PRAGMA integrity_check").get().integrity_check;
  s.fkcheck = db.prepare("PRAGMA foreign_key_check").all().length;
  return s;
}

// Écarts entre « avant » et « après ». Chaque écart est soit ATTENDU (documenté : site_id ajouté, unicité remplacée), soit INEXPLIQUÉ (bloque).
function compare(A, B, { rebuilt = PLAN_TABLES } = {}) {
  const expected = [], unexplained = [];
  const exp = (what) => expected.push(what), bad = (what) => unexplained.push(what);
  const planned = new Set(rebuilt);
  for (const t of Object.keys(A.tables)) {
    const a = A.tables[t], b = B.tables[t];
    if (!b) { bad(`table disparue : ${t}`); continue; }
    if (a.rows !== b.rows) bad(`${t} : nombre de lignes ${a.rows} → ${b.rows}`);
    if (a.hash !== b.hash) bad(`${t} : empreinte des données différente`);
    const wantsNew = planned.has(t) && !a.columns.includes(NEW_COLUMN);
    if (wantsNew) {
      const ok = b.detail.length === a.detail.length + 1 && a.detail.every((d, i) => d === b.detail[i]) && b.columns[b.columns.length - 1] === NEW_COLUMN;
      ok ? exp(`${t} : colonne ${NEW_COLUMN} ajoutée (NULL = site principal), colonnes d'origine identiques`) : bad(`${t} : colonnes modifiées de façon inattendue`);
    } else if (JSON.stringify(a.detail) !== JSON.stringify(b.detail)) bad(`${t} : colonnes différentes`);
  }
  for (const t of Object.keys(B.tables)) if (!A.tables[t]) bad(`table apparue : ${t}`);
  for (const k of new Set([...Object.keys(A.objects), ...Object.keys(B.objects)])) {
    if (A.objects[k] === B.objects[k]) continue;
    if (A.objects[k] === undefined && /^index:uq_(posts_site_slug|taxonomy_terms_site_slug|mk_forms_site_slug|mk_page_templates_site_name)$/.test(k) && PLAN.some((p) => norm(p.unique) === B.objects[k])) { exp(`${k.replace("index:", "unicité par site ajoutée : ")}`); continue; }
    bad(`${k.split(":")[0]} ${A.objects[k] === undefined ? "apparu" : B.objects[k] === undefined ? "disparu" : "modifié"} : ${k.split(":")[1]}`);
  }
  const fa = new Set(A.fks), fb = new Set(B.fks);
  for (const f of fa) if (!fb.has(f)) bad(`relation disparue : ${f}`);
  for (const f of fb) if (!fa.has(f)) (planned.has(f.split(".")[0]) && /^[a-z_]+\.site_id->mk_sites\(id\)\[NO ACTION\/NO ACTION\]$/.test(f)) ? exp(`relation ajoutée : ${f.split("[")[0]}`) : bad(`relation apparue : ${f}`);
  for (const k of new Set([...Object.keys(A.seq), ...Object.keys(B.seq)])) if (A.seq[k] !== B.seq[k]) bad(`séquence ${k} : ${A.seq[k]} → ${B.seq[k]}`);
  if (B.integrity !== "ok") bad("contrôle d'intégrité en échec après");
  if (B.fkcheck !== 0) bad(`contrôle des relations : ${B.fkcheck} anomalie(s) après`);
  return { expected, unexplained };
}

// ---------------------------------------------------------------------------------------------------------------------------------------------
// Comportement de la base reconstruite, vérifié avec des lignes FICTIVES dans un point de sauvegarde annulé (rien n'est conservé)
function behaviour(db) {
  const out = [];
  const org = has(db, "mk_organizations") ? db.prepare("SELECT id FROM mk_organizations ORDER BY id LIMIT 1").get() : null;
  const attempt = (fn) => { try { fn(); return true; } catch { return false; } };
  const inSavepoint = (name, fn) => { db.exec("SAVEPOINT essai"); try { return fn(); } finally { db.exec("ROLLBACK TO essai"); db.exec("RELEASE essai"); } };
  const check = (name, expectOk, fn) => { let ok; try { ok = inSavepoint(name, fn) === expectOk; } catch { ok = false; } out.push({ name, ok }); };
  if (!org) { out.push({ name: "comportement (aucune organisation dans la base : non exécutable)", ok: null }); return out; }
  const site = () => Number(db.prepare("INSERT INTO mk_sites (organization_id, name, slug, tokens) VALUES (?, 'essai', 'essai-temporaire', '{}')").run(org.id).lastInsertRowid);
  const cases = [
    ["articles", (s) => db.prepare("INSERT INTO posts (slug, title) VALUES ('essai-x', 'a')").run(), (s) => db.prepare("INSERT INTO posts (slug, title, site_id) VALUES ('essai-x', 'b', ?)").run(s)],
    ["catégories", (s) => db.prepare("INSERT INTO taxonomy_terms (taxonomy, name, slug) VALUES ('category', 'a', 'essai-x')").run(), (s) => db.prepare("INSERT INTO taxonomy_terms (taxonomy, name, slug, site_id) VALUES ('category', 'b', 'essai-x', ?)").run(s)],
    ["formulaires", (s) => db.prepare("INSERT INTO mk_forms (organization_id, name, slug, consent_text) VALUES (?, 'a', 'essai-x', 'ok')").run(org.id), (s) => db.prepare("INSERT INTO mk_forms (organization_id, name, slug, consent_text, site_id) VALUES (?, 'b', 'essai-x', 'ok', ?)").run(org.id, s)],
    ["modèles de pages", (s) => db.prepare("INSERT INTO mk_page_templates (organization_id, name, content) VALUES (?, 'essai-x', '{}')").run(org.id), (s) => db.prepare("INSERT INTO mk_page_templates (organization_id, name, content, site_id) VALUES (?, 'essai-x', '{}', ?)").run(org.id, s)],
  ];
  for (const [label, main, other] of cases) {
    check(`${label} : l'ancien code (sans site) insère encore`, true, () => { main(); return true; });
    check(`${label} : même adresse sur le site principal refusée`, false, () => { main(); return attempt(() => main()); });
    check(`${label} : même adresse sur un autre site acceptée`, true, () => { const s = site(); main(); return attempt(() => other(s)); });
    check(`${label} : même adresse sur ce même autre site refusée`, false, () => { const s = site(); other(s); return attempt(() => other(s)); });
  }
  check("articles : supprimer un article supprime toujours ses versions (cascade conservée)", true, () => {
    const id = Number(db.prepare("INSERT INTO posts (slug, title) VALUES ('essai-cascade', 'a')").run().lastInsertRowid);
    db.prepare("INSERT INTO post_revisions (post_id, title) VALUES (?, 'r')").run(id);
    db.prepare("DELETE FROM posts WHERE id = ?").run(id);
    return db.prepare("SELECT COUNT(*) n FROM post_revisions WHERE post_id = ?").get(id).n === 0;
  });
  check("catégories : supprimer une catégorie supprime toujours ses liens (cascade conservée)", true, () => {
    const id = Number(db.prepare("INSERT INTO taxonomy_terms (taxonomy, name, slug) VALUES ('category', 'a', 'essai-cascade')").run().lastInsertRowid);
    db.prepare("INSERT INTO taxonomy_relations (content_type, content_id, term_id) VALUES ('post', 987654321, ?)").run(id);
    db.prepare("DELETE FROM taxonomy_terms WHERE id = ?").run(id);
    return db.prepare("SELECT COUNT(*) n FROM taxonomy_relations WHERE term_id = ?").get(id).n === 0;
  });
  check("formulaires : supprimer un formulaire délie toujours ses pages (SET NULL conservé)", true, () => {
    const f = Number(db.prepare("INSERT INTO mk_forms (organization_id, name, slug, consent_text) VALUES (?, 'a', 'essai-set-null', 'ok')").run(org.id).lastInsertRowid);
    const p = Number(db.prepare("INSERT INTO mk_landing_pages (organization_id, name, slug, title, form_id) VALUES (?, 'essai', 'essai-set-null', 'essai', ?)").run(org.id, f).lastInsertRowid);
    db.prepare("DELETE FROM mk_forms WHERE id = ?").run(f);
    return db.prepare("SELECT form_id FROM mk_landing_pages WHERE id = ?").get(p).form_id === null;
  });
  return out;
}

module.exports = { PLAN, PLAN_TABLES, pending, rebuild, snapshot, compare, behaviour };
