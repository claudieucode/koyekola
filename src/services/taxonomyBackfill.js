// Reprise unique (à la création des tables de taxonomie) des catégories, sous-catégories et étiquettes saisies jusqu'ici en texte
// dans les articles : chaque valeur devient un terme, chaque article reçoit ses relations. Rien n'est supprimé ni modifié dans
// posts (les colonnes texte restent, comme miroir). Reçoit la base en paramètre (appelée pendant le chargement de database.js).
const { slugify } = require("../utils/format");

module.exports = function backfillFromPosts(db) {
  const posts = db.prepare("SELECT id, category, subcategory, tags FROM posts ORDER BY id").all();
  if (!posts.length) return;
  const clean = (v, max) => String(v || "").replace(/\s+/g, " ").trim().slice(0, max);
  const bySlug = db.prepare("SELECT id FROM taxonomy_terms WHERE taxonomy = ? AND slug = ?");
  const insert = db.prepare("INSERT INTO taxonomy_terms (taxonomy, name, slug, parent_id) VALUES (?, ?, ?, ?)");
  // Terme (taxonomie, nom, parent) : le même nom écrit autrement (casse, accents) est le même terme ; adresse unique par taxonomie
  const termFor = (taxonomy, name, parentId = null) => {
    const base = slugify(name).slice(0, 80) || "terme";
    let slug = base;
    for (let n = 2; ; n++) {
      const hit = bySlug.get(taxonomy, slug);
      if (!hit) return Number(insert.run(taxonomy, name, slug, parentId).lastInsertRowid);
      const same = db.prepare("SELECT parent_id FROM taxonomy_terms WHERE id = ?").get(hit.id);
      if ((same.parent_id ?? null) === (parentId ?? null) && slug === base) return hit.id;
      slug = `${base}-${n}`;
    }
  };
  const link = db.prepare("INSERT OR IGNORE INTO taxonomy_relations (content_type, content_id, term_id, is_primary, position) VALUES ('post', ?, ?, ?, ?)");
  db.exec("SAVEPOINT taxonomy_backfill");
  try {
    for (const p of posts) {
      let position = 0;
      const category = clean(p.category, 60);
      if (category) {
        const root = termFor("category", category, null);
        const sub = clean(p.subcategory, 60);
        const primary = sub ? termFor("category", sub, root) : root;
        link.run(p.id, primary, 1, position++);
      }
      const seen = new Set();
      for (const raw of String(p.tags || "").split(",")) {
        const tag = clean(raw, 40);
        const key = slugify(tag);
        if (!tag || !key || seen.has(key)) continue;
        seen.add(key);
        link.run(p.id, termFor("tag", tag, null), 0, position++);
      }
    }
    db.exec("RELEASE taxonomy_backfill");
  } catch (e) { db.exec("ROLLBACK TO taxonomy_backfill"); db.exec("RELEASE taxonomy_backfill"); throw e; }
};
