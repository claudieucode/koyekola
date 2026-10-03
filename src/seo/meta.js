// Réglages SEO par contenu (« surcharges ») pour ce qui n'a pas ses propres colonnes : formations, catégories de formations,
// catégories d'articles, étiquettes, auteurs, pages fixes. Les ARTICLES gardent leurs colonnes (table posts), lues par le
// même moteur. Valeur vide = automatique (modèle ou valeur calculée). Chaque modification est journalisée.
const { db, logChange } = require("./store");
const { SAFE_PATH, HTTPS_URL } = require("./settings");

const TYPES = {
  page: { label: "Page", keys: { home: "Accueil", catalogue: "Catalogue", blog: "Blog", "a-propos": "À propos", faq: "Questions fréquentes", contact: "Contact" } },
  course: { label: "Formation" },
  course_category: { label: "Catégorie de formations" },
  blog_category: { label: "Catégorie d'articles" },
  blog_tag: { label: "Étiquette" },
  author: { label: "Auteur" },
};
const FIELDS = {
  seo_title: { label: "Titre SEO", max: 70 },
  seo_description: { label: "Méta description", max: 160 },
  canonical_url: { label: "URL canonique", max: 500, url: true },
  robots_index: { label: "Indexation", tri: true },
  robots_follow: { label: "Suivi des liens", tri: true },
  og_title: { label: "Titre de partage", max: 95 },
  og_description: { label: "Description de partage", max: 200 },
  og_image_path: { label: "Image de partage", image: true },
  twitter_card: { label: "Carte X", choices: ["", "summary", "summary_large_image"] },
  focus_keyword: { label: "Mot-clé principal", max: 80 },
  secondary_keywords: { label: "Mots-clés secondaires", max: 400 },
};
const EMPTY = Object.fromEntries(Object.keys(FIELDS).map((k) => [k, null]));

const validType = (type) => Object.hasOwn(TYPES, type);
const validKey = (type, key) => (type === "page" ? Object.hasOwn(TYPES.page.keys, key) : /^[a-z0-9-]{1,120}$/.test(String(key)));

function get(type, key) {
  if (!validType(type)) return { ...EMPTY };
  const row = db.prepare("SELECT * FROM seo_meta WHERE entity_type = ? AND entity_key = ?").get(type, String(key));
  return row ? { ...EMPTY, ...row } : { ...EMPTY };
}

// Champs communs aux formations et aux pages qui ont déjà une colonne ailleurs : lus/écrits à leur place (une seule source)
const EXTERNAL = {
  course: { table: "courses", where: "id = ?", fields: ["seo_title", "seo_description"] },
};

function normalize(input) {
  const errors = [];
  const out = {};
  for (const [k, f] of Object.entries(FIELDS)) {
    if (!Object.hasOwn(input, k)) continue;
    let v = input[k];
    if (f.tri) { out[k] = v === "1" || v === 1 || v === true ? 1 : v === "0" || v === 0 || v === false ? 0 : null; continue; }
    v = String(v ?? "").replace(/\s+/g, " ").trim();
    if (!v) { out[k] = null; continue; }
    if (f.max && v.length > f.max) { errors.push(`${f.label} : ${f.max} caractères au plus.`); continue; }
    if (f.url && !HTTPS_URL.test(v)) { errors.push(`${f.label} : une adresse complète en https:// est attendue.`); continue; }
    if (f.image && !SAFE_PATH.test(v)) { errors.push(`${f.label} : choisissez une image de la médiathèque du site.`); continue; }
    if (f.choices && !f.choices.includes(v)) { errors.push(`${f.label} : choix invalide.`); continue; }
    out[k] = v;
  }
  return { out, errors };
}

function save(type, key, input, userId) {
  if (!validType(type) || !validKey(type, key)) return { ok: false, errors: ["Contenu inconnu."] };
  const { out, errors } = normalize(input);
  if (errors.length) return { ok: false, errors };
  const before = get(type, key);
  const ext = EXTERNAL[type];
  db.exec("BEGIN");
  try {
    if (ext) {
      const row = db.prepare(`SELECT ${ext.fields.join(", ")} FROM ${ext.table} WHERE ${ext.where}`).get(key);
      if (!row) throw Object.assign(new Error("missing"), { missing: true });
      const sets = ext.fields.filter((f) => Object.hasOwn(out, f));
      if (sets.length) db.prepare(`UPDATE ${ext.table} SET ${sets.map((f) => `${f} = ?`).join(", ")}, updated_at = datetime('now') WHERE ${ext.where}`).run(...sets.map((f) => out[f]), key);
      for (const f of sets) logChange({ entityType: type, entityKey: key, field: f, before: row[f], after: out[f], userId });
    }
    const own = Object.fromEntries(Object.entries(out).filter(([f]) => !(ext && ext.fields.includes(f))));
    if (Object.keys(own).length) {
      const merged = { ...before, ...own };
      const cols = Object.keys(FIELDS);
      db.prepare(`INSERT INTO seo_meta (entity_type, entity_key, ${cols.join(", ")}, updated_at, updated_by) VALUES (?, ?, ${cols.map(() => "?").join(", ")}, datetime('now'), ?)
        ON CONFLICT(entity_type, entity_key) DO UPDATE SET ${cols.map((c) => `${c} = excluded.${c}`).join(", ")}, updated_at = excluded.updated_at, updated_by = excluded.updated_by`)
        .run(type, String(key), ...cols.map((c) => merged[c]), userId ?? null);
      for (const f of Object.keys(own)) logChange({ entityType: type, entityKey: key, field: f, before: before[f], after: own[f], userId });
    }
    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    if (error.missing) return { ok: false, errors: ["Contenu introuvable."] };
    throw error;
  }
  return { ok: true };
}

// Valeurs effectivement enregistrées (y compris celles stockées ailleurs, ex. titre SEO d'une formation)
function stored(type, key) {
  const meta = get(type, key);
  const ext = EXTERNAL[type];
  if (ext) {
    const row = db.prepare(`SELECT ${ext.fields.join(", ")} FROM ${ext.table} WHERE ${ext.where}`).get(key);
    if (row) for (const f of ext.fields) meta[f] = row[f];
  }
  return meta;
}

module.exports = { TYPES, FIELDS, get, save, stored, validType, validKey };
