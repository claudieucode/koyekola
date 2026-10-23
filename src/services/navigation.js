// KOLAKISA CMS → moteur de navigation (palier 7). Menus, éléments (hiérarchie + ordre) et emplacements, INDÉPENDANT de l'apparence :
// l'en-tête, le pied de page (et demain l'éditeur du site, les menus contextuels, le méga-menu) demandent un menu par emplacement.
// Un élément qui vise une ressource KOLAKISA garde sa référence (type + object_id) : l'adresse est recalculée à chaque rendu par les
// résolveurs ci-dessous (slug modifié = lien toujours bon ; ressource supprimée ou non publiée = état signalé, jamais un lien mort).
const EventEmitter = require("events");
const { sameScope } = require("./siteScope"); // R9-2 : égalité de portée « principal ou site » (siteScope)
const db = require("../config/database");
const taxonomy = require("./taxonomy");
const { slugify } = require("../utils/format");
const { UserError } = require("../utils/errors");
const { transaction } = require("../marketing/db/tx");

const MAX_DEPTH = 3;          // niveaux d'un menu (Services › Web › WordPress)
const MAX_ITEMS = 300;        // éléments par menu
const MAX_LABEL = 80;
const events = new EventEmitter(); // menu.created / menu.updated / menu.deleted / menu.assigned / items.changed (points d'accroche futurs)
const emit = (name, payload) => { try { events.emit(name, { event: name, at: new Date().toISOString(), ...payload }); } catch { /* un abonné ne casse jamais l'action */ } };

// ---------- Emplacements (extensibles : sidebar, menu utilisateur, tunnel… s'ajoutent ici) ----------
const LOCATIONS = {
  header: { key: "header", label: "En-tête du site", hint: "Barre de navigation en haut de toutes les pages publiques." },
  footer: { key: "footer", label: "Pied de page", hint: "Colonnes de liens en bas de toutes les pages publiques." },
  mobile: { key: "mobile", label: "Menu mobile", hint: "Tiroir des petits écrans. Sans menu mobile, le menu de l'en-tête est utilisé." },
};
const registerLocation = (def) => { LOCATIONS[def.key] = def; };

// R8 lot 4 — menus PAR SITE : une ressource ne peut figurer que dans un menu de SON site (un menu du site principal garde son comportement historique : aucune restriction)
const siteContent = () => require("./siteContent");
function termSearch(kind, q, limit, siteId) {
  if (!Number.isInteger(siteId)) return taxonomy.list({ taxonomy: kind, q, perPage: limit, sort: "nom" }).rows.map((t) => ({ id: t.id, title: t.name, detail: taxonomy.urlOf(t) }));
  return db.prepare(`SELECT t.id FROM taxonomy_terms t WHERE t.taxonomy = ? AND t.name LIKE ? ESCAPE '\\' AND EXISTS (SELECT 1 FROM mk_content_sites cs WHERE cs.content_type = 'term' AND cs.content_id = t.id AND cs.site_id = ?) ORDER BY t.name COLLATE NOCASE LIMIT ?`)
    .all(kind, like(q), siteId, limit).map((r) => taxonomy.get(r.id)).filter(Boolean).map((t) => ({ id: t.id, title: t.name, detail: taxonomy.urlOf(t) }));
}
function inSiteScope(type, oid, siteId) {
  if (!Number.isInteger(siteId)) return true;
  if (type === "page") return Boolean(db.prepare("SELECT 1 FROM mk_landing_pages WHERE id = ? AND site_id = ?").get(oid, siteId));
  if (type === "article") return siteContent().siteOf(db, "post", oid) === siteId;
  if (type === "category" || type === "tag") return siteContent().siteOf(db, "term", oid) === siteId;
  return true;
}

// ---------- Types d'éléments et résolveurs (registre extensible) ----------
// search(q, limit) → [{ id, title, detail }] ; resolve(ids) → Map(id → { title, url, state }) ; state : ok | unpublished | trashed | missing
const TYPES = {
  home: { label: "Accueil", needsObject: false },
  page: {
    label: "Page", needsObject: true,
    search: (q, limit, siteId = null) => db.prepare(`SELECT id, COALESCE(NULLIF(title, ''), name) AS title, slug AS detail FROM mk_landing_pages WHERE archived_at IS NULL AND kind <> 'step' AND (? IS NULL OR site_id = ?) AND (name LIKE ? ESCAPE '\\' OR title LIKE ? ESCAPE '\\' OR slug LIKE ? ESCAPE '\\') ORDER BY updated_at DESC LIMIT ?`).all(siteId, siteId, like(q), like(q), like(q), limit).map((r) => ({ ...r, detail: urlsLib().publicPath("page", { slug: r.detail }, { hostSite: null }) })),
    resolve: (ids) => fetchMap(ids, "SELECT id, COALESCE(NULLIF(title, ''), name) AS title, slug, status, archived_at FROM mk_landing_pages", (r) => ({ title: r.title, url: urlsLib().publicPath("page", r, { hostSite: null }), state: r.archived_at ? "trashed" : r.status === "published" ? "ok" : "unpublished" })),
  },
  article: {
    label: "Article", needsObject: true,
    search: (q, limit, siteId = null) => db.prepare(`SELECT id, title, slug AS detail FROM posts WHERE deleted_at IS NULL AND (? IS NULL OR EXISTS (SELECT 1 FROM mk_content_sites cs WHERE cs.content_type = 'post' AND cs.content_id = posts.id AND cs.site_id = ?)) AND (title LIKE ? ESCAPE '\\' OR slug LIKE ? ESCAPE '\\') ORDER BY COALESCE(published_at, created_at) DESC LIMIT ?`).all(siteId, siteId, like(q), like(q), limit).map((r) => ({ ...r, detail: urlsLib().publicPath("post", { slug: r.detail }) })),
    resolve: (ids) => fetchMap(ids, "SELECT id, title, slug, published, deleted_at FROM posts", (r) => ({ title: r.title, url: urlsLib().publicPath("post", r), state: r.deleted_at ? "trashed" : r.published ? "ok" : "unpublished" })),
  },
  category: {
    label: "Catégorie", needsObject: true,
    search: (q, limit, siteId = null) => termSearch("category", q, limit, siteId),
    resolve: (ids) => termMap(ids, "category"),
  },
  tag: {
    label: "Étiquette", needsObject: true,
    search: (q, limit, siteId = null) => termSearch("tag", q, limit, siteId),
    resolve: (ids) => termMap(ids, "tag"),
  },
  custom: { label: "Lien personnalisé", needsObject: false },
};
const registerType = (key, def) => { TYPES[key] = def; };
// Adresses publiques : toujours calculées par le moteur d'URLs central (une référence d'objet suit l'adresse courante de la ressource)
const urlsLib = () => require("./urls");
const like = (s) => `%${String(s || "").replace(/[\\%_]/g, "\\$&")}%`;
function fetchMap(ids, sql, shape) {
  const out = new Map();
  if (!ids.length) return out;
  for (const r of db.prepare(`${sql} WHERE id IN (${ids.map(() => "?").join(",")})`).all(...ids)) out.set(r.id, shape(r));
  return out;
}
function termMap(ids, kind) {
  const out = new Map();
  for (const id of ids) { const t = taxonomy.get(id); if (t && t.taxonomy === kind) out.set(id, { title: t.name, url: taxonomy.urlOf(t), state: "ok" }); }
  return out;
}
const STATE_LABELS = Object.freeze({ ok: "", unpublished: "Ressource non publiée", trashed: "Ressource à la corbeille", missing: "Ressource introuvable" });

// ---------- Adresses personnalisées : liste blanche de formes ----------
const REL_ALLOWED = ["nofollow", "sponsored", "ugc", "noopener", "noreferrer", "external"];
function cleanUrl(input) {
  const url = String(input || "").trim();
  if (!url) throw new UserError("Indiquez l'adresse du lien.");
  if (url.length > 500 || /[\u0000-\u001F\u007F\s]/.test(url)) throw new UserError("Adresse invalide (espaces ou caractères interdits).");
  if (url.startsWith("#")) { if (!/^#[A-Za-z0-9_\-:.%]{1,100}$/.test(url)) throw new UserError("Ancre invalide : lettres, chiffres et tirets (ex. #tarifs)."); return url; }
  if (url.startsWith("/")) { if (url.startsWith("//") || url.startsWith("/\\")) throw new UserError("Adresse invalide."); return url; }
  if (/^mailto:[^\s@<>]+@[^\s@<>]+\.[^\s@<>]{2,}$/i.test(url) || /^tel:\+?[0-9 ().-]{4,25}$/i.test(url)) return url;
  let u;
  try { u = new URL(url); } catch { throw new UserError("Adresse invalide : commencez par /, #, https:// ou http://."); }
  if (!["http:", "https:"].includes(u.protocol) || !u.hostname.includes(".")) throw new UserError("Seules les adresses http(s), mailto:, tel:, internes (/page) et ancres (#id) sont autorisées.");
  return u.toString() === `${u.origin}/` && !url.endsWith("/") ? u.origin : u.toString();
}
const isExternal = (url) => /^https?:\/\//i.test(url);
function cleanRel(rel) {
  return [...new Set(String(rel || "").toLowerCase().split(/[\s,]+/).filter((t) => REL_ALLOWED.includes(t)))].join(" ");
}
const cleanLabel = (s) => String(s || "").replace(/[\u0000-\u001F\u007F]/g, " ").replace(/\s+/g, " ").trim().slice(0, MAX_LABEL);
const ICON_RE = /^[a-zA-Z]{1,30}$/;

// ---------- Menus ----------
const menuRow = (id) => (Number.isInteger(id) && id > 0 ? db.prepare("SELECT * FROM nav_menus WHERE id = ?").get(id) : null);
function uniqueSlug(base, siteId, exceptId = 0) {
  const root = slugify(base) || "menu";
  for (let n = 1; n < 200; n += 1) {
    const slug = n === 1 ? root : `${root}-${n}`;
    if (!db.prepare(`SELECT 1 FROM nav_menus WHERE ${sameScope("site_id")} AND slug = ? AND id <> ?`).get(siteId ?? null, slug, exceptId)) return slug;
  }
  throw new UserError("Impossible de trouver une adresse libre pour ce menu.");
}
function create({ name, description = "", siteId = null, userId = null, autoAddPages = false }) {
  const nm = cleanLabel(name);
  if (!nm) throw new UserError("Donnez un nom au menu.");
  if (db.prepare(`SELECT 1 FROM nav_menus WHERE ${sameScope("site_id")} AND name = ? COLLATE NOCASE`).get(siteId, nm)) throw new UserError(`Un menu « ${nm} » existe déjà.`);
  const id = Number(db.prepare("INSERT INTO nav_menus (site_id, name, slug, description, created_by, auto_add_pages) VALUES (?, ?, ?, ?, ?, ?)").run(siteId, nm, uniqueSlug(nm, siteId), String(description || "").trim().slice(0, 300), userId, autoAddPages ? 1 : 0).lastInsertRowid);
  emit("menu.created", { menuId: id });
  return menuRow(id);
}
function update(id, { name, description, status }) {
  const m = menuRow(id);
  if (!m) throw new UserError("Menu introuvable.");
  const nm = name === undefined ? m.name : cleanLabel(name);
  if (!nm) throw new UserError("Le nom du menu est obligatoire.");
  if (db.prepare(`SELECT 1 FROM nav_menus WHERE ${sameScope("site_id")} AND name = ? COLLATE NOCASE AND id <> ?`).get(m.site_id, nm, id)) throw new UserError(`Un menu « ${nm} » existe déjà.`);
  const st = status === undefined ? m.status : ["published", "draft"].includes(status) ? status : m.status;
  db.prepare("UPDATE nav_menus SET name = ?, description = ?, status = ?, updated_at = datetime('now'), revision = revision + 1 WHERE id = ?").run(nm, description === undefined ? m.description : String(description).trim().slice(0, 300), st, id);
  emit("menu.updated", { menuId: id });
  return menuRow(id);
}
// Supprimer un menu supprime ses éléments et le libère de ses emplacements — jamais les pages, articles ou catégories qu'il montrait
function remove(id) {
  const m = menuRow(id);
  if (!m) throw new UserError("Menu introuvable.");
  const locations = db.prepare("SELECT location FROM nav_locations WHERE menu_id = ?").all(id).map((r) => r.location);
  transaction(db, () => { db.prepare("DELETE FROM nav_items WHERE menu_id = ?").run(id); db.prepare("DELETE FROM nav_locations WHERE menu_id = ?").run(id); db.prepare("DELETE FROM nav_menus WHERE id = ?").run(id); });
  emit("menu.deleted", { menuId: id, locations });
  return { name: m.name, locations };
}
function duplicate(id, { userId = null } = {}) {
  const m = menuRow(id);
  if (!m) throw new UserError("Menu introuvable.");
  return transaction(db, () => {
    let name = `${m.name} (copie)`;
    for (let n = 2; db.prepare(`SELECT 1 FROM nav_menus WHERE ${sameScope("site_id")} AND name = ? COLLATE NOCASE`).get(m.site_id, name); n += 1) name = `${m.name} (copie ${n})`;
    const copy = create({ name, description: m.description, siteId: m.site_id, userId });
    db.prepare("UPDATE nav_menus SET status = 'draft' WHERE id = ?").run(copy.id); // la copie n'est jamais publiée toute seule
    const map = new Map();
    const items = db.prepare("SELECT * FROM nav_items WHERE menu_id = ? ORDER BY (parent_id IS NOT NULL), position, id").all(id);
    const ins = db.prepare("INSERT INTO nav_items (menu_id, parent_id, position, type, object_id, url, label, status, new_tab, rel, icon, visibility, description, media_id, meta, css_class, title_attr) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
    // Parents d'abord (profondeur croissante) pour que la nouvelle hiérarchie existe au moment d'insérer les enfants
    const pending = [...items];
    while (pending.length) {
      const before = pending.length;
      for (let i = pending.length - 1; i >= 0; i -= 1) {
        const it = pending[i];
        if (it.parent_id && !map.has(it.parent_id)) continue;
        map.set(it.id, Number(ins.run(copy.id, it.parent_id ? map.get(it.parent_id) : null, it.position, it.type, it.object_id, it.url, it.label, it.status, it.new_tab, it.rel, it.icon, it.visibility, it.description, it.media_id, it.meta, it.css_class, it.title_attr).lastInsertRowid));
        pending.splice(i, 1);
      }
      if (pending.length === before) break; // données incohérentes : on ne boucle jamais
    }
    emit("menu.created", { menuId: copy.id, copiedFrom: id });
    return menuRow(copy.id);
  });
}

// ---------- Éléments ----------
const itemRow = (id) => (Number.isInteger(id) && id > 0 ? db.prepare("SELECT * FROM nav_items WHERE id = ?").get(id) : null);
const siblingsCount = (menuId, parentId) => db.prepare("SELECT COUNT(*) n FROM nav_items WHERE menu_id = ? AND COALESCE(parent_id, 0) = COALESCE(?, 0)").get(menuId, parentId ?? null).n;
function depthOf(itemId) {
  let d = 0, id = itemId;
  for (let i = 0; id && i < 50; i += 1) { d += 1; id = (db.prepare("SELECT parent_id FROM nav_items WHERE id = ?").get(id) || {}).parent_id; }
  return d;
}
function heightOf(itemId) {
  const kids = db.prepare("SELECT id FROM nav_items WHERE parent_id = ?").all(itemId);
  return 1 + kids.reduce((m, k) => Math.max(m, heightOf(k.id)), 0);
}
// Les descendants d'un élément (lui compris) : sert à interdire qu'un élément devienne son propre descendant
function subtreeIds(itemId) {
  return db.prepare(`WITH RECURSIVE sub(id) AS (SELECT ? UNION SELECT i.id FROM nav_items i JOIN sub s ON i.parent_id = s.id) SELECT id FROM sub`).all(itemId).map((r) => r.id);
}
function normalizeItem(input, existing = null, siteId = null) {
  const type = existing ? existing.type : String(input.type || "");
  const def = TYPES[type];
  if (!def) throw new UserError("Type d'élément inconnu.");
  const out = { type, object_id: existing ? existing.object_id : null, url: existing ? existing.url : "" };
  if (def.needsObject) {
    const oid = input.object_id === undefined && existing ? existing.object_id : Number(input.object_id);
    if (!Number.isInteger(oid) || oid <= 0) throw new UserError(`Choisissez ${type === "page" ? "une page" : type === "article" ? "un article" : type === "category" ? "une catégorie" : "une étiquette"}.`);
    out.object_id = oid;
    if (!(existing && existing.object_id === oid) && !inSiteScope(type, oid, siteId)) throw new UserError("Cette ressource n'appartient pas à ce site.");
    const info = def.resolve([oid]).get(oid);
    if (!info && !existing) throw new UserError("Cette ressource n'existe pas.");
    out.url = "";
  } else if (type === "custom") {
    out.url = input.url === undefined && existing ? existing.url : cleanUrl(input.url);
  }
  return out;
}
function add(menuId, input) {
  const m = menuRow(menuId);
  if (!m) throw new UserError("Menu introuvable.");
  if (db.prepare("SELECT COUNT(*) n FROM nav_items WHERE menu_id = ?").get(menuId).n >= MAX_ITEMS) throw new UserError(`Un menu contient ${MAX_ITEMS} éléments au plus.`);
  const base = normalizeItem(input, null, m.site_id);
  const label = cleanLabel(input.label);
  if (base.type === "custom" && !label) throw new UserError("Donnez un texte au lien.");
  let parentId = null;
  if (input.parent_id) {
    const parent = itemRow(Number(input.parent_id));
    if (!parent || parent.menu_id !== menuId) throw new UserError("Élément parent introuvable.");
    if (depthOf(parent.id) >= MAX_DEPTH) throw new UserError(`Un menu a ${MAX_DEPTH} niveaux au plus.`);
    parentId = parent.id;
  }
  const external = base.type === "custom" && isExternal(base.url);
  const newTab = input.new_tab === undefined ? external : Boolean(input.new_tab);
  const id = Number(db.prepare("INSERT INTO nav_items (menu_id, parent_id, position, type, object_id, url, label, new_tab, rel) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)")
    .run(menuId, parentId, siblingsCount(menuId, parentId), base.type, base.object_id, base.url, label, newTab ? 1 : 0, cleanRel(input.rel)).lastInsertRowid);
  db.prepare("UPDATE nav_menus SET updated_at = datetime('now'), revision = revision + 1 WHERE id = ?").run(menuId);
  emit("items.changed", { menuId });
  return itemRow(id);
}
function updateItem(id, input) {
  const it = itemRow(id);
  if (!it) throw new UserError("Élément introuvable.");
  const base = normalizeItem({ ...input, type: it.type }, it, (menuRow(it.menu_id) || {}).site_id ?? null);
  const label = input.label === undefined ? it.label : cleanLabel(input.label);
  if (base.type === "custom" && !label) throw new UserError("Donnez un texte au lien.");
  const visibility = input.visibility === undefined ? it.visibility : ["all", "guests", "members"].includes(input.visibility) ? input.visibility : it.visibility;
  const status = input.status === undefined ? it.status : ["published", "hidden"].includes(input.status) ? input.status : it.status;
  const icon = input.icon === undefined ? it.icon : (String(input.icon).trim() && ICON_RE.test(String(input.icon).trim()) ? String(input.icon).trim() : "");
  db.prepare("UPDATE nav_items SET object_id = ?, url = ?, label = ?, status = ?, new_tab = ?, rel = ?, icon = ?, visibility = ?, description = ?, updated_at = datetime('now') WHERE id = ?")
    .run(base.object_id, base.url, label, status, input.new_tab === undefined ? it.new_tab : (input.new_tab ? 1 : 0), input.rel === undefined ? it.rel : cleanRel(input.rel), icon, visibility, input.description === undefined ? it.description : String(input.description).trim().slice(0, 200), id);
  db.prepare("UPDATE nav_menus SET updated_at = datetime('now'), revision = revision + 1 WHERE id = ?").run(it.menu_id);
  emit("items.changed", { menuId: it.menu_id });
  return itemRow(id);
}
// Retirer un élément : ses sous-éléments remontent d'un niveau (déclencheur) ; l'ordre est renuméroté
function removeItem(id) {
  const it = itemRow(id);
  if (!it) throw new UserError("Élément introuvable.");
  transaction(db, () => { db.prepare("DELETE FROM nav_items WHERE id = ?").run(id); renumber(it.menu_id); db.prepare("UPDATE nav_menus SET updated_at = datetime('now'), revision = revision + 1 WHERE id = ?").run(it.menu_id); });
  emit("items.changed", { menuId: it.menu_id });
  return it;
}
// Renumérote 0..n chaque fratrie (ordre déterministe : position puis identifiant) — jamais de doublon ni de trou
function renumber(menuId) {
  const rows = db.prepare("SELECT id, parent_id FROM nav_items WHERE menu_id = ? ORDER BY position, id").all(menuId);
  const counters = new Map();
  const upd = db.prepare("UPDATE nav_items SET position = ? WHERE id = ? AND position <> ?");
  for (const r of rows) { const k = r.parent_id || 0; const n = counters.get(k) || 0; counters.set(k, n + 1); upd.run(n, r.id, n); }
}
// Déplacer un élément : nouveau parent (ou racine) et rang. Refus si l'élément devenait son propre descendant ou si la profondeur dépasse.
function move(id, { parentId = null, index = null }) {
  const it = itemRow(id);
  if (!it) throw new UserError("Élément introuvable.");
  let parent = null;
  if (parentId) {
    parent = itemRow(Number(parentId));
    if (!parent || parent.menu_id !== it.menu_id) throw new UserError("Élément parent introuvable.");
    if (subtreeIds(it.id).includes(parent.id)) throw new UserError("Impossible : un élément ne peut pas être placé dans l'un de ses propres sous-éléments (boucle).");
    if (depthOf(parent.id) + heightOf(it.id) > MAX_DEPTH) throw new UserError(`Un menu a ${MAX_DEPTH} niveaux au plus.`);
  } else if (heightOf(it.id) > MAX_DEPTH) throw new UserError(`Un menu a ${MAX_DEPTH} niveaux au plus.`);
  transaction(db, () => {
    const target = parent ? parent.id : null;
    const sibs = db.prepare("SELECT id FROM nav_items WHERE menu_id = ? AND COALESCE(parent_id, 0) = COALESCE(?, 0) AND id <> ? ORDER BY position, id").all(it.menu_id, target, it.id).map((r) => r.id);
    const at = index === null || index === undefined ? sibs.length : Math.min(Math.max(0, Number(index) || 0), sibs.length);
    sibs.splice(at, 0, it.id);
    db.prepare("UPDATE nav_items SET parent_id = ?, updated_at = datetime('now') WHERE id = ?").run(target, it.id);
    sibs.forEach((sid, n) => db.prepare("UPDATE nav_items SET position = ? WHERE id = ?").run(n, sid));
    renumber(it.menu_id);
    db.prepare("UPDATE nav_menus SET updated_at = datetime('now'), revision = revision + 1 WHERE id = ?").run(it.menu_id);
  });
  emit("items.changed", { menuId: it.menu_id });
  return itemRow(id);
}
// Monter / descendre / indenter / désindenter (boutons accessibles, sans glisser-déposer)
function shift(id, direction) {
  const it = itemRow(id);
  if (!it) throw new UserError("Élément introuvable.");
  const sibs = db.prepare("SELECT id FROM nav_items WHERE menu_id = ? AND COALESCE(parent_id, 0) = COALESCE(?, 0) ORDER BY position, id").all(it.menu_id, it.parent_id).map((r) => r.id);
  const at = sibs.indexOf(id);
  if (direction === "up") { if (at <= 0) throw new UserError("Cet élément est déjà le premier."); return move(id, { parentId: it.parent_id, index: at - 1 }); }
  if (direction === "down") { if (at >= sibs.length - 1) throw new UserError("Cet élément est déjà le dernier."); return move(id, { parentId: it.parent_id, index: at + 1 }); }
  if (direction === "in") { if (at <= 0) throw new UserError("Il faut un élément au-dessus pour y imbriquer celui-ci."); return move(id, { parentId: sibs[at - 1], index: null }); }
  if (direction === "out") {
    if (!it.parent_id) throw new UserError("Cet élément est déjà au premier niveau.");
    const parent = itemRow(it.parent_id);
    const uncles = db.prepare("SELECT id FROM nav_items WHERE menu_id = ? AND COALESCE(parent_id, 0) = COALESCE(?, 0) ORDER BY position, id").all(it.menu_id, parent.parent_id).map((r) => r.id);
    return move(id, { parentId: parent.parent_id, index: uncles.indexOf(parent.id) + 1 });
  }
  throw new UserError("Déplacement inconnu.");
}
// Réorganisation complète (glisser-déposer) : l'arbre envoyé [{ id, children: [...] }] doit contenir EXACTEMENT les éléments du menu,
// sans boucle ni excès de profondeur ; tout est écrit en une seule transaction (jamais d'ordre à moitié appliqué).
function reorder(menuId, tree) {
  const m = menuRow(menuId);
  if (!m) throw new UserError("Menu introuvable.");
  if (!Array.isArray(tree)) throw new UserError("Structure invalide.");
  const existing = new Set(db.prepare("SELECT id FROM nav_items WHERE menu_id = ?").all(menuId).map((r) => r.id));
  const seen = new Set(), flat = [];
  const walk = (nodes, parent, depth) => {
    if (!Array.isArray(nodes)) throw new UserError("Structure invalide.");
    if (depth > MAX_DEPTH) throw new UserError(`Un menu a ${MAX_DEPTH} niveaux au plus.`);
    nodes.forEach((n, index) => {
      const id = Number(n && n.id);
      if (!existing.has(id)) throw new UserError("Élément inconnu dans cette structure.");
      if (seen.has(id)) throw new UserError("Élément en double : la structure formerait une boucle.");
      if (parent === id) throw new UserError("Un élément ne peut pas être son propre parent.");
      seen.add(id); flat.push({ id, parent, index });
      walk(n.children || [], id, depth + 1);
    });
  };
  walk(tree, null, 1);
  if (seen.size !== existing.size) throw new UserError("La structure ne contient pas tous les éléments du menu : rechargez la page.");
  transaction(db, () => {
    const upd = db.prepare("UPDATE nav_items SET parent_id = ?, position = ?, updated_at = datetime('now') WHERE id = ?");
    for (const f of flat) upd.run(f.parent, f.index, f.id);
    db.prepare("UPDATE nav_menus SET updated_at = datetime('now'), revision = revision + 1 WHERE id = ?").run(menuId);
  });
  emit("items.changed", { menuId });
  return flat.length;
}

// ---------- Enregistrement de l'éditeur : un seul bloc, tout ou rien, version contrôlée ----------
const CLASS_TOKEN = /^[A-Za-z_][A-Za-z0-9_-]{0,39}$/;
function cleanClasses(input) {
  const tokens = String(input || "").split(/\s+/).filter(Boolean);
  if (tokens.length > 5) throw new UserError("Cinq classes CSS au plus par élément.");
  for (const t of tokens) if (!CLASS_TOKEN.test(t)) throw new UserError(`Classe CSS invalide « ${t.slice(0, 40)} » : lettres, chiffres, tiret et soulignement seulement.`);
  return [...new Set(tokens)].join(" ");
}
const cleanTitle = (s) => cleanLabel(s).slice(0, 120);
const ITEM_KEYS = new Set(["id", "key", "type", "object_id", "url", "label", "title_attr", "css_class", "new_tab", "rel", "visibility", "status", "children"]);
// Écrit le menu entier tel que l'éditeur le montre : { revision, name?, description?, status?, items: [{ id?|key, type, …, children }], locations?: { clé: booléen } }.
// Un élément porteur d'un « id » doit appartenir à CE menu ; un élément sans « id » est créé. Tout est validé avant la première écriture ; une erreur n'écrit rien.
// canPublish : sans ce droit, une demande qui changerait un emplacement est refusée (403), les emplacements restant tels quels.
function saveMenu(menuId, payload, { canPublish = false, userId = null } = {}) {
  const m = menuRow(menuId);
  if (!m) throw new UserError("Menu introuvable.", 404);
  const body = payload && typeof payload === "object" ? payload : {};
  if (!Number.isInteger(body.revision)) throw new UserError("Version du menu manquante : rechargez la page.", 400);
  if (body.revision !== m.revision) throw new UserError("Ce menu a été modifié ailleurs depuis l'ouverture de cette page. Rechargez-la pour voir la dernière version avant d'enregistrer : vos modifications ne sont pas écrites.", 409);
  if (!Array.isArray(body.items)) throw new UserError("Structure invalide.", 400);

  const name = body.name === undefined ? m.name : cleanLabel(body.name);
  if (!name) throw new UserError("Le nom du menu est obligatoire.");
  if (db.prepare(`SELECT 1 FROM nav_menus WHERE ${sameScope("site_id")} AND name = ? COLLATE NOCASE AND id <> ?`).get(m.site_id, name, menuId)) throw new UserError(`Un menu « ${name} » existe déjà.`);
  const description = body.description === undefined ? m.description : String(body.description).trim().slice(0, 300);
  const status = body.status === undefined ? m.status : ["published", "draft"].includes(body.status) ? body.status : null;
  if (!status) throw new UserError("État du menu invalide.");
  if (body.autoAddPages !== undefined && typeof body.autoAddPages !== "boolean") throw new UserError("Réglage « ajout automatique des pages » invalide.");
  const autoAdd = body.autoAddPages === undefined ? m.auto_add_pages : body.autoAddPages ? 1 : 0;

  const existing = new Map(db.prepare("SELECT * FROM nav_items WHERE menu_id = ?").all(menuId).map((r) => [r.id, r]));
  const seen = new Set(), plan = [];
  const walk = (nodes, parentRef, depth) => {
    if (!Array.isArray(nodes)) throw new UserError("Structure invalide.");
    nodes.forEach((n, index) => {
      if (depth > MAX_DEPTH) throw new UserError(`Un menu a ${MAX_DEPTH} niveaux au plus.`);
      if (!n || typeof n !== "object") throw new UserError("Structure invalide.");
      if (plan.length >= MAX_ITEMS) throw new UserError(`Un menu contient ${MAX_ITEMS} éléments au plus.`);
      for (const k of Object.keys(n)) if (!ITEM_KEYS.has(k)) throw new UserError("Champ d'élément inconnu.");
      let row = null;
      if (n.id !== undefined && n.id !== null) {
        const id = Number(n.id);
        row = existing.get(id);
        if (!row) throw new UserError("Élément inconnu dans ce menu : rechargez la page.");
        if (seen.has(id)) throw new UserError("Élément en double : la structure formerait une boucle.");
        seen.add(id);
      }
      const base = normalizeItem(row ? { ...n, type: row.type } : n, row, m.site_id);
      const label = cleanLabel(n.label);
      if (base.type === "custom" && !label) throw new UserError("Donnez un texte à chaque lien personnalisé.");
      const external = base.type === "custom" && isExternal(base.url);
      const visibility = n.visibility === undefined ? "all" : ["all", "guests", "members"].includes(n.visibility) ? n.visibility : null;
      const st = n.status === undefined ? "published" : ["published", "hidden"].includes(n.status) ? n.status : null;
      if (!visibility || !st) throw new UserError("Valeur d'option invalide.");
      const ref = row ? row.id : `n${plan.length}`;
      plan.push({ row, ref, parentRef, index, base, label, newTab: n.new_tab === undefined ? external : Boolean(n.new_tab), rel: cleanRel(n.rel), visibility, status: st, css: cleanClasses(n.css_class), title: cleanTitle(n.title_attr) });
      walk(n.children === undefined ? [] : n.children, ref, depth + 1);
    });
  };
  walk(body.items, null, 1);

  // Emplacements : état voulu de CE menu (clé → booléen), appliqué dans la même transaction
  const current = assignments({ siteId: m.site_id });
  const wanted = {};
  if (body.locations !== undefined) {
    if (!body.locations || typeof body.locations !== "object" || Array.isArray(body.locations)) throw new UserError("Emplacements invalides.");
    for (const [key, v] of Object.entries(body.locations)) {
      if (!LOCATIONS[key]) throw new UserError("Emplacement inconnu.");
      const on = Boolean(v);
      if (on !== (current[key] === menuId)) wanted[key] = on;
    }
    if (Object.keys(wanted).length && !canPublish) throw new UserError("Seuls les administrateurs affectent un menu à un emplacement.", 403);
  }

  const ids = new Map();
  transaction(db, () => {
    const ins = db.prepare("INSERT INTO nav_items (menu_id, parent_id, position, type, object_id, url, label) VALUES (?, NULL, 0, ?, ?, ?, ?)");
    for (const p of plan) ids.set(p.ref, p.row ? p.row.id : Number(ins.run(menuId, p.base.type, p.base.object_id, p.base.url, p.label).lastInsertRowid));
    for (const [id] of existing) if (!seen.has(id)) db.prepare("DELETE FROM nav_items WHERE id = ?").run(id);
    const upd = db.prepare("UPDATE nav_items SET parent_id = ?, position = ?, object_id = ?, url = ?, label = ?, status = ?, new_tab = ?, rel = ?, visibility = ?, css_class = ?, title_attr = ?, updated_at = datetime('now') WHERE id = ?");
    for (const p of plan) upd.run(p.parentRef === null ? null : ids.get(p.parentRef), p.index, p.base.object_id, p.base.url, p.label, p.status, p.newTab ? 1 : 0, p.rel, p.visibility, p.css, p.title, ids.get(p.ref));
    db.prepare("UPDATE nav_menus SET name = ?, description = ?, status = ?, auto_add_pages = ?, updated_at = datetime('now'), revision = revision + 1 WHERE id = ?").run(name, description, status, autoAdd, menuId);
    for (const [key, on] of Object.entries(wanted)) assign(key, on ? menuId : null, { siteId: m.site_id });
    if (Object.keys(wanted).length) db.prepare("UPDATE nav_menus SET revision = revision - ? WHERE id = ?").run(new Set(Object.keys(wanted)).size, menuId); // assign() a compté chaque emplacement : une seule version par enregistrement
  });
  emit("items.changed", { menuId });
  emit("menu.updated", { menuId, userId });
  return { menu: menuRow(menuId), count: plan.length, created: plan.filter((p) => !p.row).length, removed: [...existing.keys()].filter((id) => !seen.has(id)).length, idMap: Object.fromEntries(plan.filter((p) => !p.row).map((p) => [p.ref, ids.get(p.ref)])) };
}

// Ajout automatique (réglage « Ajouter automatiquement les pages de premier niveau à ce menu », comme WordPress) : à la PREMIÈRE publication d'une
// page ordinaire sans parent, elle est ajoutée en fin de premier niveau des menus du MÊME site qui ont l'option. Jamais de doublon ; un élément retiré
// à la main n'est pas remis par une republication (seule la première publication déclenche l'ajout). Retourne les identifiants des menus modifiés.
function autoAddPage(pageId) {
  const page = db.prepare("SELECT id, site_id, kind, parent_id, status, archived_at FROM mk_landing_pages WHERE id = ?").get(Number(pageId));
  if (!page || page.kind !== "page" || page.parent_id !== null || page.status !== "published" || page.archived_at) return [];
  const changed = [];
  for (const m of db.prepare(`SELECT id FROM nav_menus WHERE auto_add_pages = 1 AND ${sameScope("site_id")}`).all(page.site_id ?? null)) {
    if (db.prepare("SELECT 1 FROM nav_items WHERE menu_id = ? AND type = 'page' AND object_id = ?").get(m.id, page.id)) continue;
    if (db.prepare("SELECT COUNT(*) n FROM nav_items WHERE menu_id = ?").get(m.id).n >= MAX_ITEMS) continue;
    transaction(db, () => {
      db.prepare("INSERT INTO nav_items (menu_id, parent_id, position, type, object_id, url, label) VALUES (?, NULL, ?, 'page', ?, '', '')").run(m.id, siblingsCount(m.id, null), page.id);
      db.prepare("UPDATE nav_menus SET updated_at = datetime('now'), revision = revision + 1 WHERE id = ?").run(m.id);
    });
    changed.push(m.id);
    emit("items.changed", { menuId: m.id });
  }
  return changed;
}

// Sources d'extensions : un module activé propose des liens (boutique, catégories de produits…) ; ils sont ajoutés au menu comme LIENS PERSONNALISÉS
// (adresse validée, copiée) : désactiver le module ne casse jamais un menu, et le moteur ne dépend d'aucune extension.
const SOURCES = {};
function registerSource(key, def) {
  if (!/^[a-z][a-z0-9_-]{1,30}$/.test(key) || !def || typeof def.search !== "function" || !def.label) throw new Error("Source de menu invalide.");
  SOURCES[key] = def;
}
const unregisterSource = (key) => { delete SOURCES[key]; };
function sourcesFor(siteId = null) {
  return Object.entries(SOURCES).filter(([, d]) => { try { return typeof d.available !== "function" || d.available(siteId); } catch { return false; } }).map(([key, d]) => ({ key, label: d.label }));
}
function searchSource(key, q, limit, { siteId = null } = {}) {
  if (!sourcesFor(siteId).some((s) => s.key === key)) return [];
  let rows = [];
  try { rows = SOURCES[key].search(String(q || "").trim().slice(0, 80), Math.min(Number(limit) || 20, 50), siteId) || []; } catch { return []; }
  const out = [];
  for (const r of rows) { try { out.push({ id: String(r.id ?? r.url), title: cleanLabel(r.title), url: cleanUrl(r.url), detail: r.url }); } catch { /* adresse refusée : ignorée */ } }
  return out;
}

// ---------- Lecture : arbre résolu ----------
function resolveAll(items) {
  const byType = new Map();
  for (const it of items) if (TYPES[it.type] && TYPES[it.type].resolve && it.object_id) { if (!byType.has(it.type)) byType.set(it.type, new Set()); byType.get(it.type).add(it.object_id); }
  const maps = {};
  for (const [type, ids] of byType) maps[type] = TYPES[type].resolve([...ids]);
  return (it) => {
    if (it.type === "home") return { title: "Accueil", url: "/", state: "ok" };
    if (it.type === "custom") return { title: it.label, url: it.url, state: "ok" };
    const hit = maps[it.type] && maps[it.type].get(it.object_id);
    return hit || { title: "", url: "", state: "missing" };
  };
}
// Éléments d'un menu en arbre, avec leur ressource résolue (administration : l'état de chaque lien est visible)
function tree(menuId) {
  const rows = db.prepare("SELECT * FROM nav_items WHERE menu_id = ? ORDER BY position, id").all(menuId);
  const resolve = resolveAll(rows);
  const nodes = new Map(rows.map((r) => { const t = resolve(r); return [r.id, { ...r, resource: t, displayLabel: r.label || t.title || "(sans titre)", stateLabel: STATE_LABELS[t.state], children: [] }]; }));
  const roots = [];
  for (const n of nodes.values()) { const p = nodes.get(n.parent_id); if (p) p.children.push(n); else roots.push(n); }
  return roots;
}
const flatten = (nodes, depth = 1, out = []) => { for (const n of nodes) { out.push({ ...n, depth }); flatten(n.children, depth + 1, out); } return out; };
const MENU_SORTS = { nom: "m.name COLLATE NOCASE", recent: "m.updated_at DESC, m.id DESC", elements: "items DESC, m.name COLLATE NOCASE" };
function listMenus({ siteId = null, q = "", sort = "nom" } = {}) {
  const term = String(q || "").trim().slice(0, 80);
  const menus = db.prepare(`SELECT m.*, (SELECT COUNT(*) FROM nav_items i WHERE i.menu_id = m.id) AS items FROM nav_menus m WHERE ${sameScope("m.site_id")} AND (? = '' OR m.name LIKE ? ESCAPE '\\' OR m.description LIKE ? ESCAPE '\\') ORDER BY ${MENU_SORTS[sort] || MENU_SORTS.nom}`).all(siteId, term, like(term), like(term));
  const locs = db.prepare(`SELECT location, menu_id FROM nav_locations WHERE ${sameScope("site_id")}`).all(siteId);
  return menus.map((m) => ({ ...m, locations: locs.filter((l) => l.menu_id === m.id).map((l) => l.location), broken: brokenCount(m.id) }));
}
function brokenCount(menuId) {
  const rows = db.prepare("SELECT * FROM nav_items WHERE menu_id = ? AND type IN ('page','article','category','tag')").all(menuId);
  if (!rows.length) return 0;
  const resolve = resolveAll(rows);
  return rows.filter((r) => resolve(r).state !== "ok").length;
}
// Éléments qui pointent vers une ressource (suppression d'une page, d'un article… : où est-elle utilisée ?)
const usageOf = (type, objectId) => db.prepare("SELECT i.id, i.menu_id, m.name AS menu FROM nav_items i JOIN nav_menus m ON m.id = i.menu_id WHERE i.type = ? AND i.object_id = ?").all(type, objectId);

// ---------- Emplacements ----------
function assign(location, menuId, { siteId = null } = {}) {
  if (!LOCATIONS[location]) throw new UserError("Emplacement inconnu.");
  if (menuId) {
    const m = menuRow(Number(menuId));
    if (!m) throw new UserError("Menu introuvable.");
    if ((m.site_id ?? null) !== (siteId ?? null)) throw new UserError("Ce menu appartient à un autre site.");
  }
  transaction(db, () => {
    const before = db.prepare(`SELECT menu_id FROM nav_locations WHERE ${sameScope("site_id")} AND location = ?`).get(siteId, location);
    for (const id of new Set([before && before.menu_id, menuId ? Number(menuId) : null].filter(Boolean))) db.prepare("UPDATE nav_menus SET revision = revision + 1 WHERE id = ?").run(id);
    db.prepare(`DELETE FROM nav_locations WHERE ${sameScope("site_id")} AND location = ?`).run(siteId, location);
    if (menuId) db.prepare("INSERT INTO nav_locations (site_id, location, menu_id) VALUES (?, ?, ?)").run(siteId, location, Number(menuId));
  });
  emit("menu.assigned", { location, menuId: menuId ? Number(menuId) : null, siteId });
}
const assignments = ({ siteId = null } = {}) => Object.fromEntries(db.prepare(`SELECT location, menu_id FROM nav_locations WHERE ${sameScope("site_id")}`).all(siteId).map((r) => [r.location, r.menu_id]));

// ---------- Rendu public : l'arbre VISIBLE d'un emplacement (null = rien d'affecté → l'appelant garde son affichage d'origine) ----------
// user : session (null = visiteur). Un élément est montré s'il est publié, visible pour ce visiteur et si sa ressource est publiée.
// Un élément sans lien valide mais avec des sous-éléments visibles devient un simple titre de groupe (jamais un lien mort).
function forLocation(location, { siteId = null, user = null } = {}) {
  if (!LOCATIONS[location]) return null; // emplacement retiré du registre (thème, module) : les données restent, rien ne s'affiche
  try {
    const slot = db.prepare(`SELECT m.id, m.name, m.status FROM nav_locations l JOIN nav_menus m ON m.id = l.menu_id WHERE ${sameScope("l.site_id")} AND l.location = ?`).get(siteId, location);
    if (!slot || slot.status !== "published") return null;
    return { menuId: slot.id, name: slot.name, items: visibleItems(slot.id, user) };
  } catch { return null; } // base de navigation indisponible : le site garde son en-tête d'origine
}
const preview = (menuId) => visibleItems(menuId, null);
// Point d'intégration pour tout composant qui veut afficher un menu précis (widget du Page Builder, futur éditeur du site, menus contextuels)
function forMenu(menuId, { user = null } = {}) {
  try {
    const m = menuRow(Number(menuId));
    return m && m.status === "published" ? { menuId: m.id, name: m.name, items: visibleItems(m.id, user) } : null;
  } catch { return null; }
}
function visibleItems(menuId, user) {
  const rows = db.prepare("SELECT * FROM nav_items WHERE menu_id = ? ORDER BY position, id").all(menuId);
  const resolve = resolveAll(rows);
  const nodes = new Map();
  for (const r of rows) {
    const t = resolve(r);
    nodes.set(r.id, { id: r.id, parent_id: r.parent_id, label: r.label || t.title, href: t.state === "ok" ? t.url : "", valid: t.state === "ok", newTab: Boolean(r.new_tab), rel: relFor(r, t.url), icon: r.icon, description: r.description, cssClass: r.css_class, titleAttr: r.title_attr, status: r.status, visibility: r.visibility, children: [] });
  }
  const allowed = (n) => n.status === "published" && (n.visibility === "all" || (n.visibility === "members" ? Boolean(user) : !user));
  const roots = [];
  for (const n of nodes.values()) { const p = nodes.get(n.parent_id); if (p) p.children.push(n); else roots.push(n); }
  const prune = (list) => list.filter(allowed).map((n) => ({ ...n, children: prune(n.children) })).filter((n) => n.label && (n.valid || n.children.length));
  return prune(roots);
}
function relFor(item, url) {
  const set = new Set(String(item.rel || "").split(" ").filter(Boolean));
  if (item.new_tab || isExternal(url)) { set.add("noopener"); if (item.new_tab) set.add("noreferrer"); }
  return [...set].join(" ");
}

// ---------- Création à partir du site actuel (liens réels de l'en-tête et du pied de page d'origine) ----------
function importCurrentSite({ userId = null, siteId = null } = {}) {
  if (siteId !== null) throw new UserError("L'import du site actuel concerne le site principal.");
  return transaction(db, () => {
    const made = [];
    const mk = (name, entries) => {
      if (db.prepare("SELECT 1 FROM nav_menus WHERE site_id IS NULL AND name = ? COLLATE NOCASE").get(name)) return;
      const menu = create({ name, userId });
      const put = (e, parentId) => add(menu.id, { type: e.type || "custom", url: e.url, label: e.label, object_id: e.object_id, parent_id: parentId });
      for (const e of entries) { const parent = put(e, null); for (const c of e.children || []) put(c, parent.id); }
      made.push(menu);
    };
    const categories = db.prepare("SELECT DISTINCT category FROM courses WHERE published = 1 AND category <> '' ORDER BY category").all().map((r) => r.category);
    mk("Menu principal", [
      ...(categories.length ? [{ label: "Catégories", url: "/catalogue", children: categories.map((c) => ({ label: c, url: `/categorie/${slugify(c)}` })) }] : []),
      { label: "Catalogue", url: "/catalogue" }, { label: "Blog", url: "/blog" },
    ]);
    mk("Menu du pied de page", [
      { label: "Découvrir", url: "/catalogue", children: [{ label: "Toutes les formations", url: "/catalogue" }, { label: "Créer un compte", url: "/inscription" }] },
      { label: "Informations", url: "/a-propos", children: [{ label: "À propos", url: "/a-propos" }, { label: "Blog", url: "/blog" }, { label: "Questions fréquentes", url: "/faq" }, { label: "Contact", url: "/contact" }] },
    ]);
    return made;
  });
}

module.exports = {
  MAX_DEPTH, MAX_ITEMS, MAX_LABEL, LOCATIONS, TYPES, STATE_LABELS, REL_ALLOWED, events, registerLocation, registerType,
  cleanUrl, isExternal, create, update, remove, duplicate, menuRow, itemRow, add, updateItem, removeItem, move, shift, reorder, tree, flatten, listMenus, brokenCount, usageOf,
  saveMenu, autoAddPage, preview, registerSource, unregisterSource, sourcesFor, searchSource, cleanClasses, MENU_SORTS, assign, assignments, forLocation, forMenu, importCurrentSite, subtreeIds, depthOf, search: (type, q, limit = 20, { siteId = null, offset = 0 } = {}) => (TYPES[type] && TYPES[type].search ? TYPES[type].search(String(q || "").trim().slice(0, 80), Math.min(Number(limit) || 20, 50) + 1 + Math.max(0, Math.min(Number(offset) || 0, 500)), Number.isInteger(siteId) ? siteId : null).slice(Math.max(0, Math.min(Number(offset) || 0, 500))) : []), inSiteScope,
};
