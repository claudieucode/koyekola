// KOLAKISA CMS → couche commune d'HISTORIQUE (palier 10) : pages (et modèles, qui sont des pages), articles, apparence (en-tête, pied de page,
// styles) et patterns — une seule façon de lister, consulter, comparer et restaurer, sans remplacer les historiques qui fonctionnent déjà :
//   article   → post_revisions (+ post_autosaves)            (existant, complet : restauration sûre, un seul éditeur)
//   page      → mk_page_versions (versions PUBLIÉES) + cms_revisions (états de BROUILLON, avant restauration, restaurations)
//   apparence → appearance_revisions (publications) + cms_revisions (brouillons, avant restauration)
//   pattern   → cms_revisions (création, renommage, corbeille)
// Principes : une restauration ne détruit rien (l'état actuel est d'abord sauvegardé, la restauration est elle-même une révision) ; le contenu
// PUBLIÉ n'est jamais modifié par une sauvegarde de brouillon ; l'historique de brouillon est borné par une règle explicite (jamais les
// publications ni les restaurations).
const crypto = require("crypto");
const { sameScope } = require("./siteScope"); // R9-2 : égalité de portée « principal ou site » (siteScope)
const db = require("../config/database");
const { UserError } = require("../utils/errors");
const { transaction } = require("../marketing/db/tx");

const DRAFT_WINDOW_MIN = 5;      // des sauvegardes de brouillon rapprochées de la même personne forment UN seul point de l'historique
const MAX_DRAFT_POINTS = 100;    // points de brouillon conservés par élément (les plus anciens seulement ; publications et restaurations : jamais effacées)
const LIST_LIMIT = 300;
const PER_PAGE = 25;

const KINDS = Object.freeze({
  draft: "Brouillon enregistré", publish: "Publication", restore: "Restauration", before_restore: "État avant restauration", create: "Création", save: "Modification",
  rename: "Modification des informations", trash: "Mis à la corbeille", restore_trash: "Restauré depuis la corbeille", import: "Import", status: "Changement d'état",
  schedule: "Programmation", autosave: "Sauvegarde automatique", current: "État actuel",
});
const fp = (value) => crypto.createHash("sha1").update(typeof value === "string" ? value : JSON.stringify(value)).digest("hex");
const parse = (text, fallback = null) => { try { return JSON.parse(text); } catch { return fallback; } };

// ---------- Enregistrement dans cms_revisions ----------
const hasTable = new WeakMap();
function tableReady(handle) {
  if (!hasTable.has(handle)) hasTable.set(handle, Boolean(handle.prepare("SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = 'cms_revisions'").get()));
  return hasTable.get(handle);
}
function record({ type, id, siteId = null, kind, label = "", data, userId = null, compact = false, handle = db }) {
  if (!tableReady(handle)) return null; // base sans historique commun (outils/tests isolés) : rien à écrire
  const D = handle;
  const json = JSON.stringify(data);
  const fingerprint = fp(json);
  const last = D.prepare("SELECT id, kind, fingerprint, created_by, updated_at FROM cms_revisions WHERE content_type = ? AND content_id = ? ORDER BY id DESC LIMIT 1").get(type, id);
  if (last && last.fingerprint === fingerprint && !["restore", "before_restore", "trash", "restore_trash", "publish"].includes(kind)) return null; // rien n'a changé : pas de doublon
  // Sauvegardes de brouillon rapprochées : le même point est mis à jour (l'historique ne se remplit pas de dizaines d'états identiques à quelques secondes)
  if (compact && last && last.kind === kind && last.created_by === (userId ?? null) && Date.now() - Date.parse(`${last.updated_at.replace(" ", "T")}Z`) < DRAFT_WINDOW_MIN * 60 * 1000) {
    D.prepare("UPDATE cms_revisions SET data = ?, fingerprint = ?, updated_at = datetime('now') WHERE id = ?").run(json, fingerprint, last.id);
    return last.id;
  }
  const rid = Number(D.prepare("INSERT INTO cms_revisions (content_type, content_id, site_id, kind, label, data, fingerprint, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)")
    .run(type, id, siteId, kind, String(label).slice(0, 200), json, fingerprint, userId ?? null).lastInsertRowid);
  if (kind === "draft") D.prepare("DELETE FROM cms_revisions WHERE content_type = ? AND content_id = ? AND kind = 'draft' AND id NOT IN (SELECT id FROM cms_revisions WHERE content_type = ? AND content_id = ? AND kind = 'draft' ORDER BY id DESC LIMIT ?)").run(type, id, type, id, MAX_DRAFT_POINTS);
  return rid;
}
// Un enregistrement d'historique ne doit JAMAIS faire échouer l'action qu'il décrit (sauvegarde, publication…)
const safely = (fn) => { try { return fn(); } catch (error) { console.error("[KOLAKISA] historique :", error.message); return null; } };

// ---------- Comparaison : forme commune { groups: [{ title, items: [{ label, what? , lines? }] }], total } ----------
// Différence de texte ligne à ligne (plus longue sous-suite commune), bornée pour rester rapide
function lineDiff(before, after, max = 800) {
  const a = String(before || "").split("\n").slice(0, max), b = String(after || "").split("\n").slice(0, max);
  const n = a.length, m = b.length;
  const lcs = Array.from({ length: n + 1 }, () => new Uint16Array(m + 1));
  for (let i = n - 1; i >= 0; i -= 1) for (let j = m - 1; j >= 0; j -= 1) lcs[i][j] = a[i] === b[j] ? lcs[i + 1][j + 1] + 1 : Math.max(lcs[i + 1][j], lcs[i][j + 1]);
  const out = [];
  let i = 0, j = 0;
  while (i < n && j < m) {
    if (a[i] === b[j]) { i += 1; j += 1; } else if (lcs[i + 1][j] >= lcs[i][j + 1]) { out.push({ op: "-", text: a[i] }); i += 1; } else { out.push({ op: "+", text: b[j] }); j += 1; }
  }
  for (; i < n; i += 1) out.push({ op: "-", text: a[i] });
  for (; j < m; j += 1) out.push({ op: "+", text: b[j] });
  return out;
}
const plain = (html) => String(html || "").replace(/<(br|\/p|\/h[1-6]|\/li|\/div)\s*\/?>/gi, "\n").replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/\n{2,}/g, "\n").trim();
function flatDiff(a, b, labels = {}) {
  const flat = (o, prefix = "", out = {}) => { for (const [k, v] of Object.entries(o || {})) { if (v && typeof v === "object" && !Array.isArray(v)) flat(v, `${prefix}${k}.`, out); else out[`${prefix}${k}`] = v; } return out; };
  const x = flat(a), y = flat(b), items = [];
  for (const key of new Set([...Object.keys(x), ...Object.keys(y)])) {
    if (JSON.stringify(x[key]) !== JSON.stringify(y[key])) items.push({ label: labels[key] || key.replace(/\./g, " › "), before: x[key] === undefined ? "(absent)" : String(JSON.stringify(x[key])).slice(0, 80), after: y[key] === undefined ? "(absent)" : String(JSON.stringify(y[key])).slice(0, 80) });
  }
  return items;
}
const wrap = (groups) => {
  const g = groups.filter((x) => (x.items && x.items.length) || (x.lines && x.lines.length));
  return { groups: g, total: g.reduce((n, x) => n + (x.lines ? x.lines.filter((l) => l.op !== "=").length : x.items.length), 0) };
};
// Quelques extraits de texte du contenu d'une page (titres, textes, boutons) pour reconnaître une version d'un coup d'œil
function snippets(content, max = 8) {
  const out = [];
  const walk = (node) => {
    if (!node || out.length >= max) return;
    const p = node.props || {};
    const text = String(p.text || p.label || (p.html ? plain(p.html) : "") || "").replace(/\s+/g, " ").trim();
    if (text) out.push(text.slice(0, 120));
    (node.children || []).forEach(walk);
  };
  (content.sections || []).forEach(walk);
  return out;
}

// ---------- Adaptateur : PAGE (aussi les modèles de thème, qui sont des pages du Page Builder) ----------
const pageAdapter = {
  label: "Page", urlOf: (id) => `/marketing/pages/${id}`,
  info(ctx, id) {
    const r = ctx.db.prepare("SELECT id, name, site_id, archived_at, status, revision, updated_at, (draft IS NOT NULL) AS has_draft FROM mk_landing_pages WHERE id = ? AND organization_id = ?").get(id, ctx.organizationId);
    return r ? { id: r.id, title: r.name, siteId: r.site_id, trashed: Boolean(r.archived_at), status: r.status, hasDraft: Boolean(r.has_draft), updatedAt: r.updated_at } : null;
  },
  list(ctx, id) {
    const out = [];
    for (const v of ctx.db.prepare("SELECT v.number, v.reason, v.created_at, u.username AS by FROM mk_page_versions v LEFT JOIN users u ON u.id = v.created_by WHERE v.page_id = ? ORDER BY v.number DESC LIMIT ?").all(id, LIST_LIMIT)) {
      out.push({ ref: `v:${v.number}`, kind: v.reason === "import" ? "import" : "publish", label: `Version publiée n° ${v.number}`, at: v.created_at, by: v.by, previewable: true });
    }
    if (tableReady(ctx.db)) for (const r of ctx.db.prepare("SELECT r.id, r.kind, r.label, r.updated_at, r.created_at, u.username AS by FROM cms_revisions r LEFT JOIN users u ON u.id = r.created_by WHERE r.content_type = 'page' AND r.content_id = ? ORDER BY r.id DESC LIMIT ?").all(id, LIST_LIMIT)) {
      out.push({ ref: `r:${r.id}`, kind: r.kind, label: r.label || KINDS[r.kind] || r.kind, at: r.kind === "draft" ? r.updated_at : r.created_at, by: r.by, previewable: true, deletable: r.kind === "draft" });
    }
    return out;
  },
  content(ctx, id, ref) {
    const pages = require("../marketing/pages");
    if (ref === "draft" || ref === "live") { const p = pages.requirePage(ctx, id); return ref === "live" ? p.published : p.working; }
    const m = /^([vr]):(\d+)$/.exec(String(ref));
    if (!m) throw new UserError("Version introuvable.");
    if (m[1] === "v") return pages.getVersion(ctx, id, Number(m[2])).content;
    const row = ctx.db.prepare("SELECT data FROM cms_revisions WHERE id = ? AND content_type = 'page' AND content_id = ?").get(Number(m[2]), id);
    if (!row) throw new UserError("Version introuvable.");
    return parse(row.data, {});
  },
  get(ctx, id, ref) {
    const content = this.content(ctx, id, ref);
    const entry = this.list(ctx, id).find((e) => e.ref === ref) || { ref, kind: "current", label: ref === "live" ? "Version en ligne" : "Brouillon actuel", at: null, by: null };
    return { ...entry, data: content, summary: [["Titre", content.title], ["Description", content.description], ["Sections", `${(content.sections || []).length}`], ["Extraits du contenu", snippets(content).join(" · ")]].filter((x) => x[1] !== undefined) };
  },
  compare(ctx, id, refA, refB) {
    const a = this.content(ctx, id, refA), b = this.content(ctx, id, refB);
    const d = require("../marketing/pages/compare").compareContents(a, b);
    return { ...wrap([
      { title: "Réglages de la page", items: d.page.map((label) => ({ label, what: "modifié" })) },
      { title: "Ajouté dans la seconde version", items: d.added.map((x) => ({ label: x.label })) },
      { title: "Retiré dans la seconde version", items: d.removed.map((x) => ({ label: x.label })) },
      { title: "Modifié", items: d.modified.map((x) => ({ label: x.label, what: x.what.join(", ") })) },
    ]), structured: true };
  },
  // Restaurer = nouvel état de BROUILLON (le contenu en ligne ne change qu'à la publication). Transaction : état actuel sauvegardé, brouillon remplacé, restauration tracée.
  restore(ctx, id, ref) {
    const pages = require("../marketing/pages");
    const page = pages.requirePage(ctx, id);
    if (page.archived_at) throw new UserError("Cette page est dans la corbeille : restaurez-la d'abord.");
    const content = this.content(ctx, id, ref);
    const entry = this.list(ctx, id).find((e) => e.ref === ref);
    return transaction(ctx.db, () => {
      if (page.hasDraft) record({ type: "page", id, siteId: page.site_id, kind: "before_restore", label: "État du brouillon avant la restauration", data: page.working, userId: ctx.userId, handle: ctx.db });
      const saved = pages.saveDraft(ctx, id, content, { revision: page.revision, record: false });
      record({ type: "page", id, siteId: page.site_id, kind: "restore", label: `Restauration : ${entry ? entry.label : ref}`, data: saved.content, userId: ctx.userId, handle: ctx.db });
      return { revision: saved.revision };
    });
  },
};

// ---------- Adaptateur : ARTICLE (historique existant : post_revisions) ----------
const postAdapter = {
  label: "Article", urlOf: (id) => `/formateur/blog/${id}/modifier`,
  info(ctx, id) {
    const r = db.prepare("SELECT id, title, author_id, deleted_at, status, updated_at FROM posts WHERE id = ?").get(id);
    return r ? { id: r.id, title: r.title, siteId: null, trashed: Boolean(r.deleted_at), status: r.status, authorId: r.author_id, updatedAt: r.updated_at } : null;
  },
  list(ctx, id) {
    const out = [];
    const auto = db.prepare("SELECT a.saved_at, u.username AS by FROM post_autosaves a LEFT JOIN users u ON u.id = a.user_id WHERE a.post_id = ?").get(id);
    if (auto) out.push({ ref: "autosave", kind: "autosave", label: "Sauvegarde automatique non enregistrée", at: auto.saved_at, by: auto.by, previewable: false });
    for (const r of db.prepare("SELECT r.id, r.kind, r.note, r.created_at, u.username AS by FROM post_revisions r LEFT JOIN users u ON u.id = r.user_id WHERE r.post_id = ? ORDER BY r.id DESC LIMIT ?").all(id, LIST_LIMIT)) {
      out.push({ ref: `r:${r.id}`, kind: r.kind, label: r.note || KINDS[r.kind] || r.kind, at: r.created_at, by: r.by, previewable: false });
    }
    return out;
  },
  content(ctx, id, ref) {
    if (ref === "autosave") { const a = db.prepare("SELECT payload FROM post_autosaves WHERE post_id = ?").get(id); const p = a ? parse(a.payload, {}) : null; if (!p) throw new UserError("Aucune sauvegarde automatique."); return { title: p.title || "", excerpt: p.excerpt || "", content: p.content || "", content_format: p.content_format || "html", meta: {} }; }
    if (ref === "current") { const p = db.prepare("SELECT title, excerpt, content, content_format FROM posts WHERE id = ?").get(id); return { ...p, meta: {} }; }
    const m = /^r:(\d+)$/.exec(String(ref));
    const r = m && db.prepare("SELECT title, excerpt, content, content_format, meta FROM post_revisions WHERE id = ? AND post_id = ?").get(Number(m[1]), id);
    if (!r) throw new UserError("Version introuvable.");
    return { title: r.title, excerpt: r.excerpt, content: r.content, content_format: r.content_format, meta: parse(r.meta, {}) };
  },
  get(ctx, id, ref) {
    const data = this.content(ctx, id, ref);
    const entry = this.list(ctx, id).find((e) => e.ref === ref) || { ref, kind: "current", label: "État actuel", at: null, by: null };
    return { ...entry, data, summary: [["Titre", data.title], ["Extrait", data.excerpt], ["Texte", plain(data.content).slice(0, 600)]] };
  },
  compare(ctx, id, refA, refB) {
    const a = this.content(ctx, id, refA), b = this.content(ctx, id, refB);
    const groups = [];
    if (a.title !== b.title) groups.push({ title: "Titre", items: [{ label: "Titre", before: a.title, after: b.title }] });
    if (a.excerpt !== b.excerpt) groups.push({ title: "Extrait", lines: lineDiff(a.excerpt, b.excerpt) });
    const body = lineDiff(plain(a.content), plain(b.content));
    if (body.some((l) => l.op !== "=")) groups.push({ title: "Texte", lines: body });
    const labels = { category: "Catégorie", subcategory: "Sous-catégorie", tags: "Étiquettes", slug: "Adresse", seo_title: "Titre SEO", seo_description: "Description SEO", cover_path: "Image de couverture", cover_alt: "Texte alternatif de l'image", status: "État" };
    groups.push({ title: "Réglages", items: flatDiff(a.meta, b.meta, labels) });
    return { ...wrap(groups), text: true };
  },
  // La restauration d'un article passe par l'éditeur du blog (transaction éprouvée : état actuel sauvegardé, restauration tracée)
  restorable: false,
  restoreUrl: (id, ref) => (/^r:(\d+)$/.test(ref) ? `/formateur/blog/${id}/versions/${ref.slice(2)}/restaurer` : null),
};

// ---------- Adaptateur : APPARENCE (styles + en-tête + pied de page du site public) ----------
const appearanceAdapter = {
  label: "Apparence du site", urlOf: () => "/marketing/site-web/apparence",
  info() { return { id: 0, title: "Apparence du site", siteId: null, trashed: false }; },
  list() {
    const out = [];
    for (const r of db.prepare("SELECT r.id, r.note, r.created_at, u.username AS by FROM appearance_revisions r LEFT JOIN users u ON u.id = r.created_by WHERE r.site_id IS NULL ORDER BY r.id DESC LIMIT ?").all(LIST_LIMIT)) {
      out.push({ ref: `p:${r.id}`, kind: "publish", label: r.note || "Publication de l'apparence", at: r.created_at, by: r.by, previewable: false });
    }
    for (const r of db.prepare("SELECT r.id, r.kind, r.label, r.created_at, r.updated_at, u.username AS by FROM cms_revisions r LEFT JOIN users u ON u.id = r.created_by WHERE r.content_type = 'appearance' AND r.content_id = 0 ORDER BY r.id DESC LIMIT ?").all(LIST_LIMIT)) {
      out.push({ ref: `r:${r.id}`, kind: r.kind, label: r.label || KINDS[r.kind] || r.kind, at: r.kind === "draft" ? r.updated_at : r.created_at, by: r.by, previewable: false, deletable: r.kind === "draft" });
    }
    return out;
  },
  content(ctx, id, ref) {
    const appearance = require("./appearance");
    if (ref === "draft") return appearance.state(null).draft;
    if (ref === "live") return appearance.state(null).published;
    const m = /^([pr]):(\d+)$/.exec(String(ref));
    if (!m) throw new UserError("Version introuvable.");
    const row = m[1] === "p" ? db.prepare("SELECT config AS data FROM appearance_revisions WHERE id = ? AND site_id IS NULL").get(Number(m[2])) : db.prepare("SELECT data FROM cms_revisions WHERE id = ? AND content_type = 'appearance' AND content_id = 0").get(Number(m[2]));
    if (!row) throw new UserError("Version introuvable.");
    return parse(row.data, {});
  },
  get(ctx, id, ref) {
    const data = this.content(ctx, id, ref);
    const entry = this.list(ctx, id).find((e) => e.ref === ref) || { ref, kind: "current", label: ref === "live" ? "Version en ligne" : "Brouillon actuel", at: null, by: null };
    const c = (data.tokens || {}).colors || {};
    return { ...entry, data, summary: [["Logo de l'en-tête", ((data.header || {}).logo || {}).text], ["Couleur principale", c.primary], ["Bouton d'action", ((data.header || {}).cta || {}).enabled ? data.header.cta.label : "aucun"], ["Phrase du pied de page", (data.footer || {}).tagline]] };
  },
  compare(ctx, id, refA, refB) {
    const a = this.content(ctx, id, refA), b = this.content(ctx, id, refB);
    const title = { tokens: "Styles", header: "En-tête", footer: "Pied de page" };
    return wrap(["tokens", "header", "footer"].map((k) => ({ title: title[k], items: flatDiff(a[k], b[k]) })));
  },
  restore(ctx, id, ref) {
    const appearance = require("./appearance");
    const st = appearance.state(null);
    const data = this.content(ctx, id, ref);
    return transaction(db, () => {
      if (st.hasDraft) record({ type: "appearance", id: 0, kind: "before_restore", label: "État du brouillon avant la restauration", data: st.draft, userId: ctx.userId });
      appearance.setDraft(null, data, ctx.userId);
      record({ type: "appearance", id: 0, kind: "restore", label: `Restauration dans le brouillon : ${ref}`, data, userId: ctx.userId });
    });
  },
};

// ---------- Adaptateur : PATTERN ----------
const patternAdapter = {
  label: "Pattern", urlOf: () => "/marketing/site-web/apparence/patterns",
  info(ctx, id) {
    const r = db.prepare("SELECT id, name, site_id, deleted_at FROM appearance_patterns WHERE id = ?").get(id);
    return r ? { id: r.id, title: r.name, siteId: r.site_id, trashed: Boolean(r.deleted_at) } : null;
  },
  list(ctx, id) {
    return db.prepare("SELECT r.id, r.kind, r.label, r.created_at, u.username AS by FROM cms_revisions r LEFT JOIN users u ON u.id = r.created_by WHERE r.content_type = 'pattern' AND r.content_id = ? ORDER BY r.id DESC LIMIT ?").all(id, LIST_LIMIT)
      .map((r) => ({ ref: `r:${r.id}`, kind: r.kind, label: r.label || KINDS[r.kind] || r.kind, at: r.created_at, by: r.by, previewable: false }));
  },
  content(ctx, id, ref) {
    const m = /^r:(\d+)$/.exec(String(ref));
    const row = m && db.prepare("SELECT data FROM cms_revisions WHERE id = ? AND content_type = 'pattern' AND content_id = ?").get(Number(m[1]), id);
    if (!row) throw new UserError("Version introuvable.");
    return parse(row.data, {});
  },
  get(ctx, id, ref) {
    const data = this.content(ctx, id, ref);
    const entry = this.list(ctx, id).find((e) => e.ref === ref);
    return { ...entry, data, summary: [["Nom", data.name], ["Description", data.description], ["Sections", `${(data.sections || []).length}`]] };
  },
  compare(ctx, id, refA, refB) {
    const a = this.content(ctx, id, refA), b = this.content(ctx, id, refB);
    return wrap([{ title: "Informations", items: flatDiff({ name: a.name, description: a.description, category: a.category }, { name: b.name, description: b.description, category: b.category }, { name: "Nom", description: "Description", category: "Catégorie" }) },
      { title: "Contenu", items: JSON.stringify(a.sections) !== JSON.stringify(b.sections) ? [{ label: "Sections du pattern", what: "modifiées" }] : [] }]);
  },
  restore(ctx, id, ref) {
    const data = this.content(ctx, id, ref);
    const cur = db.prepare("SELECT * FROM appearance_patterns WHERE id = ?").get(id);
    if (!cur || cur.deleted_at) throw new UserError("Ce pattern est dans la corbeille : restaurez-le d'abord.");
    if (db.prepare(`SELECT 1 FROM appearance_patterns WHERE ${sameScope("site_id")} AND name = ? COLLATE NOCASE AND id <> ? AND deleted_at IS NULL`).get(cur.site_id, data.name, id)) throw new UserError(`Un pattern « ${data.name} » existe déjà : renommez-le d'abord.`);
    transaction(db, () => {
      record({ type: "pattern", id, siteId: cur.site_id, kind: "before_restore", label: "État avant la restauration", data: patternData(cur), userId: ctx.userId });
      db.prepare("UPDATE appearance_patterns SET name = ?, description = ?, category = ?, sections = ?, updated_at = datetime('now') WHERE id = ?").run(data.name, data.description || "", data.category || cur.category, JSON.stringify(data.sections || []), id);
      record({ type: "pattern", id, siteId: cur.site_id, kind: "restore", label: `Restauration : ${ref}`, data, userId: ctx.userId });
    });
  },
};
const patternData = (r) => ({ name: r.name, description: r.description, category: r.category, sections: parse(r.sections, []) });

const TYPES = { page: pageAdapter, post: postAdapter, appearance: appearanceAdapter, pattern: patternAdapter };
const adapter = (type) => { const a = TYPES[type]; if (!a) throw new UserError("Type de contenu inconnu."); return a; };

// ---------- Historique d'un élément (pagination en mémoire sur au plus LIST_LIMIT lignes par source) ----------
function history(ctx, type, id, { page = 1, kind = "" } = {}) {
  const a = adapter(type);
  let rows = a.list(ctx, id).sort((x, y) => String(y.at || "").localeCompare(String(x.at || "")));
  if (kind) rows = rows.filter((r) => r.kind === kind);
  const total = rows.length, pages = Math.max(1, Math.ceil(total / PER_PAGE)), current = Math.min(Math.max(1, Math.floor(Number(page)) || 1), pages);
  return { rows: rows.slice((current - 1) * PER_PAGE, current * PER_PAGE), total, page: current, pages, kinds: [...new Set(a.list(ctx, id).map((r) => r.kind))] };
}
function deleteRevision(type, id, ref) {
  const m = /^r:(\d+)$/.exec(String(ref));
  if (!m || !["page", "appearance", "pattern"].includes(type)) throw new UserError("Cette version ne se supprime pas de l'historique.");
  const row = db.prepare("SELECT kind FROM cms_revisions WHERE id = ? AND content_type = ? AND content_id = ?").get(Number(m[1]), type, id);
  if (!row) throw new UserError("Version introuvable.");
  if (row.kind !== "draft") throw new UserError("Seuls les points de brouillon se suppriment ; publications, restaurations et états avant restauration sont conservés.");
  db.prepare("DELETE FROM cms_revisions WHERE id = ?").run(Number(m[1]));
}

// ---------- Hooks appelés par les modules (jamais bloquants) ----------
const hooks = {
  pageDraft: (ctx, page, content) => safely(() => record({ type: "page", id: page.id, siteId: page.site_id ?? null, kind: "draft", label: "Brouillon enregistré", data: content, userId: ctx.userId, compact: true, handle: ctx.db })),
  appearanceDraft: (data, userId) => safely(() => record({ type: "appearance", id: 0, kind: "draft", label: "Brouillon enregistré", data, userId, compact: true })),
  pattern: (id, siteId, kind, label, row, userId) => safely(() => record({ type: "pattern", id, siteId, kind, label, data: patternData(row), userId })),
};

// ---------- Corbeille commune ----------
const like = (s) => `%${String(s).replace(/[\\%_]/g, "\\$&")}%`;
// Portée de site de la corbeille : l'organisation de la requête, puis le site (accès limité = son site ; équipe = site choisi, sinon tous). Sans contexte : aucune restriction (usage interne).
const siteWhere = (ctx, col) => {
  const site = ctx ? require("./siteContent").listSite(ctx) : null;
  return site === null ? { sql: "", params: [] } : site === 0 ? { sql: ` AND ${col} IS NULL`, params: [] } : { sql: ` AND ${col} = ?`, params: [site] };
};
const orgWhere = (ctx, col) => (ctx && ctx.organizationId ? { sql: ` AND ${col} = ?`, params: [ctx.organizationId] } : { sql: "", params: [] });
const trashParts = (ctx) => {
  const sc = require("./siteContent");
  const post = ctx ? sc.scopePredicate(ctx, "post", "p.id") : null, com = ctx ? sc.commentPredicate(ctx, "c") : null;
  const pg = siteWhere(ctx, "p.site_id"), pgo = orgWhere(ctx, "p.organization_id"), md = siteWhere(ctx, "m.site_id"), mdo = orgWhere(ctx, "m.organization_id"), pt = siteWhere(ctx, "t.site_id");
  return {
    page: { from: `mk_landing_pages p WHERE p.archived_at IS NOT NULL AND p.kind <> 'step'${pg.sql}${pgo.sql}`, params: [...pg.params, ...pgo.params] },
    post: { from: `posts p WHERE p.deleted_at IS NOT NULL AND p.page_key IS NULL${post ? ` AND ${post.sql}` : ""}`, params: post ? post.params : [] },
    media: { from: `mk_media m WHERE m.deleted_at IS NOT NULL${md.sql}${mdo.sql}`, params: [...md.params, ...mdo.params] },
    comment: { from: `blog_comments c WHERE c.status = 'trash'${com ? ` AND ${com.sql}` : ""}`, params: com ? com.params : [] },
    pattern: { from: `appearance_patterns t WHERE t.deleted_at IS NOT NULL${pt.sql}`, params: pt.params },
  };
};
const TRASH_TYPES = {
  page: { label: "Page", del: "pages.delete", write: "forms.write" },
  post: { label: "Article", del: "articles.delete", write: "articles.write" },
  media: { label: "Média", del: "media.delete", write: "media.write" },
  comment: { label: "Commentaire", del: "comments.delete", write: "comments.moderate" },
  pattern: { label: "Pattern", del: "appearance.patterns", write: "appearance.patterns" },
};
function trashList({ type = "", q = "", page = 1, perPage = 25, ctx = null } = {}) {
  const parts = [], args = [];
  const P = trashParts(ctx);
  const add = (t, select, search) => {
    if (type && type !== t) return;
    const term = q ? like(q) : null;
    parts.push(`SELECT ${select} FROM ${P[t].from}${term ? ` AND (${search.map((c) => `${c} LIKE ? ESCAPE '\\'`).join(" OR ")})` : ""}`);
    args.push(...P[t].params, ...(term ? search.map(() => term) : []));
  };
  add("page", "'page' AS type, p.id, p.name AS title, COALESCE((SELECT name FROM mk_sites WHERE id = p.site_id), '') AS detail, p.archived_at AS deleted_at", ["p.name"]);
  add("post", "'post' AS type, p.id, p.title, COALESCE(NULLIF(p.category, ''), '') AS detail, p.deleted_at", ["p.title"]);
  add("media", "'media' AS type, m.id, COALESCE(NULLIF(m.title, ''), m.name) AS title, m.type AS detail, m.deleted_at", ["m.name", "m.title"]);
  add("comment", "'comment' AS type, c.id, substr(c.body, 1, 80) AS title, COALESCE(NULLIF(c.author_name, ''), (SELECT username FROM users WHERE id = c.user_id), 'Anonyme') AS detail, COALESCE(c.deleted_at, c.updated_at) AS deleted_at", ["c.body"]);
  add("pattern", "'pattern' AS type, t.id, t.name AS title, t.category AS detail, t.deleted_at", ["t.name"]);
  if (!parts.length) return { rows: [], total: 0, page: 1, pages: 1 };
  const base = parts.join(" UNION ALL ");
  const total = db.prepare(`SELECT COUNT(*) n FROM (${base})`).get(...args).n;
  const pages = Math.max(1, Math.ceil(total / perPage)), current = Math.min(Math.max(1, Math.floor(Number(page)) || 1), pages);
  const rows = db.prepare(`SELECT * FROM (${base}) ORDER BY deleted_at DESC, id DESC LIMIT ? OFFSET ?`).all(...args, perPage, (current - 1) * perPage);
  return { rows: rows.map((r) => ({ ...r, typeLabel: TRASH_TYPES[r.type].label })), total, page: current, pages };
}
const trashCounts = (ctx = null) => { const P = trashParts(ctx); return Object.fromEntries(Object.keys(TRASH_TYPES).map((k) => [k, db.prepare(`SELECT COUNT(*) n FROM ${P[k].from}`).get(...P[k].params).n])); };
// L'élément est-il dans la corbeille ET dans la portée (organisation, site) de la requête ? Sert à refuser toute restauration / suppression hors périmètre.
const inTrash = (ctx, type, id) => Object.hasOwn(TRASH_TYPES, type) && Boolean(db.prepare(`SELECT 1 FROM ${trashParts(ctx)[type].from} AND ${{ page: "p", post: "p", media: "m", comment: "c", pattern: "t" }[type]}.id = ?`).get(...trashParts(ctx)[type].params, id));

// Dépendances d'un élément à restaurer : bloquantes (rien n'est restauré) ou à signaler (restauré, mais le problème est dit clairement)
function dependencies(ctx, type, id) {
  const blocking = [], warnings = [];
  if (type === "page") {
    const p = db.prepare("SELECT p.site_id, p.parent_id, s.status AS site_status, s.name AS site_name FROM mk_landing_pages p LEFT JOIN mk_sites s ON s.id = p.site_id WHERE p.id = ?").get(id);
    if (p && p.site_id && p.site_status !== "active") blocking.push(`Le site « ${p.site_name || "?"} » de cette page est archivé : restaurez le site d'abord.`);
    if (p && p.parent_id && db.prepare("SELECT 1 FROM mk_landing_pages WHERE id = ? AND archived_at IS NOT NULL").get(p.parent_id)) warnings.push("Sa page parente est elle aussi dans la corbeille.");
  } else if (type === "post") {
    const p = db.prepare("SELECT author_id, category, cover_path FROM posts WHERE id = ?").get(id);
    if (p && p.author_id && !db.prepare("SELECT 1 FROM users WHERE id = ?").get(p.author_id)) warnings.push("Son auteur n'existe plus : l'article sera sans auteur.");
    if (p && p.category && !db.prepare("SELECT 1 FROM taxonomy_relations WHERE content_type = 'post' AND content_id = ?").get(id)) warnings.push(`Sa catégorie « ${p.category} » n'existe plus : à reclasser.`);
    if (p && p.cover_path && /^\/uploads\//.test(p.cover_path)) { try { if (!require("fs").existsSync(require("path").join(process.env.UPLOADS_DIR || require("path").join(__dirname, "../../uploads"), p.cover_path.replace(/^\/uploads\//, "")))) warnings.push("Son image de couverture est introuvable."); } catch { /* vérification facultative */ } }
  } else if (type === "comment") {
    const c = db.prepare("SELECT content_type, content_id FROM blog_comments WHERE id = ?").get(id);
    const post = c && db.prepare("SELECT deleted_at FROM posts WHERE id = ?").get(c.content_id);
    if (!post) blocking.push("L'article de ce commentaire n'existe plus.");
    else if (post.deleted_at) blocking.push("L'article de ce commentaire est dans la corbeille : restaurez-le d'abord.");
  } else if (type === "pattern") {
    const p = db.prepare("SELECT site_id, name FROM appearance_patterns WHERE id = ?").get(id);
    if (p && db.prepare(`SELECT 1 FROM appearance_patterns WHERE ${sameScope("site_id")} AND name = ? COLLATE NOCASE AND id <> ? AND deleted_at IS NULL`).get(p.site_id, p.name, id)) blocking.push(`Un pattern « ${p.name} » existe déjà : renommez l'un des deux.`);
  }
  return { blocking, warnings };
}

module.exports = {
  KINDS, DRAFT_WINDOW_MIN, MAX_DRAFT_POINTS, PER_PAGE, TRASH_TYPES, TYPES, adapter, record, safely, hooks, lineDiff, plain, history, deleteRevision, trashList, trashCounts, inTrash, dependencies, patternData, fp,
};
