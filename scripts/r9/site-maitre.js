// R9-3 — migration « ligne dédiée du site maître » (option B, étape 1) : contrôles, application et retour arrière, sur une base passée en argument.
// Aucune écriture hors de la base reçue ; transaction unique (tout ou rien) ; contrôles après application DANS la transaction (échec = annulation complète) ; journal dans schema_migrations sous la portée « r9 »
// (le moteur de migrations marketing ne lit que la portée « marketing » : il ignore cette ligne et ne refuse donc jamais le démarrage de l'application).
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");

const SCOPE = "r9", VERSION = "092", NAME = "site_maitre_ligne_dediee";
const UP = fs.readFileSync(path.join(__dirname, "092_site_maitre_ligne_dediee.sql"), "utf8");
const DOWN = fs.readFileSync(path.join(__dirname, "092_site_maitre_ligne_dediee.down.sql"), "utf8");
const CHECKSUM = crypto.createHash("sha256").update(UP).digest("hex");
const PRIMARY = { name: "Site principal", slug: "principal", site_type: "principal", description: "Site maître de la plateforme", status: "active" };

const all = (db, sql, ...a) => db.prepare(sql).all(...a);
const one = (db, sql, ...a) => db.prepare(sql).get(...a);
const has = (db, t) => Boolean(one(db, "SELECT 1 x FROM sqlite_master WHERE type='table' AND name = ?", t));
const columns = (db, t) => all(db, `PRAGMA table_info("${t}")`).map((c) => c.name);
const tableCounts = (db) => Object.fromEntries(all(db, "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").map((t) => [t.name, one(db, `SELECT COUNT(*) n FROM "${t.name}"`).n]));
// Structure observable : colonnes de chaque table, index et déclencheurs (texte SQL) — indépendante de la mise en forme du CREATE TABLE
const structure = (db) => ({
  colonnes: Object.fromEntries(all(db, "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").map((t) => [t.name, all(db, `PRAGMA table_info("${t.name}")`).map((c) => `${c.name}:${c.type}:${c.notnull}:${c.dflt_value}:${c.pk}`)])),
  index: all(db, "SELECT name, tbl_name, sql FROM sqlite_master WHERE type='index' AND sql IS NOT NULL ORDER BY name").map((r) => `${r.tbl_name}.${r.name}=${r.sql}`),
  declencheurs: all(db, "SELECT name, tbl_name, sql FROM sqlite_master WHERE type='trigger' ORDER BY name").map((r) => `${r.tbl_name}.${r.name}=${r.sql}`),
});
const signature = (db) => crypto.createHash("sha256").update(JSON.stringify(structure(db))).digest("hex");
// Lignes des sites ordinaires (hors colonne is_primary) : doivent être identiques avant / après
const secondaries = (db) => { const cols = columns(db, "mk_sites").filter((c) => c !== "is_primary"); const where = columns(db, "mk_sites").includes("is_primary") ? "WHERE is_primary = 0" : ""; return all(db, `SELECT ${cols.map((c) => `"${c}"`).join(", ")} FROM mk_sites ${where} ORDER BY id`); };
const marketingVersions = (db) => (has(db, "schema_migrations") ? all(db, "SELECT version FROM schema_migrations WHERE scope = 'marketing'").map((r) => String(r.version)) : []);
const applied = (db) => has(db, "schema_migrations") && Boolean(one(db, "SELECT 1 x FROM schema_migrations WHERE scope = ? AND version = ?", SCOPE, VERSION));

function prerequis(db) {
  const blocking = [], warnings = [], info = [];
  if (!has(db, "mk_sites") || !has(db, "mk_organizations")) { blocking.push("tables marketing absentes (mk_sites / mk_organizations)"); return { ok: false, blocking, warnings, info }; }
  const colExists = columns(db, "mk_sites").includes("is_primary"), logged = applied(db);
  if (colExists !== logged) blocking.push(`état incohérent : colonne is_primary ${colExists ? "présente" : "absente"} mais migration ${logged ? "journalisée" : "non journalisée"} — ne rien tenter avant analyse`);
  if (colExists && logged) { info.push("migration déjà appliquée"); return { ok: false, applied: true, blocking: ["migration déjà appliquée (aucune seconde exécution)"], warnings, info }; }
  const v = marketingVersions(db);
  if (!v.includes("091")) blocking.push("la migration marketing 091 (R8) doit être appliquée avant R9");
  const orgs = one(db, "SELECT COUNT(*) n FROM mk_organizations").n;
  if (orgs !== 1) blocking.push(`${orgs} organisation(s) : la décision D8 (mono-organisation) suppose exactement une organisation — arbitrage nécessaire avant de créer le site principal`);
  const org = orgs === 1 ? one(db, "SELECT id FROM mk_organizations").id : null;
  if (org !== null) {
    const nameClash = one(db, "SELECT id FROM mk_sites WHERE organization_id = ? AND name = ? COLLATE NOCASE", org, PRIMARY.name), slugClash = one(db, "SELECT id FROM mk_sites WHERE organization_id = ? AND slug = ?", org, PRIMARY.slug);
    if (nameClash) blocking.push(`doublon potentiel : le site n° ${nameClash.id} porte déjà le nom « ${PRIMARY.name} »`);
    if (slugClash) blocking.push(`doublon potentiel : le site n° ${slugClash.id} porte déjà l'adresse lisible « ${PRIMARY.slug} »`);
  }
  if (Object.values(one(db, "PRAGMA integrity_check"))[0] !== "ok") blocking.push("integrity_check ≠ ok");
  const fk = all(db, "PRAGMA foreign_key_check"); if (fk.length) blocking.push(`foreign_key_check : ${fk.length} anomalie(s) existante(s) — arrêt (rien n'est à aggraver)`);
  const sqliteV = one(db, "SELECT sqlite_version() v").v.split(".").map(Number); if (sqliteV[0] < 3 || (sqliteV[0] === 3 && sqliteV[1] < 35)) blocking.push(`SQLite ${sqliteV.join(".")} : DROP COLUMN (retour arrière) exige 3.35 ou plus`);
  info.push(`sites existants : ${one(db, "SELECT COUNT(*) n FROM mk_sites").n} ; organisations : ${orgs}`);
  return { ok: blocking.length === 0, blocking, warnings, info };
}

function appliquer(db) {
  const p = prerequis(db); if (!p.ok) { const e = new Error(`Refus : ${p.blocking.join(" ; ")}`); e.prerequis = p; throw e; }
  const before = { counts: tableCounts(db), sites: JSON.stringify(secondaries(db)), structure: structure(db) };
  db.exec("BEGIN IMMEDIATE");
  try {
    before.counts = tableCounts(db); // comptés SOUS le verrou : une écriture concurrente de l'application (journal 404…) ne fausse plus la comparaison
    db.exec(UP);
    db.prepare("INSERT INTO schema_migrations (scope, version, name, checksum) VALUES (?, ?, ?, ?)").run(SCOPE, VERSION, NAME, CHECKSUM);
    // contrôles DANS la transaction : toute anomalie annule tout
    const after = tableCounts(db), diff = Object.keys(after).filter((t) => after[t] !== (before.counts[t] ?? 0));
    const expected = ["mk_sites", "schema_migrations"].sort();
    if (JSON.stringify(diff.sort()) !== JSON.stringify(expected) || after.mk_sites !== before.counts.mk_sites + 1 || after.schema_migrations !== before.counts.schema_migrations + 1) throw new Error(`comptes de lignes inattendus : ${diff.map((t) => `${t} ${before.counts[t] ?? 0}→${after[t]}`).join(", ")}`);
    if (JSON.stringify(secondaries(db)) !== before.sites) throw new Error("les lignes des sites ordinaires ont changé");
    const prim = all(db, "SELECT * FROM mk_sites WHERE is_primary = 1"); if (prim.length !== 1) throw new Error(`${prim.length} site(s) principal(aux) après application (1 attendu)`);
    const nowStructure = structure(db);
    const lost = before.structure.index.filter((i) => !nowStructure.index.includes(i)).concat(before.structure.declencheurs.filter((d) => !nowStructure.declencheurs.includes(d)));
    if (lost.length) throw new Error(`index ou déclencheurs existants modifiés : ${lost.slice(0, 3).join(" | ").slice(0, 200)}`);
    if (all(db, "PRAGMA foreign_key_check").length) throw new Error("foreign_key_check en échec après application");
    if (Object.values(one(db, "PRAGMA integrity_check"))[0] !== "ok") throw new Error("integrity_check en échec après application");
    db.exec("COMMIT");
    return { primaryId: prim[0].id, ajoutes: nowStructure.index.length - before.structure.index.length, declencheursAjoutes: nowStructure.declencheurs.length - before.structure.declencheurs.length };
  } catch (err) { try { db.exec("ROLLBACK"); } catch { /* transaction déjà terminée */ } throw new Error(`Application annulée (aucune modification conservée) : ${err.message}`); }
}

// Colonnes qui désignent un site : site_id, origin_site_id… (toute colonne se terminant par site_id) + colonnes de clés étrangères vers mk_sites
function siteColumns(db) {
  const out = [];
  for (const t of all(db, "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").map((x) => x.name)) {
    const fkCols = new Set(all(db, `PRAGMA foreign_key_list("${t}")`).filter((f) => f.table === "mk_sites").map((f) => f.from));
    for (const c of columns(db, t)) if (/(^|_)site_id$/.test(c) || fkCols.has(c)) out.push([t, c]);
  }
  return out.filter(([t, c]) => !(t === "mk_sites" && c === "id"));
}
function retourPrerequis(db) {
  const blocking = [];
  if (!has(db, "mk_sites")) return { ok: false, blocking: ["mk_sites absente"] };
  if (!applied(db) || !columns(db, "mk_sites").includes("is_primary")) return { ok: false, blocking: ["migration non appliquée : rien à défaire"] };
  const prim = all(db, "SELECT * FROM mk_sites WHERE is_primary = 1");
  if (prim.length !== 1) return { ok: false, blocking: [`${prim.length} site(s) principal(aux) : état inattendu, retour arrière refusé`] };
  const p = prim[0];
  const pristine = p.name === PRIMARY.name && p.slug === PRIMARY.slug && p.site_type === PRIMARY.site_type && p.description === PRIMARY.description && p.status === PRIMARY.status && p.tokens === "{}" && p.settings === "{}" && p.settings_revision === 0
    && p.home_page_id === null && p.header_component_id === null && p.footer_component_id === null && p.deleted_at === null && p.archived_at === null && p.created_by === null;
  if (!pristine) blocking.push("la ligne du site principal a été modifiée depuis la migration (nom, réglages, page d'accueil, composants…) : retour arrière refusé pour ne rien perdre");
  const refs = [];
  for (const [t, c] of siteColumns(db)) { const n = one(db, `SELECT COUNT(*) n FROM "${t}" WHERE "${c}" = ?`, p.id).n; if (n) refs.push(`${t}.${c} = ${n}`); }
  if (refs.length) blocking.push(`des données référencent le site principal (${refs.join(", ")}) : retour arrière refusé`);
  return { ok: blocking.length === 0, blocking, primaryId: p.id };
}
function retour(db) {
  const p = retourPrerequis(db); if (!p.ok) { const e = new Error(`Refus : ${p.blocking.join(" ; ")}`); e.prerequis = p; throw e; }
  const before = { counts: tableCounts(db), sites: JSON.stringify(secondaries(db)) };
  db.exec("BEGIN IMMEDIATE");
  try {
    before.counts = tableCounts(db); // idem : comptage sous le verrou
    db.exec(DOWN);
    db.prepare("DELETE FROM schema_migrations WHERE scope = ? AND version = ?").run(SCOPE, VERSION);
    // l'identifiant consommé est rendu seulement si la ligne du principal était la dernière créée (sinon la séquence reste, sans conséquence)
    const maxId = one(db, "SELECT COALESCE(MAX(id), 0) m FROM mk_sites").m;
    if (maxId < p.primaryId) db.prepare("UPDATE sqlite_sequence SET seq = ? WHERE name = 'mk_sites'").run(maxId);
    const after = tableCounts(db), diff = Object.keys(after).filter((t) => after[t] !== (before.counts[t] ?? 0));
    if (JSON.stringify(diff.sort()) !== JSON.stringify(["mk_sites", "schema_migrations"]) || after.mk_sites !== before.counts.mk_sites - 1) throw new Error(`comptes de lignes inattendus : ${diff.join(", ")}`);
    if (JSON.stringify(secondaries(db)) !== before.sites) throw new Error("les lignes des sites ordinaires ont changé");
    if (columns(db, "mk_sites").includes("is_primary")) throw new Error("la colonne is_primary est toujours présente");
    if (all(db, "PRAGMA foreign_key_check").length) throw new Error("foreign_key_check en échec après retour arrière");
    if (Object.values(one(db, "PRAGMA integrity_check"))[0] !== "ok") throw new Error("integrity_check en échec après retour arrière");
    db.exec("COMMIT");
    return { retire: p.primaryId };
  } catch (err) { try { db.exec("ROLLBACK"); } catch { /* transaction déjà terminée */ } throw new Error(`Retour arrière annulé (aucune modification conservée) : ${err.message}`); }
}
function etat(db) {
  const colExists = has(db, "mk_sites") && columns(db, "mk_sites").includes("is_primary"), logged = applied(db);
  const prim = colExists ? all(db, "SELECT id, name, slug FROM mk_sites WHERE is_primary = 1") : [];
  return { appliquee: colExists && logged, coherent: colExists === logged, principal: prim[0] || null, signature: signature(db) };
}

module.exports = { prerequis, appliquer, retourPrerequis, retour, etat, signature, structure, tableCounts, secondaries, siteColumns, SCOPE, VERSION, CHECKSUM, PRIMARY, UP, DOWN };
