// Reprise des rattachements après reconstruction (R6 lot 5) : copie le site d'un article / d'un terme, enregistré par le lot 1 dans mk_content_sites, vers la colonne site_id
// que la reconstruction vient d'ajouter à `posts` et `taxonomy_terms`. PURE et prudente :
//  - elle ne change AUCUNE adresse (ni posts.slug, ni l'adresse logique) : mk_content_sites reste la source des adresses logiques ;
//  - elle ne traite que les cas SANS ambiguïté ; tout cas signalé par reconstructionChecks (adresses en collision, taxonomie partagée, site supprimé…) est EXCLU et listé ;
//  - elle n'écrit que si la colonne existe, vide (NULL), et vérifie chaque écriture.
const checks = require("./reconstructionChecks");
const has = (db, t, col) => db.prepare(`PRAGMA table_info("${t}")`).all().some((c) => c.name === col);
const TABLES = { post: "posts", term: "taxonomy_terms" };

// Plan : { assign: [{ type, id, siteId }], skipped: [{ type, id, reason }] } — sans rien écrire
function plan(db, found = checks.run(db)) {
  const excluded = new Map(found.exclusions.map((e) => [`${e.type}:${e.id}`, e.reason]));
  const assign = [], skipped = [];
  let rows = [];
  try { rows = db.prepare("SELECT cs.content_type AS type, cs.content_id AS id, cs.site_id AS siteId, s.deleted_at FROM mk_content_sites cs LEFT JOIN mk_sites s ON s.id = cs.site_id ORDER BY cs.content_type, cs.content_id").all(); } catch { return { assign, skipped }; }
  for (const r of rows) {
    if (!TABLES[r.type]) continue;
    if (!db.prepare(`SELECT 1 FROM ${TABLES[r.type]} WHERE id = ?`).get(r.id)) { skipped.push({ type: r.type, id: r.id, reason: "contenu inexistant" }); continue; }
    const why = excluded.get(`${r.type}:${r.id}`) || (r.deleted_at !== null && r.deleted_at !== undefined ? "site supprimé" : (r.siteId === null ? "site inconnu" : null));
    why ? skipped.push({ type: r.type, id: r.id, reason: why }) : assign.push({ type: r.type, id: r.id, siteId: r.siteId });
  }
  return { assign, skipped };
}
// Écrit le plan (à appeler après la reconstruction, dans sa transaction) ; refuse toute écriture inattendue
function apply(db, p = plan(db)) {
  const done = { post: 0, term: 0 };
  for (const a of p.assign) {
    const table = TABLES[a.type];
    if (!has(db, table, "site_id")) throw new Error(`${table} : colonne site_id absente (la reconstruction doit précéder la reprise)`);
    const changed = db.prepare(`UPDATE ${table} SET site_id = ? WHERE id = ? AND site_id IS NULL`).run(a.siteId, a.id).changes;
    if (changed !== 1) throw new Error(`${table} #${a.id} : reprise du rattachement refusée (déjà rattaché ou inexistant)`);
    done[a.type]++;
  }
  return { ...done, skipped: p.skipped.length };
}

module.exports = { plan, apply };
