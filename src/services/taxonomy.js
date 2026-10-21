// Moteur de taxonomies de KOLAKISA (CMS, palier 5) : catégories (hiérarchiques), étiquettes (à plat) et futurs types, reliés à des
// contenus de tout type (article aujourd'hui ; pages, produits, cours demain) par une relation propre contenu ↔ terme.
//   taxonomy_terms      : id, taxonomy, name, slug (unique par taxonomie), description, parent_id, meta (préparation SEO)
//   taxonomy_relations  : content_type, content_id, term_id, is_primary (catégorie principale), position
// Aucun compteur n'est stocké : ils sont calculés dans la base à chaque lecture. Les colonnes posts.category / subcategory / tags
// restent comme MIROIR de lecture (catégorie principale → racine + sous-catégorie, étiquettes), tenu à jour ici à chaque changement :
// les lecteurs historiques (sitemap, pages dynamiques, SEO, listes) continuent de fonctionner sans modification.
const EventEmitter = require("events");
const db = require("../config/database");
const { slugify } = require("../utils/format");
const { UserError } = require("../utils/errors");
const { transaction } = require("../marketing/db/tx");

// ---------- Registres : types de taxonomie et types de contenu (extensibles) ----------
const bases = { category: process.env.TAXONOMY_CATEGORY_BASE || "/blog/categorie", tag: process.env.TAXONOMY_TAG_BASE || "/blog/etiquette" };
const TAXONOMIES = {
  category: { key: "category", label: "Catégorie", plural: "Catégories", hierarchical: true },
  tag: { key: "tag", label: "Étiquette", plural: "Étiquettes", hierarchical: false },
};
// « live » : contenu visible du public ; « all » : contenu existant (hors corbeille). Un nouveau type de contenu s'ajoute ici.
const CONTENT = {
  post: { table: "posts", label: "article", live: "published = 1 AND deleted_at IS NULL", all: "deleted_at IS NULL" },
};
const registerTaxonomy = (def) => { TAXONOMIES[def.key] = { hierarchical: false, plural: def.label, ...def }; if (def.base) bases[def.key] = def.base; };
const registerContent = (type, def) => { CONTENT[type] = def; };
const baseOf = (taxonomy) => bases[taxonomy] || `/${taxonomy}`;
const urlOf = (term) => `${baseOf(term.taxonomy)}/${term.slug}`;

const events = new EventEmitter(); // term.created / term.updated / term.deleted / term.merged / content.terms.changed (points d'accroche futurs)
const MAX_DEPTH = 10;
const MAX_NAME = 60;
let version = 0; // incrémenté à chaque écriture : invalide les caches de lecture
const bump = () => { version++; rootSlugCache = null; };
let rootSlugCache = null;

const clean = (v, max) => String(v ?? "").replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
const taxonomyOf = (key) => { const t = TAXONOMIES[key]; if (!t) throw new UserError("Taxonomie inconnue."); return t; };
const get = (id) => (Number.isInteger(id) ? db.prepare("SELECT * FROM taxonomy_terms WHERE id = ?").get(id) || null : null);
const bySlug = (taxonomy, slug) => db.prepare("SELECT * FROM taxonomy_terms WHERE taxonomy = ? AND slug = ?").get(taxonomy, String(slug || "")) || null;
const inList = (ids) => ids.map(() => "?").join(",");
// « published = 1 AND deleted_at IS NULL » → « c.published = 1 AND c.deleted_at IS NULL » (alias c de la table du contenu)
const q = (cond) => `c.${cond.replace(/ AND /g, " AND c.")}`;

// ---------- Hiérarchie ----------
// Le terme lui-même et tous ses descendants (catégories : un archive de catégorie montre aussi ses sous-catégories)
function subtreeIds(id) {
  return db.prepare("WITH RECURSIVE sub(id) AS (SELECT id FROM taxonomy_terms WHERE id = ? UNION ALL SELECT t.id FROM taxonomy_terms t JOIN sub s ON t.parent_id = s.id) SELECT id FROM sub").all(id).map((r) => r.id);
}
// Ancêtres du plus lointain au plus proche (sans le terme) : prépare fil d'Ariane, URL et SEO
function ancestors(id) {
  const rows = db.prepare("WITH RECURSIVE up(id, parent_id, depth) AS (SELECT id, parent_id, 0 FROM taxonomy_terms WHERE id = ? UNION ALL SELECT t.id, t.parent_id, u.depth + 1 FROM taxonomy_terms t JOIN up u ON t.id = u.parent_id WHERE u.depth < 50) SELECT t.* FROM up u JOIN taxonomy_terms t ON t.id = u.id WHERE u.id <> ? ORDER BY u.depth DESC").all(id, id);
  return rows;
}
const depthOf = (id) => ancestors(id).length;
const heightOf = (id) => {
  const r = db.prepare("WITH RECURSIVE sub(id, d) AS (SELECT id, 0 FROM taxonomy_terms WHERE id = ? UNION ALL SELECT t.id, s.d + 1 FROM taxonomy_terms t JOIN sub s ON t.parent_id = s.id) SELECT MAX(d) m FROM sub").get(id);
  return r ? r.m : 0;
};

// ---------- Adresses ----------
// Adresse demandée (nettoyée) ou tirée du nom ; unique PAR TAXONOMIE (une catégorie « seo » et une étiquette « seo » coexistent)
// Site d'un terme (null = site principal). Le rattachement est écrit par siteContent.adopt juste après la création.
const siteOfTerm = (id) => { const r = db.prepare("SELECT site_id FROM mk_content_sites WHERE content_type = 'term' AND content_id = ?").get(id); return r ? r.site_id : null; };
// Les adresses publiques (/blog/categorie/<adresse>) sont communes à tous les sites : une adresse reste donc unique par taxonomie, tous sites confondus.
// Mais le nom d'un terme d'un AUTRE site n'est jamais révélé dans un message d'erreur. site === undefined : appel historique (noms visibles).
function slugFor(taxonomy, { name, wanted, exceptId = 0, site }) {
  const taken = (s) => db.prepare("SELECT id, name FROM taxonomy_terms WHERE taxonomy = ? AND slug = ? AND id <> ?").get(taxonomy, s, exceptId);
  if (wanted !== undefined && wanted !== null && String(wanted).trim() !== "") {
    const slug = slugify(String(wanted)).slice(0, 80).replace(/-+$/, "");
    if (!slug) throw new UserError("Adresse invalide : lettres, chiffres et tirets.");
    const hit = taken(slug);
    if (hit) throw new UserError(site === undefined || (siteOfTerm(hit.id) ?? null) === (site ?? null) ? `L'adresse « ${slug} » est déjà utilisée par « ${hit.name} ».` : `L'adresse « ${slug} » est déjà utilisée : choisissez-en une autre.`);
    return slug;
  }
  const base = slugify(name).slice(0, 80).replace(/-+$/, "") || "terme";
  let slug = base;
  for (let n = 2; taken(slug); n++) slug = `${base}-${n}`;
  return slug;
}

// ---------- Écriture des termes ----------
function checkParent(taxonomy, parentId, selfId = 0) {
  if (parentId === null || parentId === undefined || parentId === "") return null;
  if (!TAXONOMIES[taxonomy].hierarchical) throw new UserError("Cette taxonomie n'est pas hiérarchique : pas de parent.");
  const parent = get(Number(parentId));
  if (!parent || parent.taxonomy !== taxonomy) throw new UserError("Catégorie parente introuvable.");
  if (selfId) {
    if (parent.id === selfId) throw new UserError("Une catégorie ne peut pas être son propre parent.");
    if (subtreeIds(selfId).includes(parent.id)) throw new UserError("Cette catégorie est un ancêtre de la catégorie parente choisie : boucle impossible.");
  }
  if (depthOf(parent.id) + 1 + (selfId ? heightOf(selfId) : 0) >= MAX_DEPTH) throw new UserError(`La hiérarchie est limitée à ${MAX_DEPTH} niveaux.`);
  return parent.id;
}
// Un terme de même nom (casse et accents ignorés) au même endroit : même taxonomie, même parent et MÊME SITE (deux sites peuvent avoir chacun leur « Conseils »)
function findTwin(taxonomy, parent, nm, site, exceptId = 0) {
  return db.prepare("SELECT t.id, t.name FROM taxonomy_terms t WHERE t.taxonomy = ? AND COALESCE(t.parent_id, 0) = ? AND t.id <> ?").all(taxonomy, parent ?? 0, exceptId)
    .find((t) => (site === undefined || (siteOfTerm(t.id) ?? null) === (site ?? null)) && (t.name.toLowerCase() === nm.toLowerCase() || slugify(t.name) === slugify(nm))) || null;
}
// site : site du nouveau terme (null = principal) ; undefined = comportement historique (comparaison avec tous les sites)
function create({ taxonomy, name, slug, description = "", parentId = null, site }) {
  taxonomyOf(taxonomy);
  const nm = clean(name, MAX_NAME);
  if (!nm) throw new UserError(`Le nom ${taxonomy === "tag" ? "de l'étiquette" : "de la catégorie"} est obligatoire.`);
  const parent = checkParent(taxonomy, parentId);
  const twin = findTwin(taxonomy, parent, nm, site);
  if (twin) throw new UserError(`« ${twin.name} » existe déjà${parent ? " dans cette catégorie" : ""}.`);
  const row = db.prepare("INSERT INTO taxonomy_terms (taxonomy, name, slug, description, parent_id) VALUES (?, ?, ?, ?, ?) RETURNING *")
    .get(taxonomy, nm, slugFor(taxonomy, { name: nm, wanted: slug, site }), clean(description, 500), parent);
  bump(); events.emit("term.created", row);
  return row;
}
// Le nom change sans toucher à l'adresse (une adresse personnalisée n'est jamais recalculée) ; l'adresse ne change que si on la donne
function update(id, { name, slug, description, parentId } = {}) {
  const term = get(id);
  if (!term) throw new UserError("Terme introuvable.");
  const nm = name === undefined ? term.name : clean(name, MAX_NAME);
  if (!nm) throw new UserError("Le nom est obligatoire.");
  const parent = parentId === undefined ? term.parent_id : checkParent(term.taxonomy, parentId, id);
  const site = siteOfTerm(id);
  const twin = findTwin(term.taxonomy, parent, nm, site, id);
  if (twin) throw new UserError(`« ${twin.name} » existe déjà${parent ? " dans cette catégorie" : ""}.`);
  const nextSlug = slug === undefined || String(slug).trim() === "" ? term.slug : slugFor(term.taxonomy, { name: nm, wanted: slug, exceptId: id, site });
  db.prepare("UPDATE taxonomy_terms SET name = ?, slug = ?, description = ?, parent_id = ?, updated_at = datetime('now') WHERE id = ?")
    .run(nm, nextSlug, description === undefined ? term.description : clean(description, 500), parent, id);
  bump(); refreshMirrorsOfSubtree(id);
  const row = get(id); events.emit("term.updated", row, term);
  return row;
}

// Contenus rattachés à un terme (relations directes), par type
function usage(id) {
  const out = { total: 0, live: 0, byType: {} };
  for (const [type, def] of Object.entries(CONTENT)) {
    const r = db.prepare(`SELECT COUNT(*) total, COALESCE(SUM(${q(def.live)}), 0) live FROM taxonomy_relations r JOIN ${def.table} c ON c.id = r.content_id WHERE r.content_type = ? AND r.term_id = ? AND ${q(def.all)}`).get(type, id);
    out.byType[type] = r.total; out.total += r.total; out.live += r.live;
  }
  return out;
}
const relationCount = (id) => db.prepare("SELECT COUNT(*) n FROM taxonomy_relations WHERE term_id = ?").get(id).n;

// Supprime un terme. Utilisé : refusé sauf si on indique où réassigner ses contenus (reassignTo). Ses sous-catégories remontent
// d'un niveau (chez son parent). Aucune relation n'est jamais laissée orpheline.
function remove(id, { reassignTo = null, kind = "deleted" } = {}) {
  const term = get(id);
  if (!term) throw new UserError("Terme introuvable.");
  const used = relationCount(id);
  let target = null;
  if (reassignTo !== null && reassignTo !== undefined && reassignTo !== "") {
    target = get(Number(reassignTo));
    if (!target || target.taxonomy !== term.taxonomy) throw new UserError("Terme de destination introuvable.");
    if (target.id === id) throw new UserError("Choisissez un autre terme comme destination.");
  } else if (used) {
    throw new UserError(`« ${term.name} » est utilisé par ${used} contenu${used > 1 ? "s" : ""} : choisissez où les réassigner, ou fusionnez-le avec un autre terme. Rien n'est supprimé.`);
  }
  const affected = db.prepare("SELECT content_type, content_id FROM taxonomy_relations WHERE term_id = ?").all(id);
  transaction(db, () => {
    if (target) {
      for (const r of db.prepare("SELECT * FROM taxonomy_relations WHERE term_id = ?").all(id)) {
        const there = db.prepare("SELECT is_primary FROM taxonomy_relations WHERE content_type = ? AND content_id = ? AND term_id = ?").get(r.content_type, r.content_id, target.id);
        if (there) { if (r.is_primary && !there.is_primary) db.prepare("UPDATE taxonomy_relations SET is_primary = 1 WHERE content_type = ? AND content_id = ? AND term_id = ?").run(r.content_type, r.content_id, target.id); }
        else db.prepare("INSERT INTO taxonomy_relations (content_type, content_id, term_id, is_primary, position) VALUES (?, ?, ?, ?, ?)").run(r.content_type, r.content_id, target.id, r.is_primary, r.position);
      }
    }
    db.prepare("UPDATE taxonomy_terms SET parent_id = ?, updated_at = datetime('now') WHERE parent_id = ?").run(term.parent_id, id);
    db.prepare("DELETE FROM taxonomy_terms WHERE id = ?").run(id); // relations supprimées en cascade
  });
  bump();
  for (const a of affected) mirror(a.content_type, a.content_id);
  events.emit(kind === "merged" ? "term.merged" : "term.deleted", term, target);
  return { moved: used, to: target };
}
const merge = (sourceId, targetId) => remove(sourceId, { reassignTo: targetId, kind: "merged" });

// ---------- Lecture ----------
// Tri : clés fermées (jamais un nom de colonne reçu du navigateur). « n » = nombre de contenus existants (hors corbeille) du terme, calculé dans la requête.
const SORTS = {
  nom: "t.name COLLATE NOCASE ASC", nom_desc: "t.name COLLATE NOCASE DESC",
  slug: "t.slug COLLATE NOCASE ASC", slug_desc: "t.slug COLLATE NOCASE DESC",
  description: "t.description = '' ASC, t.description COLLATE NOCASE ASC, t.name COLLATE NOCASE ASC", description_desc: "t.description <> '' ASC, t.description COLLATE NOCASE DESC, t.name COLLATE NOCASE ASC",
  total: "n ASC, t.name COLLATE NOCASE ASC", total_desc: "n DESC, t.name COLLATE NOCASE ASC",
  utilisation: "n DESC, t.name COLLATE NOCASE ASC", recent: "t.id DESC", ancien: "t.id ASC",
};
// Sous-requête « contenus existants du terme » (un article compte une fois, jamais deux : la relation terme/contenu est unique)
const countSql = () => Object.entries(CONTENT).map(([type, def]) => `(SELECT COUNT(*) FROM taxonomy_relations r JOIN ${def.table} c ON c.id = r.content_id WHERE r.content_type = '${type}' AND r.term_id = t.id AND ${q(def.all)})`).join(" + ") || "0";
// Liste paginée (recherche par nom, adresse, description) avec le nombre d'utilisations CALCULÉ dans la base ; filtre parent (« 0 » = racines)
function list({ taxonomy, q = "", sort = "nom", page = 1, perPage = 30, parentId = "", unused = false, scope = null } = {}) {
  taxonomyOf(taxonomy);
  const where = ["t.taxonomy = ?"]; const args = [taxonomy];
  if (scope) { where.push(scope.sql); args.push(...scope.params); } // portée de site (R6 lot 2)
  const needle = String(q || "").trim().slice(0, 80);
  if (needle) { const like = `%${needle.replace(/[\\%_]/g, (c) => `\\${c}`)}%`; where.push("(t.name LIKE ? ESCAPE '\\' OR t.slug LIKE ? ESCAPE '\\' OR t.description LIKE ? ESCAPE '\\')"); args.push(like, like, like); }
  if (parentId === "0" || parentId === 0) where.push("t.parent_id IS NULL");
  else if (/^\d+$/.test(String(parentId))) { where.push("t.parent_id = ?"); args.push(Number(parentId)); }
  if (unused) where.push("NOT EXISTS (SELECT 1 FROM taxonomy_relations r WHERE r.term_id = t.id)");
  const total = db.prepare(`SELECT COUNT(*) n FROM taxonomy_terms t WHERE ${where.join(" AND ")}`).get(...args).n;
  const pages = Math.max(1, Math.ceil(total / perPage));
  const current = Math.min(Math.max(1, Number(page) || 1), pages);
  const rows = db.prepare(`SELECT t.*, (${countSql()}) AS n, p.name AS parent_name FROM taxonomy_terms t LEFT JOIN taxonomy_terms p ON p.id = t.parent_id
    WHERE ${where.join(" AND ")} ORDER BY ${SORTS[sort] || SORTS.nom} LIMIT ? OFFSET ?`).all(...args, perPage, (current - 1) * perPage);
  return { rows: withCounts(rows), total, page: current, pages, perPage };
}
// Utilisations des termes affichés : tous les contenus existants et ceux visibles du public (une requête pour toute la page)
function withCounts(rows) {
  if (!rows.length) return rows;
  const ids = rows.map((r) => r.id);
  const out = new Map(ids.map((i) => [i, { all: 0, live: 0 }]));
  for (const [type, def] of Object.entries(CONTENT)) {
    for (const r of db.prepare(`SELECT r.term_id, COUNT(*) a, COALESCE(SUM(${q(def.live)}), 0) l FROM taxonomy_relations r JOIN ${def.table} c ON c.id = r.content_id WHERE r.content_type = ? AND r.term_id IN (${inList(ids)}) AND ${q(def.all)} GROUP BY r.term_id`).all(type, ...ids)) {
      const o = out.get(r.term_id); o.all += r.a; o.live += r.l;
    }
  }
  return rows.map((r) => ({ ...r, total: out.get(r.id).all, live: out.get(r.id).live }));
}
// Catégories en arbre (ordre de lecture : parent puis enfants, par nom) avec profondeur ; recherche : liste à plat des correspondances
function tree(taxonomy = "category", scope = null) {
  const all = db.prepare(`SELECT t.*, (SELECT COUNT(*) FROM taxonomy_relations r WHERE r.term_id = t.id) AS n FROM taxonomy_terms t WHERE t.taxonomy = ?${scope ? " AND " + scope.sql : ""} ORDER BY t.name COLLATE NOCASE`).all(taxonomy, ...(scope ? scope.params : []));
  const kids = new Map();
  for (const t of all) kids.set(t.parent_id ?? 0, [...(kids.get(t.parent_id ?? 0) || []), t]);
  const out = [];
  const walk = (parent, depth, path) => { for (const t of kids.get(parent) || []) { if (path.has(t.id)) continue; out.push({ ...t, depth }); walk(t.id, depth + 1, new Set([...path, t.id])); } };
  walk(0, 0, new Set());
  return out;
}
// Contenus d'un terme ET de ses sous-termes, comptés une seule fois chacun
function subtreeCount(id, scope = "live") {
  const ids = subtreeIds(id);
  let total = 0;
  for (const [type, def] of Object.entries(CONTENT)) {
    total += db.prepare(`SELECT COUNT(DISTINCT r.content_id) n FROM taxonomy_relations r JOIN ${def.table} c ON c.id = r.content_id WHERE r.content_type = ? AND r.term_id IN (${inList(ids)}) AND ${q(scope === "all" ? def.all : def.live)}`).get(type, ...ids).n;
  }
  return total;
}
// Sous-requête « contenus du terme (et de ses sous-termes) » pour filtrer une liste de contenus
function contentFilter(type, termIds) {
  return { sql: `id IN (SELECT content_id FROM taxonomy_relations WHERE content_type = ? AND term_id IN (${inList(termIds)}))`, args: [type, ...termIds] };
}
// Termes ayant au moins un contenu public (catégories : sous-catégories comprises), avec leur nombre de contenus : plan du site, menus
function publicTerms(taxonomy, type = "post") {
  reconcile();
  const def = CONTENT[type];
  if (TAXONOMIES[taxonomy].hierarchical) {
    return db.prepare(`WITH RECURSIVE anc(term_id, anc_id) AS (SELECT id, id FROM taxonomy_terms WHERE taxonomy = ? UNION ALL SELECT a.term_id, t.parent_id FROM anc a JOIN taxonomy_terms t ON t.id = a.anc_id WHERE t.parent_id IS NOT NULL)
      SELECT t.*, COUNT(DISTINCT r.content_id) n FROM anc a JOIN taxonomy_terms t ON t.id = a.anc_id JOIN taxonomy_relations r ON r.term_id = a.term_id AND r.content_type = ?
      JOIN ${def.table} c ON c.id = r.content_id WHERE ${q(def.live)} GROUP BY t.id ORDER BY n DESC, t.name COLLATE NOCASE`).all(taxonomy, type);
  }
  return db.prepare(`SELECT t.*, COUNT(DISTINCT r.content_id) n FROM taxonomy_terms t JOIN taxonomy_relations r ON r.term_id = t.id AND r.content_type = ? JOIN ${def.table} c ON c.id = r.content_id
    WHERE t.taxonomy = ? AND ${q(def.live)} GROUP BY t.id ORDER BY n DESC, t.name COLLATE NOCASE`).all(type, taxonomy);
}
// Recherche transversale (futur moteur de recherche global) : termes de toutes les taxonomies
const search = (q, limit = 10) => {
  const needle = String(q || "").trim().slice(0, 80);
  if (!needle) return [];
  const like = `%${needle.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;
  return db.prepare("SELECT * FROM taxonomy_terms WHERE name LIKE ? ESCAPE '\\' OR slug LIKE ? ESCAPE '\\' ORDER BY name COLLATE NOCASE LIMIT ?").all(like, like, limit).map((t) => ({ ...t, url: urlOf(t) }));
};

// ---------- Relations contenu ↔ termes ----------
function termsOf(type, id) {
  const rows = db.prepare("SELECT t.*, r.is_primary, r.position FROM taxonomy_relations r JOIN taxonomy_terms t ON t.id = r.term_id WHERE r.content_type = ? AND r.content_id = ? ORDER BY r.position, t.name COLLATE NOCASE").all(type, id);
  const categories = rows.filter((r) => r.taxonomy === "category").map((r) => ({ ...r, isPrimary: Boolean(r.is_primary), url: urlOf(r) }));
  const tags = rows.filter((r) => r.taxonomy === "tag").map((r) => ({ ...r, isPrimary: false, url: urlOf(r) }));
  const primary = categories.find((c) => c.isPrimary) || categories[0] || null;
  return { categories, tags, primary, others: rows.filter((r) => r.taxonomy !== "category" && r.taxonomy !== "tag") };
}
const uniqueIds = (list) => [...new Set((Array.isArray(list) ? list : String(list || "").split(",")).map((v) => Number(v)).filter((n) => Number.isInteger(n) && n > 0))];
// Remplace les catégories et/ou étiquettes d'un contenu. categoryIds / tagIds absents = inchangés. primaryId : catégorie principale
// (une des catégories choisies ; par défaut la première). Tout ou rien (transaction).
function setTerms(type, id, { categoryIds, primaryId, tagIds } = {}) {
  if (!CONTENT[type]) throw new UserError("Type de contenu inconnu.");
  const before = JSON.stringify(termsOf(type, id).categories.map((c) => [c.id, c.isPrimary]).concat(termsOf(type, id).tags.map((t) => [t.id, 0])));
  transaction(db, () => {
    const check = (ids, taxonomy) => ids.map((tid) => { const t = get(tid); if (!t || t.taxonomy !== taxonomy) throw new UserError(`${TAXONOMIES[taxonomy].label} introuvable (#${tid}).`); return t; });
    if (categoryIds !== undefined) {
      const ids = uniqueIds(categoryIds); check(ids, "category");
      const primary = ids.includes(Number(primaryId)) ? Number(primaryId) : ids[0] ?? null;
      if (primaryId && ids.length && !ids.includes(Number(primaryId))) throw new UserError("La catégorie principale doit faire partie des catégories choisies.");
      db.prepare("DELETE FROM taxonomy_relations WHERE content_type = ? AND content_id = ? AND term_id IN (SELECT id FROM taxonomy_terms WHERE taxonomy = 'category')").run(type, id);
      ids.forEach((tid, i) => db.prepare("INSERT INTO taxonomy_relations (content_type, content_id, term_id, is_primary, position) VALUES (?, ?, ?, ?, ?)").run(type, id, tid, tid === primary ? 1 : 0, i));
    }
    if (tagIds !== undefined) {
      const ids = uniqueIds(tagIds); check(ids, "tag");
      db.prepare("DELETE FROM taxonomy_relations WHERE content_type = ? AND content_id = ? AND term_id IN (SELECT id FROM taxonomy_terms WHERE taxonomy = 'tag')").run(type, id);
      ids.forEach((tid, i) => db.prepare("INSERT INTO taxonomy_relations (content_type, content_id, term_id, is_primary, position) VALUES (?, ?, ?, 0, ?)").run(type, id, tid, 100 + i));
    }
  });
  bump(); mirror(type, id);
  const after = termsOf(type, id);
  if (JSON.stringify(after.categories.map((c) => [c.id, c.isPrimary]).concat(after.tags.map((t) => [t.id, 0]))) !== before) events.emit("content.terms.changed", { type, id, terms: after });
  return after;
}
// Étiquette par son nom : l'existante (casse et accents ignorés) ou une nouvelle (création rapide)
function findOrCreateTag(name) {
  const nm = clean(name, 40);
  if (!nm) throw new UserError("Le nom de l'étiquette est obligatoire.");
  const existing = db.prepare("SELECT * FROM taxonomy_terms WHERE taxonomy = 'tag' AND slug = ?").get(slugify(nm).slice(0, 80)) || db.prepare("SELECT * FROM taxonomy_terms WHERE taxonomy = 'tag' AND LOWER(name) = LOWER(?)").get(nm);
  return existing || create({ taxonomy: "tag", name: nm });
}
// Ancienne saisie en texte (API, formulaires historiques) : catégorie (+ sous-catégorie) et étiquettes par leur nom, créés au besoin
function assignByNames(type, id, { category, subcategory, tags } = {}) {
  const input = {};
  if (category !== undefined || subcategory !== undefined) {
    const cat = clean(category, MAX_NAME), sub = clean(subcategory, MAX_NAME);
    if (!cat) input.categoryIds = [];
    else {
      const root = findCategory(cat, null) || create({ taxonomy: "category", name: cat });
      const primary = sub ? (findCategory(sub, root.id) || create({ taxonomy: "category", name: sub, parentId: root.id })) : root;
      input.categoryIds = [primary.id]; input.primaryId = primary.id;
    }
  }
  if (tags !== undefined) {
    const names = Array.isArray(tags) ? tags : String(tags || "").split(",");
    const seen = new Set();
    input.tagIds = names.map((n) => clean(n, 40)).filter((n) => n && !seen.has(slugify(n)) && seen.add(slugify(n))).slice(0, 10).map((n) => findOrCreateTag(n).id);
  }
  return setTerms(type, id, input);
}
const findCategory = (name, parentId) => db.prepare("SELECT * FROM taxonomy_terms WHERE taxonomy = 'category' AND COALESCE(parent_id, 0) = ?").all(parentId ?? 0).find((t) => slugify(t.name) === slugify(name)) || null;

// Articles écrits par une autre voie que l'éditeur (import, génération, SQL) : leurs anciens textes catégorie/étiquettes sont
// convertis en relations au premier passage public ou admin. Requête légère (aucun article concerné dans le cas courant).
function reconcile() {
  const rows = db.prepare(`SELECT id, category, subcategory, tags FROM posts p WHERE p.deleted_at IS NULL AND (p.category <> '' OR p.tags <> '') AND NOT EXISTS (SELECT 1 FROM taxonomy_relations r WHERE r.content_type = 'post' AND r.content_id = p.id) LIMIT 200`).all();
  for (const r of rows) { try { assignByNames("post", r.id, { category: r.category, subcategory: r.subcategory, tags: r.tags }); } catch (e) { if (!(e instanceof UserError)) throw e; } }
  return rows.length;
}

// ---------- Miroir texte des articles (posts.category / subcategory / tags) ----------
function mirror(type, id) {
  if (type !== "post") return;
  const t = termsOf("post", id);
  let category = "", subcategory = "";
  if (t.primary) {
    const lineage = ancestors(t.primary.id);
    if (lineage.length) { category = lineage[0].name; subcategory = t.primary.name; } else category = t.primary.name;
  }
  db.prepare("UPDATE posts SET category = ?, subcategory = ?, tags = ? WHERE id = ?").run(category, subcategory, t.tags.map((x) => x.name).join(", "), id);
}
function refreshMirrorsOfSubtree(termId) {
  const ids = subtreeIds(termId);
  const rows = db.prepare(`SELECT DISTINCT content_type, content_id FROM taxonomy_relations WHERE term_id IN (${inList(ids)})`).all(...ids);
  for (const r of rows) mirror(r.content_type, r.content_id);
}
// Nom du terme racine → adresse (cartes d'articles, liens) ; mis en cache jusqu'à la prochaine écriture
function categorySlugOfName(name) {
  if (!name) return "";
  if (!rootSlugCache) rootSlugCache = new Map(db.prepare("SELECT LOWER(name) n, slug FROM taxonomy_terms WHERE taxonomy = 'category' AND parent_id IS NULL").all().map((r) => [r.n, r.slug]));
  return rootSlugCache.get(String(name).toLowerCase()) || slugify(name);
}

module.exports = {
  TAXONOMIES, CONTENT, registerTaxonomy, registerContent, baseOf, urlOf, events,
  get, bySlug, create, update, remove, merge, usage, list, tree, counts: withCounts, SORTS, subtreeIds, subtreeCount, ancestors, contentFilter, publicTerms, search,
  termsOf, reconcile, setTerms, findOrCreateTag, assignByNames, categorySlugOfName, mirror, uniqueIds, version: () => version,
};
