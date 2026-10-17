// KOLAKISA — contenus par site (R6, lot 1) : appartenance des ARTICLES et des TERMES de taxonomie à un site, sans toucher aux tables du cœur.
//   Données : table mk_content_sites (migration 075). Pas de ligne = site principal (tous les contenus historiques). Les commentaires suivent leur article.
//   Ce module fournit : l'appartenance (assign / clear / siteOf), des lectures LIMITÉES à la portée de la personne (ctx.siteScope imposé par le serveur ; ctx.siteFilter = simple
//   filtre d'affichage de l'équipe), les gardes d'écriture (requirePostInScope / requireTermInScope) et l'inventaire en lecture seule (inventory).
//   Il ne change AUCUNE adresse publique, AUCUNE redirection, AUCUNE route : /blog/... et /p/... restent exactement ce qu'ils sont ; l'unicité par site (adresse logique) est préparée,
//   pas imposée. La reconstruction des tables et les changements d'adresses publiques relèvent d'étapes ultérieures, autorisées séparément.
const { MarketingError } = require("../marketing/errors");
const { transaction } = require("../marketing/db/tx");
const { recordAudit } = require("../marketing/audit");

const TYPES = Object.freeze({
  post: { table: "posts", label: "article" },
  term: { table: "taxonomy_terms", label: "terme" },
});
const ADDRESS = /^[a-z0-9][a-z0-9-]{0,119}$/;
const orgLevel = (ctx) => !Number.isInteger(ctx.siteScope);
const has = (db, name, type = "table") => Boolean(db.prepare("SELECT 1 FROM sqlite_master WHERE type = ? AND name = ?").get(type, name));

// ---------- Déclencheurs qui touchent aux tables du cœur (posés au démarrage, idempotents) ----------
// - suppression d'un article / d'un terme : ses relations puis sa ligne d'appartenance disparaissent (aucun orphelin, quel que soit le code qui supprime) ;
// - une relation article ↔ terme n'est possible qu'entre contenus du MÊME site (protège aussi les écritures existantes : éditeur, import, fusion de termes) ;
// - changer le site (ou le retirer) d'un article/terme est refusé tant que des relations le lieraient à un contenu d'un autre site.
// Sur les contenus historiques (aucune ligne), tous sont « site principal » : aucun effet.
function ensureCoreTriggers(db) {
  if (!has(db, "mk_content_sites") || !has(db, "posts") || !has(db, "taxonomy_terms") || !has(db, "taxonomy_relations")) return { created: 0, skipped: true };
  const MSG_REL = "Un terme et l''article auquel il est lié doivent appartenir au même site.";
  const MSG_MOVE = "Ce contenu est lié à des contenus d''un autre site : retirez d''abord ces liens.";
  const siteOfTerm = (idExpr) => `COALESCE((SELECT site_id FROM mk_content_sites WHERE content_type = 'term' AND content_id = ${idExpr}), 0)`;
  const siteOfPost = (idExpr) => `COALESCE((SELECT site_id FROM mk_content_sites WHERE content_type = 'post' AND content_id = ${idExpr}), 0)`;
  // Un article placé dans le site X : tous ses termes doivent être du site X ; un terme placé dans le site X : tous les articles qui l'utilisent doivent l'être
  const movePost = (site) => `EXISTS (SELECT 1 FROM taxonomy_relations r WHERE r.content_type = 'post' AND r.content_id = %ID% AND ${siteOfTerm("r.term_id")} <> ${site})`;
  const moveTerm = (site) => `EXISTS (SELECT 1 FROM taxonomy_relations r WHERE r.content_type = 'post' AND r.term_id = %ID% AND ${siteOfPost("r.content_id")} <> ${site})`;
  const defs = [
    ["trg_mk_cs_post_delete", "AFTER DELETE ON posts", "", "DELETE FROM taxonomy_relations WHERE content_type = 'post' AND content_id = OLD.id; DELETE FROM mk_content_sites WHERE content_type = 'post' AND content_id = OLD.id;"],
    ["trg_mk_cs_term_delete", "AFTER DELETE ON taxonomy_terms", "", "DELETE FROM taxonomy_relations WHERE term_id = OLD.id; DELETE FROM mk_content_sites WHERE content_type = 'term' AND content_id = OLD.id;"],
    ["trg_mk_cs_relation", "BEFORE INSERT ON taxonomy_relations", "WHEN NEW.content_type = 'post'", `SELECT RAISE(ABORT, '${MSG_REL}') WHERE ${siteOfTerm("NEW.term_id")} <> ${siteOfPost("NEW.content_id")};`],
    ["trg_mk_cs_assign_post", "BEFORE INSERT ON mk_content_sites", "WHEN NEW.content_type = 'post'", `SELECT RAISE(ABORT, '${MSG_MOVE}') WHERE ${movePost("NEW.site_id").replace("%ID%", "NEW.content_id")};`],
    ["trg_mk_cs_assign_term", "BEFORE INSERT ON mk_content_sites", "WHEN NEW.content_type = 'term'", `SELECT RAISE(ABORT, '${MSG_MOVE}') WHERE ${moveTerm("NEW.site_id").replace("%ID%", "NEW.content_id")};`],
    ["trg_mk_cs_change_post", "BEFORE UPDATE OF site_id ON mk_content_sites", "WHEN NEW.content_type = 'post'", `SELECT RAISE(ABORT, '${MSG_MOVE}') WHERE ${movePost("NEW.site_id").replace("%ID%", "NEW.content_id")};`],
    ["trg_mk_cs_change_term", "BEFORE UPDATE OF site_id ON mk_content_sites", "WHEN NEW.content_type = 'term'", `SELECT RAISE(ABORT, '${MSG_MOVE}') WHERE ${moveTerm("NEW.site_id").replace("%ID%", "NEW.content_id")};`],
    // Retour au site principal (suppression de la ligne) : seulement si rien n'est lié à un autre site. Ces déclencheurs ne citent PAS les tables posts / taxonomy_terms : un déclencheur
    // d'une autre table qui les cite empêcherait l'outil de reconstruction (DROP + RENAME) de fonctionner ; la suppression d'un contenu retire d'abord ses relations (ci-dessus), donc passe.
    ["trg_mk_cs_clear_post", "BEFORE DELETE ON mk_content_sites", "WHEN OLD.content_type = 'post'", `SELECT RAISE(ABORT, '${MSG_MOVE}') WHERE ${movePost("0").replace("%ID%", "OLD.content_id")};`],
    ["trg_mk_cs_clear_term", "BEFORE DELETE ON mk_content_sites", "WHEN OLD.content_type = 'term'", `SELECT RAISE(ABORT, '${MSG_MOVE}') WHERE ${moveTerm("0").replace("%ID%", "OLD.content_id")};`],
  ];
  let created = 0;
  for (const [name, event, when, body] of defs) {
    if (has(db, name, "trigger")) continue;
    db.exec(`CREATE TRIGGER ${name} ${event} ${when} BEGIN ${body} END`);
    created++;
  }
  return { created, skipped: false };
}

// ---------- Appartenance ----------
// undefined : le contenu n'existe pas ; null : site principal ; nombre : l'identifiant du site
function siteOf(db, type, id) {
  const def = TYPES[type];
  if (!def || !Number.isInteger(id)) return undefined;
  if (!db.prepare(`SELECT 1 FROM ${def.table} WHERE id = ?`).get(id)) return undefined;
  const row = db.prepare("SELECT site_id FROM mk_content_sites WHERE content_type = ? AND content_id = ?").get(type, id);
  return row ? row.site_id : null;
}
const scopeOf = (db, type, id) => (type === "term" ? (db.prepare("SELECT taxonomy FROM taxonomy_terms WHERE id = ?").get(id) || {}).taxonomy || "" : "");
const audit = (ctx, action, id, meta) => { if (ctx.userId != null && ctx.audit !== false) recordAudit(ctx.db, { organizationId: ctx.organizationId, userId: ctx.userId, action, resourceType: "content_site", resourceId: id, metadata: meta, siteId: meta && Number.isInteger(meta.site_id) ? meta.site_id : (meta && Number.isInteger(meta.from) ? meta.from : undefined) }); };

function checkAddress(address) {
  if (address === undefined || address === null || address === "") return null;
  if (typeof address !== "string" || !ADDRESS.test(address)) throw new MarketingError("invalid_field", "Adresse invalide : lettres minuscules, chiffres et tirets seulement (120 caractères au plus).");
  return address;
}
// Rattacher un article ou un terme à un site (ou changer son site / son adresse logique). Réservé à l'équipe de l'organisation : un accès limité à un site ne déplace rien.
// Tout ou rien (transaction) : en cas de refus, aucune ligne n'est écrite ni modifiée.
function assign(ctx, { type, id, siteId, address } = {}) {
  const db = ctx.db;
  if (!TYPES[type]) throw new MarketingError("invalid_field", "Type de contenu inconnu.");
  if (!orgLevel(ctx)) throw new MarketingError("forbidden", "Seule l'équipe de l'organisation peut rattacher un contenu à un site.");
  if (!Number.isInteger(siteId) || !db.prepare("SELECT 1 FROM mk_sites WHERE id = ? AND organization_id = ? AND deleted_at IS NULL").get(siteId, ctx.organizationId)) throw new MarketingError("not_found", "Site introuvable.");
  const current = siteOf(db, type, id);
  if (current === undefined) throw new MarketingError("not_found", "Contenu introuvable.");
  const logical = checkAddress(address);
  try {
    transaction(db, () => {
      if (current === null) db.prepare("INSERT INTO mk_content_sites (content_type, content_id, organization_id, site_id, scope, address, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)").run(type, id, ctx.organizationId, siteId, scopeOf(db, type, id), logical, ctx.userId ?? null);
      else db.prepare("UPDATE mk_content_sites SET site_id = ?, address = ? WHERE content_type = ? AND content_id = ?").run(siteId, logical, type, id);
    });
  } catch (error) {
    if (/UNIQUE constraint failed: mk_content_sites\.site_id/i.test(error.message)) throw new MarketingError("duplicate", "Cette adresse est déjà utilisée par un autre contenu de ce site.");
    if (/liés à des contenus d'un autre site/i.test(error.message)) throw new MarketingError("invalid_state", "Ce contenu est lié à des contenus d'un autre site : retirez d'abord ces liens.");
    throw error;
  }
  audit(ctx, "content.site_assigned", id, { type, site_id: siteId, from: current });
  return { type, id, siteId, address: logical };
}
// Retour au site principal (supprime la ligne ; l'adresse publique n'a jamais changé)
function clear(ctx, { type, id } = {}) {
  const db = ctx.db;
  if (!TYPES[type]) throw new MarketingError("invalid_field", "Type de contenu inconnu.");
  if (!orgLevel(ctx)) throw new MarketingError("forbidden", "Seule l'équipe de l'organisation peut changer le site d'un contenu.");
  const current = siteOf(db, type, id);
  if (current === undefined) throw new MarketingError("not_found", "Contenu introuvable.");
  if (current === null) return { type, id, siteId: null };
  try { db.prepare("DELETE FROM mk_content_sites WHERE content_type = ? AND content_id = ?").run(type, id); }
  catch (error) { if (/liés à des contenus d'un autre site/i.test(error.message)) throw new MarketingError("invalid_state", "Ce contenu est lié à des contenus d'un autre site : retirez d'abord ces liens."); throw error; }
  audit(ctx, "content.site_cleared", id, { type, from: current });
  return { type, id, siteId: null };
}

// ---------- Lectures limitées à la portée ----------
// ctx.siteScope (entier) : accès limité à CE site, imposé par le serveur ; ctx.siteFilter : filtre d'affichage de l'équipe (entier ou "principal")
function visibleSql(ctx, alias = "cs") {
  if (Number.isInteger(ctx.siteScope)) return { sql: `${alias}.site_id = ?`, params: [ctx.siteScope] };
  if (Number.isInteger(ctx.siteFilter)) return { sql: `${alias}.site_id = ?`, params: [ctx.siteFilter] };
  if (ctx.siteFilter === "principal") return { sql: `${alias}.site_id IS NULL`, params: [] };
  return { sql: "1 = 1", params: [] };
}
const inScope = (ctx, siteId) => {
  if (Number.isInteger(ctx.siteScope)) return siteId === ctx.siteScope;
  return true;
};
function listPosts(ctx, { published = null, limit = 50, offset = 0 } = {}) {
  const v = visibleSql(ctx);
  const where = [v.sql]; const args = [...v.params];
  if (published !== null) { where.push("p.published = ?"); args.push(published ? 1 : 0); }
  return ctx.db.prepare(`SELECT p.id, p.slug, p.title, p.published, cs.site_id AS site_id, cs.address AS address FROM posts p LEFT JOIN mk_content_sites cs ON cs.content_type = 'post' AND cs.content_id = p.id
    WHERE ${where.join(" AND ")} ORDER BY p.id LIMIT ? OFFSET ?`).all(...args, Math.min(Math.max(limit, 1), 500), Math.max(offset, 0));
}
function listTerms(ctx, { taxonomy = null, limit = 100, offset = 0 } = {}) {
  const v = visibleSql(ctx);
  const where = [v.sql]; const args = [...v.params];
  if (taxonomy) { where.push("t.taxonomy = ?"); args.push(taxonomy); }
  return ctx.db.prepare(`SELECT t.id, t.taxonomy, t.name, t.slug, cs.site_id AS site_id, cs.address AS address FROM taxonomy_terms t LEFT JOIN mk_content_sites cs ON cs.content_type = 'term' AND cs.content_id = t.id
    WHERE ${where.join(" AND ")} ORDER BY t.id LIMIT ? OFFSET ?`).all(...args, Math.min(Math.max(limit, 1), 500), Math.max(offset, 0));
}
// Garde d'accès par identifiant : à appeler AVANT toute lecture détaillée ou écriture d'un article / d'un terme dans un contexte de site. Hors portée = « introuvable » (on ne révèle rien).
function requireInScope(ctx, type, id) {
  const site = siteOf(ctx.db, type, id);
  if (site === undefined || !inScope(ctx, site)) throw new MarketingError("not_found", `${TYPES[type].label[0].toUpperCase()}${TYPES[type].label.slice(1)} introuvable.`);
  return { type, id, siteId: site };
}
const requirePostInScope = (ctx, id) => requireInScope(ctx, "post", id);
const requireTermInScope = (ctx, id) => requireInScope(ctx, "term", id);
// Commentaires d'un article : le site est celui de l'article (aucune donnée propre)
function listComments(ctx, postId, { limit = 100 } = {}) {
  requirePostInScope(ctx, postId);
  return ctx.db.prepare("SELECT id, content_type, content_id, status, created_at FROM blog_comments WHERE content_type = 'post' AND content_id = ? ORDER BY id LIMIT ?").all(postId, Math.min(Math.max(limit, 1), 500));
}
const siteOfComment = (db, commentId) => {
  const c = db.prepare("SELECT content_type, content_id FROM blog_comments WHERE id = ?").get(commentId);
  return c && c.content_type === "post" ? siteOf(db, "post", c.content_id) : undefined;
};


// ---------- Contenu NOUVEAU créé dans un site (lot 2) ----------
// Le site d'un contenu qu'on vient de créer : celui de l'accès limité (imposé par le serveur), ou le site choisi par l'équipe (?site=). Aucun site : site principal (rien à écrire).
// Autorisé à un accès limité UNIQUEMENT pour son propre site (contrairement à assign, réservé à l'équipe : déplacer un contenu existant).
function adopt(ctx, { type, id } = {}) {
  const db = ctx.db;
  if (!TYPES[type]) throw new MarketingError("invalid_field", "Type de contenu inconnu.");
  const target = Number.isInteger(ctx.siteScope) ? ctx.siteScope : Number.isInteger(ctx.siteFilter) ? ctx.siteFilter : null;
  if (target === null) return { type, id, siteId: null };
  if (!db.prepare("SELECT 1 FROM mk_sites WHERE id = ? AND organization_id = ? AND deleted_at IS NULL").get(target, ctx.organizationId)) throw new MarketingError("not_found", "Site introuvable.");
  if (siteOf(db, type, id) === undefined) throw new MarketingError("not_found", "Contenu introuvable.");
  db.prepare("INSERT OR IGNORE INTO mk_content_sites (content_type, content_id, organization_id, site_id, scope, created_by) VALUES (?, ?, ?, ?, ?, ?)").run(type, id, ctx.organizationId, target, scopeOf(db, type, id), ctx.userId ?? null);
  audit(ctx, "content.site_assigned", id, { type, site_id: target, from: null, created: true });
  return { type, id, siteId: target };
}

// ---------- Portée des listes et des opérations par identifiant (lot 2) ----------
// Deux niveaux, volontairement distincts :
//  - RESTRICTION (ctx.siteScope, accès limité à un site) : listes ET opérations par identifiant ne voient que ce site ;
//  - FILTRE D'AFFICHAGE (ctx.siteFilter, équipe qui choisit un site) : seules les LISTES sont filtrées ; l'équipe garde ses droits sur tous les contenus (comportement historique).
const listSite = (ctx) => (Number.isInteger(ctx.siteScope) ? ctx.siteScope : Number.isInteger(ctx.siteFilter) ? ctx.siteFilter : ctx.siteFilter === "principal" ? 0 : null);
// Fragment SQL « le contenu est dans la portée » pour une liste ; null = aucune restriction. idExpr : expression SQL de l'identifiant (ex. « p.id »)
function scopePredicate(ctx, type, idExpr) { return scopeForSite(type, idExpr, listSite(ctx)); }
// Même fragment pour un SITE donné (0 = site principal ; null = aucune restriction) : sert à l'éditeur, où les termes proposés sont ceux du site DE L'ARTICLE
function scopeForSite(type, idExpr, site) {
  if (site === null || site === undefined) return null;
  const base = `FROM mk_content_sites cs WHERE cs.content_type = '${type}' AND cs.content_id = ${idExpr}`;
  return site === 0 ? { sql: `NOT EXISTS (SELECT 1 ${base})`, params: [] } : { sql: `EXISTS (SELECT 1 ${base} AND cs.site_id = ?)`, params: [site] };
}
// Commentaires : le site est celui de l'article commenté ; les commentaires d'un autre type de contenu ne sont pas « d'un site » (visibles seulement hors restriction)
function commentPredicate(ctx, alias = "c") {
  const site = listSite(ctx);
  if (site === null) return null;
  const base = `FROM mk_content_sites cs WHERE cs.content_type = 'post' AND cs.content_id = ${alias}.content_id`;
  return site === 0 ? { sql: `(${alias}.content_type <> 'post' OR NOT EXISTS (SELECT 1 ${base}))`, params: [] } : { sql: `(${alias}.content_type = 'post' AND EXISTS (SELECT 1 ${base} AND cs.site_id = ?))`, params: [site] };
}
// Opération par identifiant : refusée seulement pour un accès limité à un site hors de son site (l'équipe garde tout)
// Les termes donnés appartiennent-ils tous au site indiqué (null = site principal) ? Renvoie les identifiants qui n'en sont pas (inconnus compris)
const termsOutsideSite = (db, termIds, siteId) => [...new Set((termIds || []).map(Number).filter((n) => Number.isInteger(n) && n > 0))].filter((id) => siteOf(db, "term", id) === undefined || (siteOf(db, "term", id) ?? null) !== (siteId ?? null));
const restricted = (ctx) => Number.isInteger(ctx.siteScope);
// Site « courant » des écrans de contenu (pour conserver ?site= dans les redirections et les formulaires) : accès limité ou site choisi par l'équipe ; sinon null
const siteParam = (ctx) => (Number.isInteger(ctx.siteScope) && ctx.siteScope > 0 ? ctx.siteScope : Number.isInteger(ctx.siteFilter) ? ctx.siteFilter : null);
const allowedContent = (ctx, type, id) => !restricted(ctx) || siteOf(ctx.db, type, id) === ctx.siteScope;
const allowedComment = (ctx, commentId) => !restricted(ctx) || siteOfComment(ctx.db, commentId) === ctx.siteScope;

// ---------- Inventaire (lecture seule, nombres uniquement) ----------
function inventory(db) {
  const n = (sql, ...a) => db.prepare(sql).get(...a).n;
  const out = { table: has(db, "mk_content_sites"), assigned: {}, orphans: {}, crossSiteRelations: 0, adresses: 0 };
  if (!out.table) return out;
  for (const t of Object.keys(TYPES)) {
    out.assigned[t] = n("SELECT COUNT(*) n FROM mk_content_sites WHERE content_type = ?", t);
    out.orphans[t] = n(`SELECT COUNT(*) n FROM mk_content_sites cs WHERE cs.content_type = ? AND NOT EXISTS (SELECT 1 FROM ${TYPES[t].table} x WHERE x.id = cs.content_id)`, t);
  }
  out.adresses = n("SELECT COUNT(*) n FROM mk_content_sites WHERE address IS NOT NULL");
  if (has(db, "taxonomy_relations")) {
    out.crossSiteRelations = n(`SELECT COUNT(*) n FROM taxonomy_relations r WHERE r.content_type = 'post'
      AND COALESCE((SELECT site_id FROM mk_content_sites WHERE content_type = 'term' AND content_id = r.term_id), 0) <> COALESCE((SELECT site_id FROM mk_content_sites WHERE content_type = 'post' AND content_id = r.content_id), 0)`);
  }
  return out;
}

module.exports = { TYPES, ensureCoreTriggers, siteOf, assign, clear, adopt, siteParam, scopePredicate, scopeForSite, termsOutsideSite, commentPredicate, restricted, allowedContent, allowedComment, listPosts, listTerms, listComments, siteOfComment, requirePostInScope, requireTermInScope, inventory, visibleSql };
