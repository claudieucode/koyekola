// R7 (clôture) — RETOURS ARRIÈRE des migrations 080 à 089 : les procédures écrites en tête de chaque migration sont rendues EXÉCUTABLES ici (dans l'ordre inverse), jouées sur une base jetable remplie de données,
// puis on vérifie : (a) le schéma redevient exactement celui d'avant 080 (tables, colonnes, index, déclencheurs) ; (b) les données qui existaient AVANT les migrations sont intactes ; (c) les données créées APRÈS
// (colonnes et tables de site) sont perdues — c'est annoncé, d'où « hors production, après sauvegarde » ; (d) la remontée des migrations redonne exactement le schéma complet ; (e) l'ordre inverse est obligatoire.
// Base en mémoire, aucune base réelle.
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { test, describe } = require("node:test");
const assert = require("node:assert/strict");
const { DatabaseSync } = require("node:sqlite");
const { migrate } = require("../src/marketing/db/migrate");
const { MIGRATIONS, quiet } = require("./marketing-helpers");

const USERS = "CREATE TABLE users (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT, email TEXT, password_hash TEXT DEFAULT 'x', role TEXT NOT NULL DEFAULT 'etudiant', status TEXT DEFAULT 'active', created_at TEXT DEFAULT (datetime('now')))";
const rows = (db, sql, ...a) => db.prepare(sql).all(...a).map((r) => ({ ...r }));

// PROCÉDURES INVERSES (une par migration, à jouer de 089 vers 080). Chacune supprime d'abord les déclencheurs et index qui référencent l'objet, puis l'objet, puis le repère d'application.
const unmark = (v) => `DELETE FROM schema_migrations WHERE scope = 'marketing' AND version = '${v}'`;
const INVERSE = {
  "089": ["DROP TRIGGER trg_mk_attr_insert", "DROP TRIGGER trg_mk_attr_site_fixe", "DROP INDEX idx_mk_attr_site", "ALTER TABLE mk_order_attributions DROP COLUMN site_id", unmark("089")],
  "088": ["DROP TRIGGER trg_mk_scorelog_insert", "DROP TRIGGER trg_mk_scorelog_site_fixe", "DROP INDEX idx_mk_score_log_site", "ALTER TABLE mk_score_log DROP COLUMN site_id", unmark("088")],
  "087": ["DROP TRIGGER trg_mk_socp_insert", "DROP TRIGGER trg_mk_socp_site_fixe", "DROP TRIGGER trg_mk_socg_insert", "DROP TRIGGER trg_mk_socg_immutable", "DROP TABLE mk_social_site_grants", "DROP INDEX idx_mk_social_posts_site", "ALTER TABLE mk_social_posts DROP COLUMN site_id", unmark("087")],
  "086": ["DROP INDEX idx_mk_ai_requests_site", "ALTER TABLE mk_ai_requests DROP COLUMN site_id", "UPDATE mk_site_modules SET enabled = 0 WHERE module = 'ai'", "DELETE FROM schema_migrations WHERE scope = 'transition' AND version = '086'", unmark("086")],
  "085": ["DROP TRIGGER trg_mk_smsc_insert", "DROP TRIGGER trg_mk_smsc_site_fixe", "DROP INDEX idx_mk_sms_campaigns_site", "ALTER TABLE mk_sms_campaigns DROP COLUMN site_id", unmark("085")],
  "084": ["DROP TRIGGER trg_mk_smod_insert", "DROP TRIGGER trg_mk_smod_immutable", "DROP TABLE mk_site_modules", unmark("084")],
  "083": ["DROP TRIGGER trg_mk_creq_insert", "DROP TRIGGER trg_mk_creq_final", "DROP TRIGGER trg_mk_creq_immutable", "DROP TABLE mk_contact_requests", unmark("083")],
  "082": ["DROP INDEX idx_mk_audit_site", "ALTER TABLE mk_audit_logs DROP COLUMN site_id", unmark("082")],
  "081": ["DROP TRIGGER trg_mk_forms_site_insert", "DROP TRIGGER trg_mk_forms_site_update", "DROP INDEX idx_mk_forms_site", "ALTER TABLE mk_forms DROP COLUMN site_id", "ALTER TABLE mk_consents DROP COLUMN site_id", unmark("081")],
  "080": ["DROP TRIGGER trg_mk_csite_insert", "DROP TRIGGER trg_mk_csite_origin_insert", "DROP TRIGGER trg_mk_csite_origin_update", "DROP TRIGGER trg_mk_csite_event_insert", "DROP TRIGGER trg_mk_csite_event_update", "DROP TABLE mk_contact_sites", unmark("080")],
};
const ORDER = ["089", "088", "087", "086", "085", "084", "083", "082", "081", "080"];

// Signature structurelle d'une base : tables (colonnes), index, déclencheurs — sans le texte SQL (réécrit par SQLite après DROP COLUMN)
function signature(db) {
  const objs = db.prepare("SELECT type, name, tbl_name FROM sqlite_master WHERE name NOT LIKE 'sqlite_%' AND type IN ('table', 'index', 'trigger') ORDER BY type, name").all();
  return objs.map((o) => o.type === "table" ? `table ${o.name}(${db.prepare(`PRAGMA table_info("${o.name}")`).all().map((c) => `${c.name}:${c.type}:${c.notnull}:${c.dflt_value}:${c.pk}`).join(",")})` : `${o.type} ${o.name} on ${o.tbl_name}`);
}
function build(upTo) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "bk-"));
  for (const f of fs.readdirSync(MIGRATIONS)) if (f.slice(0, 3) <= upTo) fs.copyFileSync(path.join(MIGRATIONS, f), path.join(dir, f));
  const db = new DatabaseSync(":memory:"); db.exec("PRAGMA foreign_keys = ON"); db.exec(USERS);
  migrate(db, { dir, dbPath: ":memory:", log: quiet });
  fs.rmSync(dir, { recursive: true, force: true });
  return db;
}
// Données AVANT 080 (base d'un site existant), puis migration complète, puis données créées APRÈS (avec site)
function seedBefore(db) {
  db.exec("INSERT INTO users (id, username, email) VALUES (1, 'u', 'u@x.fr')");
  db.exec("INSERT INTO mk_organizations (name, slug) VALUES ('Org', 'org')");
  db.exec("INSERT INTO mk_sites (organization_id, name, slug, tokens) VALUES (1, 'S1', 's1', '{}')");
  db.exec("INSERT INTO mk_contacts (organization_id, email, origin_site_id, score) VALUES (1, 'a@x.fr', 1, 40), (1, 'b@x.fr', NULL, 5)");
  db.exec("INSERT INTO mk_events (organization_id, name, email, contact_id, source, occurred_at, metadata, created_at, site_id) VALUES (1, 'page.visited', 'a@x.fr', 1, 't', 1, '{}', 1, 1)");
  db.exec("INSERT INTO mk_forms (organization_id, name, slug, consent_text) VALUES (1, 'F', 'f', 'oui')");
  db.exec("INSERT INTO mk_consents (organization_id, contact_id, purpose, action, source, text_shown) VALUES (1, 1, 'email', 'granted', 'form', 'oui')");
  db.exec("INSERT INTO mk_audit_logs (organization_id, user_id, action, resource_type) VALUES (1, 1, 'contact.created', 'contact')");
  db.exec("INSERT INTO mk_sms_campaigns (organization_id, name, body) VALUES (1, 'Sms', 'x')");
  db.exec("INSERT INTO mk_ai_requests (organization_id, user_id, action, ok, created_at) VALUES (1, 1, 'rewrite', 1, 1)");
  db.exec("INSERT INTO mk_social_posts (organization_id, group_key, network, body, scheduled_at) VALUES (1, 'g', 'facebook', 'Historique', 1)");
  db.exec("INSERT INTO mk_campaigns (organization_id, name, snapshot, target_type, target_id, status) VALUES (1, 'C', '', 'list', 1, 'sent')");
  db.exec("INSERT INTO mk_score_rules (organization_id, event, points) VALUES (1, 'page.visited', 10)");
  db.exec("INSERT INTO mk_score_log (organization_id, contact_id, rule_id, event_id, event, points, created_at) VALUES (1, 1, 1, 1, 'page.visited', 10, 1)");
  db.exec("INSERT INTO mk_order_attributions (organization_id, order_id, contact_id, campaign_id, amount_cents, ordered_at, clicked_at, created_at) VALUES (1, 501, 1, 1, 4900, 1, 1, 1)");
}
const DATA_TABLES = ["mk_contacts", "mk_events", "mk_forms", "mk_consents", "mk_audit_logs", "mk_sms_campaigns", "mk_ai_requests", "mk_social_posts", "mk_campaigns", "mk_score_rules", "mk_score_log", "mk_order_attributions", "mk_sites"];
const snapshotData = (db) => Object.fromEntries(DATA_TABLES.map((t) => [t, rows(db, `SELECT * FROM ${t} ORDER BY 1`)]));
function seedAfter(db) {
  // Le site d'une ligne existante ne change plus (déclencheurs) : les données « après » sont de NOUVELLES lignes portant un site, plus quelques mises à jour permises
  db.exec("UPDATE mk_forms SET site_id = 1; UPDATE mk_ai_requests SET site_id = 1");
  db.exec("INSERT INTO mk_consents (organization_id, contact_id, purpose, action, source, text_shown, site_id) VALUES (1, 1, 'sms', 'granted', 'form', 'oui', 1)"); // preuves en lecture seule : nouvelle ligne
  db.exec("INSERT INTO mk_audit_logs (organization_id, user_id, action, resource_type, site_id) VALUES (1, 1, 'form.created', 'form', 1)");
  db.exec("INSERT INTO mk_sms_campaigns (organization_id, name, body, site_id) VALUES (1, 'Sms site', 'x', 1)");
  db.exec("INSERT INTO mk_social_posts (organization_id, group_key, network, body, scheduled_at, site_id) VALUES (1, 'g2', 'facebook', 'Post site', 2, 1)");
  db.exec("INSERT INTO mk_score_log (organization_id, contact_id, rule_id, event_id, event, points, created_at, site_id) VALUES (1, 1, 1, 2, 'page.visited', 10, 2, 1)");
  db.exec("INSERT INTO mk_order_attributions (organization_id, order_id, contact_id, campaign_id, amount_cents, ordered_at, clicked_at, created_at, site_id) VALUES (1, 502, 1, 1, 100, 1, 1, 1, 1)");
  db.exec("INSERT INTO mk_site_modules (site_id, organization_id, module, enabled) VALUES (1, 1, 'ai', 1), (1, 1, 'sms', 1)");
  db.exec("INSERT INTO mk_social_site_grants (site_id, organization_id, network) VALUES (1, 1, 'facebook')");
  db.exec("INSERT INTO mk_contact_requests (organization_id, site_id, email, source) VALUES (1, 1, 'new@x.fr', 'admin')");
  db.exec("INSERT INTO schema_migrations (scope, version, name, checksum) VALUES ('transition', '086', 'ia_acces_existants', 'x')");
}

describe("retours arrière R7 (080 → 089)", () => {
  test("aller-retour complet : après les procédures inverses, schéma identique à celui d'avant 080 ET données d'avant intactes ; données de site créées après : perdues (annoncé)", () => {
    const reference = build("079"); const refSig = signature(reference);
    const db = build("079"); seedBefore(db);
    const before = snapshotData(db);
    // montée complète
    const dir = MIGRATIONS; assert.deepEqual(migrate(db, { dir, dbPath: ":memory:", log: quiet }).applied, ["080", "081", "082", "083", "084", "085", "086", "087", "088", "089"]);
    const fullSig = signature(db);
    assert.notDeepEqual(fullSig, refSig);
    seedAfter(db);
    assert.equal(rows(db, "SELECT COUNT(*) n FROM mk_contact_sites")[0].n > 0, true, "080 a repris l'origine des contacts");
    // descente, migration par migration, avec contrôle de l'effet de chacune
    for (const v of ORDER) {
      for (const stmt of INVERSE[v]) db.exec(stmt);
      assert.equal(rows(db, "SELECT COUNT(*) n FROM schema_migrations WHERE scope = 'marketing' AND version = ?", v)[0].n, 0, `repère ${v} retiré`);
      // l'application reste utilisable à chaque palier : écritures de base possibles
      db.exec(`INSERT INTO mk_contacts (organization_id, email) VALUES (1, 'palier-${v}@x.fr')`); db.exec(`DELETE FROM mk_contacts WHERE email = 'palier-${v}@x.fr'`);
    }
    assert.deepEqual(signature(db), refSig, "schéma identique à celui d'avant 080");
    const after = snapshotData(db);
    for (const t of DATA_TABLES) {
      const kept = after[t].filter((row) => before[t].some((b) => b.id === row.id));
      assert.deepEqual(kept, before[t], `${t} : lignes d'avant les migrations intactes (mêmes colonnes, mêmes valeurs)`);
    }
    assert.ok(after.mk_sms_campaigns.length === 2 && after.mk_consents.length === 2 && after.mk_audit_logs.length === 2 && after.mk_social_posts.length === 2 && after.mk_score_log.length === 2 && after.mk_order_attributions.length === 2, "les lignes créées après SURVIVENT, mais sans leur site (colonne retirée)");
    assert.equal(rows(db, "SELECT COUNT(*) n FROM schema_migrations WHERE scope = 'transition'")[0].n, 0);
    // remontée : le moteur de migrations réapplique tout et retrouve exactement le schéma complet
    assert.deepEqual(migrate(db, { dir, dbPath: ":memory:", log: quiet }).applied, ["080", "081", "082", "083", "084", "085", "086", "087", "088", "089"]);
    assert.deepEqual(signature(db), fullSig, "schéma complet retrouvé après remontée");
    assert.equal(rows(db, "SELECT COUNT(*) n FROM mk_contact_requests")[0].n, 0, "les demandes créées après la migration ont été perdues (annoncé)");
    assert.equal(rows(db, "SELECT COUNT(*) n FROM mk_site_modules")[0].n, 0);
    assert.equal(rows(db, "SELECT site_id FROM mk_forms")[0].site_id, null, "le site des formulaires n'est pas récupérable : il faut la sauvegarde");
    assert.equal(db.prepare("PRAGMA foreign_key_check").all().length, 0);
    db.close(); reference.close();
  });
  test("chaque migration prise isolément (la plus récente d'abord) : l'inverse de N laisse exactement le schéma de N−1, y compris à mi-parcours", () => {
    for (let i = 0; i < ORDER.length; i++) {
      const v = ORDER[i], prev = String(Number(v) - 1).padStart(3, "0");
      const db = build(v), ref = build(prev);
      for (const stmt of INVERSE[v]) db.exec(stmt);
      assert.deepEqual(signature(db), signature(ref), `inverse de ${v} → schéma de ${prev}`);
      db.close(); ref.close();
    }
  });
  test("l'ORDRE inverse est obligatoire : supprimer la table de 080 sans retirer d'abord ses déclencheurs casse l'écriture des contacts ; retirer 081 avant 082+ n'est pas supporté sans retirer les suivantes (dépendances de colonnes)", () => {
    const db = build("089"); seedBefore(db);
    db.exec("DROP TABLE mk_contact_sites");
    assert.throws(() => db.exec("INSERT INTO mk_contacts (organization_id, email, origin_site_id) VALUES (1, 'x@x.fr', 1)"), /no such table/, "déclencheurs orphelins");
    db.close();
    const db2 = build("089");
    assert.throws(() => db2.exec("ALTER TABLE mk_forms DROP COLUMN site_id"), /no such column|index/i, "la colonne est référencée par un index : à retirer d'abord");
    db2.close();
  });
  test("la transition IA (086) : son repère est retiré par la procédure, un nouveau démarrage ne la rejoue pas tant que les migrations ne sont pas remontées ; modules désactivés plutôt que supprimés", () => {
    const db = build("089"); seedBefore(db); seedAfter(db);
    for (const s of INVERSE["086"]) db.exec(s);
    assert.equal(rows(db, "SELECT COUNT(*) n FROM mk_site_modules WHERE module = 'ai' AND enabled = 1")[0].n, 0);
    assert.equal(rows(db, "SELECT COUNT(*) n FROM mk_site_modules WHERE module = 'sms' AND enabled = 1")[0].n, 1, "les autres modules ne sont pas touchés");
    db.close();
  });
});
