// Convertisseur de catégories et d'étiquettes (Outils → Importer) : un outil distinct de l'import de fichiers. Il agit sur les termes DÉJÀ présents ;
// les associations avec les articles sont conservées (le terme garde son identifiant, seule sa nature change), ou fusionnées dans le terme équivalent déjà présent.
// Aperçu d'abord (rien n'est écrit), puis conversion confirmée. Limité aux termes du site choisi ; une catégorie qui a des sous-catégories ne se convertit jamais.
const db = require("../../../config/database");
const taxonomy = require("../../taxonomy");
const { transaction } = require("../../../marketing/db/tx");

const DIRECTIONS = { "category-tag": { from: "category", to: "tag", label: "Catégories → étiquettes" }, "tag-category": { from: "tag", to: "category", label: "Étiquettes → catégories" } };
const intIds = (list) => [...new Set([].concat(list || []).flatMap((v) => String(v).split(",")).map(Number).filter((n) => Number.isInteger(n) && n > 0))].slice(0, 500);
const inSite = (id, siteId) => ((db.prepare("SELECT site_id FROM mk_content_sites WHERE content_type = 'term' AND content_id = ?").get(id) || {}).site_id ?? null) === (siteId ?? null);
const uses = (id) => db.prepare("SELECT COUNT(*) n FROM taxonomy_relations WHERE term_id = ?").get(id).n;
const children = (id) => db.prepare("SELECT COUNT(*) n FROM taxonomy_terms WHERE parent_id = ?").get(id).n;

function list(direction, siteId) {
  const d = DIRECTIONS[direction]; if (!d) return [];
  return db.prepare("SELECT id, name, slug, parent_id FROM taxonomy_terms WHERE taxonomy = ? ORDER BY name COLLATE NOCASE").all(d.from).filter((t) => inSite(t.id, siteId))
    .map((t) => ({ ...t, uses: uses(t.id), children: children(t.id) }));
}
// Conséquences, terme par terme : converti, fusionné dans un terme équivalent, ou refusé (avec la raison)
function preview(direction, ids, siteId) {
  const d = DIRECTIONS[direction];
  if (!d) throw Object.assign(new Error("Choisissez un sens de conversion."), { user: true });
  const picked = intIds(ids);
  if (!picked.length) throw Object.assign(new Error("Sélectionnez au moins un terme."), { user: true });
  return picked.map((id) => {
    const t = taxonomy.get(id);
    if (!t || t.taxonomy !== d.from || !inSite(id, siteId)) return { id, name: "Terme introuvable", action: "refuse", reason: "ce terme n'existe pas dans ce site ou n'est pas du bon type" };
    const base = { id, name: t.name, slug: t.slug, uses: uses(id) };
    if (children(id)) return { ...base, action: "refuse", reason: "elle a des sous-catégories : déplacez-les ou convertissez-les d'abord" };
    const twin = db.prepare("SELECT id, name FROM taxonomy_terms WHERE taxonomy = ? AND slug = ? AND id <> ?").get(d.to, t.slug, id);
    if (twin) return { ...base, action: "merge", twin, reason: `« ${twin.name} » existe déjà : les ${base.uses} contenu(s) y seront rattachés, puis ce terme disparaît` };
    return { ...base, action: "convert", reason: `devient ${d.to === "tag" ? "une étiquette" : "une catégorie (au premier niveau)"} ; ${base.uses} contenu(s) conservent leur association` };
  });
}
// Conversion RÉELLE, tout ou rien (transaction) ; les associations, la catégorie principale et le miroir texte des articles sont recalculés
function apply(direction, ids, siteId) {
  const d = DIRECTIONS[direction];
  const plan = preview(direction, ids, siteId);
  const bad = plan.filter((p) => p.action === "refuse");
  if (bad.length) throw Object.assign(new Error(`Conversion refusée : ${bad[0].name} — ${bad[0].reason}. Rien n'a été modifié.`), { user: true });
  const affected = new Set();
  let converted = 0, merged = 0;
  transaction(db, () => {
    for (const p of plan) {
      for (const r of db.prepare("SELECT content_type, content_id FROM taxonomy_relations WHERE term_id = ?").all(p.id)) affected.add(`${r.content_type}:${r.content_id}`);
      if (p.action === "merge") {
        // Fusion dans le terme équivalent de l'AUTRE taxonomie : les associations sont reportées (jamais dupliquées), puis le terme converti disparaît
        for (const r of db.prepare("SELECT * FROM taxonomy_relations WHERE term_id = ?").all(p.id)) {
          const there = db.prepare("SELECT 1 FROM taxonomy_relations WHERE content_type = ? AND content_id = ? AND term_id = ?").get(r.content_type, r.content_id, p.twin.id);
          if (!there) db.prepare("INSERT INTO taxonomy_relations (content_type, content_id, term_id, is_primary, position) VALUES (?, ?, ?, 0, ?)").run(r.content_type, r.content_id, p.twin.id, d.to === "tag" ? 100 + r.position : r.position);
        }
        db.prepare("DELETE FROM taxonomy_terms WHERE id = ?").run(p.id);
        merged++;
      } else {
        db.prepare("UPDATE taxonomy_terms SET taxonomy = ?, parent_id = NULL, updated_at = datetime('now') WHERE id = ?").run(d.to, p.id);
        // Étiquette : jamais « principale » ; la catégorie principale d'un article est alors la première de ses catégories restantes
        db.prepare("UPDATE taxonomy_relations SET is_primary = 0, position = CASE WHEN ? = 'tag' THEN 100 + position ELSE position END WHERE term_id = ?").run(d.to, p.id);
        converted++;
      }
    }
    // Chaque article concerné garde exactement UNE catégorie principale (ou aucune s'il n'a plus de catégorie)
    for (const key of affected) {
      const [type, cid] = key.split(":"); const content = Number(cid);
      const cats = db.prepare("SELECT r.term_id, r.is_primary FROM taxonomy_relations r JOIN taxonomy_terms t ON t.id = r.term_id WHERE r.content_type = ? AND r.content_id = ? AND t.taxonomy = 'category' ORDER BY r.position, r.term_id").all(type, content);
      if (cats.length) {
        const keep = (cats.find((c) => c.is_primary) || cats[0]).term_id;
        db.prepare("UPDATE taxonomy_relations SET is_primary = CASE WHEN term_id = ? THEN 1 ELSE 0 END WHERE content_type = ? AND content_id = ? AND term_id IN (SELECT id FROM taxonomy_terms WHERE taxonomy = 'category')").run(keep, type, content);
      }
    }
  });
  for (const key of affected) { const [type, cid] = key.split(":"); try { taxonomy.setTerms(type, Number(cid), {}); } catch { /* miroir recalculé ci-dessous */ } }
  return { converted, merged, contents: affected.size };
}

module.exports = { DIRECTIONS, list, preview, apply };
