// Médiathèque : glisser-déposer professionnel. UNE seule opération serveur pour déplacer ET réordonner des fichiers ou des dossiers, avec :
//  - la règle de conflit de noms (conserver les deux / remplacer / ignorer / annuler), décidée AVANT d'écrire quoi que ce soit ;
//  - l'ordre personnalisé (sort_order, par conteneur) ;
//  - un instantané « avant » et « après » des seules lignes touchées, qui sert à Annuler et Rétablir (restore) sans rien recalculer côté navigateur.
// Les dossiers et les fichiers restent LOGIQUES : l'adresse publique d'un média ne change jamais. Rien n'est supprimé : « remplacer » met l'ancien fichier à la corbeille (restaurable).
const { checkCtx, audit, MarketingError } = require("../audience/shared");
const media = require("./index");
const folders = require("./folders");

const MAX_ITEMS = 200;
const POLICIES = new Set(["keep", "replace", "skip"]);
const fold = (v) => String(v || "").toLowerCase();
const asId = (v) => (v === null || v === undefined || v === "" ? null : Number(v));

// Nom « (2) », « (3) »… avant l'extension, jamais déjà pris dans la destination
function freeName(name, taken, { keepExt }) {
  const dot = keepExt ? name.lastIndexOf(".") : -1;
  const hasExt = dot > 0 && name.length - dot <= 8;
  const base = hasExt ? name.slice(0, dot) : name, ext = hasExt ? name.slice(dot) : "";
  for (let n = 2; n < 1000; n++) { const next = `${base} (${n})${ext}`.slice(0, 120); if (!taken.has(fold(next))) return next; }
  throw new MarketingError("invalid_state", "Impossible de trouver un nom libre.");
}

function fileScope(ctx) {
  const s = folders.needScope(ctx);
  return s.siteId === null ? { sql: "reach = 'shared'", args: [] } : { sql: "reach = 'site' AND site_id = ?", args: [s.siteId] };
}
const stateOf = (ctx, k, id) => (k === "f"
  ? ctx.db.prepare("SELECT folder_id AS p, sort_order AS o, name AS n, (deleted_at IS NOT NULL) AS t FROM mk_media WHERE id = ? AND organization_id = ?").get(id, ctx.organizationId)
  : ctx.db.prepare("SELECT parent_id AS p, sort_order AS o, name AS n, 0 AS t FROM mk_media_folders WHERE id = ? AND organization_id = ?").get(id, ctx.organizationId));

// Éléments d'un conteneur dans l'ordre d'affichage « personnalisé » (ordonnés d'abord, puis le tri par défaut)
function siblings(ctx, k, parent) {
  if (k === "f") {
    const fs = fileScope(ctx);
    return ctx.db.prepare(`SELECT id, name FROM mk_media WHERE organization_id = ? AND deleted_at IS NULL AND folder_id IS ? AND ${fs.sql} ORDER BY sort_order IS NULL, sort_order ASC, id DESC`).all(ctx.organizationId, parent, ...fs.args);
  }
  const c = folders.siteCond(folders.needScope(ctx));
  return ctx.db.prepare(`SELECT id, name FROM mk_media_folders WHERE organization_id = ? AND deleted_at IS NULL AND parent_id IS ? AND ${c.sql} ORDER BY sort_order IS NULL, sort_order ASC, name COLLATE NOCASE`).all(ctx.organizationId, parent, ...c.args);
}

function organize(ctx, { kind, ids, to = null, before, after, policy } = {}) {
  checkCtx(ctx);
  folders.needScope(ctx);
  const k = kind === "folder" ? "d" : kind === "file" ? "f" : null;
  if (!k) throw new MarketingError("invalid_field", "Type d'élément inconnu.");
  if (policy !== undefined && policy !== null && policy !== "cancel" && !POLICIES.has(policy)) throw new MarketingError("invalid_field", "Choix de conflit inconnu.");
  if (policy === "cancel") return { cancelled: true, done: [], skipped: [], failed: [] };
  const list = [...new Set((Array.isArray(ids) ? ids : []).map(asId).filter((n) => Number.isInteger(n) && n > 0))].slice(0, MAX_ITEMS);
  if (!list.length) throw new MarketingError("invalid_field", "Sélectionnez au moins un élément.");
  const target = asId(to);
  if (target !== null && !folders.getFolder(ctx, target)) throw new MarketingError("not_found", "Dossier de destination introuvable.");
  const beforeId = asId(before), afterId = asId(after);

  // 1. Éléments valides (dans CETTE médiathèque, modifiables), refus motivés pour les autres
  const failed = [], items = [];
  for (const id of list) {
    if (k === "f") {
      const m = media.getMedia(ctx, id);
      if (!m) { failed.push({ id, name: `#${id}`, message: "Fichier introuvable." }); continue; }
      const s = folders.needScope(ctx);
      if (!(s.siteId === null ? m.reach === "shared" : m.reach === "site" && m.siteId === s.siteId)) { failed.push({ id, name: m.name, message: "Ce fichier n'appartient pas à cette médiathèque." }); continue; }
      if (m.deletedAt) { failed.push({ id, name: m.name, message: "Ce fichier est à la corbeille." }); continue; }
      try { media.assertWritable(ctx, m); } catch (e) { failed.push({ id, name: m.name, message: e.message }); continue; }
      items.push({ id, name: m.name, parent: m.folderId ?? null });
    } else {
      const f = folders.getFolder(ctx, id);
      if (!f) { failed.push({ id, name: `#${id}`, message: "Dossier introuvable." }); continue; }
      items.push({ id, name: f.name, parent: f.parent_id ?? null });
    }
  }
  // Dossiers : jamais dans eux-mêmes ni dans un descendant (pas de cycle), jamais au-delà de la profondeur maximale
  const movable = [];
  for (const it of items) {
    if (k === "d" && target !== null) {
      let cyclic = false;
      for (let cur = target, n = 0; cur && n < 60; n++) { if (cur === it.id) { cyclic = true; break; } cur = ctx.db.prepare("SELECT parent_id FROM mk_media_folders WHERE id = ?").get(cur)?.parent_id; }
      if (cyclic) { failed.push({ id: it.id, name: it.name, message: "Un dossier ne peut pas être déplacé dans lui-même ni dans un de ses sous-dossiers." }); continue; }
      const below = (root) => { let max = 0; const walk = (p, d) => { max = Math.max(max, d); for (const r of ctx.db.prepare("SELECT id FROM mk_media_folders WHERE parent_id = ? AND deleted_at IS NULL").all(p)) walk(r.id, d + 1); }; walk(root, 1); return max; };
      if (folders.depthOf(ctx, target) + below(it.id) > folders.MAX_DEPTH) { failed.push({ id: it.id, name: it.name, message: `Les dossiers ne peuvent pas être imbriqués sur plus de ${folders.MAX_DEPTH} niveaux.` }); continue; }
    }
    movable.push(it);
  }

  // 2. Conflits de noms : seulement pour les éléments qui CHANGENT de conteneur
  const moving = movable.filter((it) => it.parent !== target);
  const moveIds = new Set(movable.map((i) => i.id));
  const present = siblings(ctx, k, target).filter((x) => !moveIds.has(x.id));
  const byName = new Map(present.map((x) => [fold(x.name), x]));
  const conflicts = [];
  const seen = new Set();
  for (const it of moving) {
    const hit = byName.get(fold(it.name));
    if (hit || seen.has(fold(it.name))) conflicts.push({ id: it.id, name: it.name, existingId: hit ? hit.id : null });
    seen.add(fold(it.name));
  }
  if (conflicts.length && !policy) return { conflicts, canReplace: k === "f", done: [], skipped: [], failed };

  // 3. Application atomique, en gardant l'instantané des lignes touchées
  const touched = new Map();
  const note = (kk, id) => { const key = `${kk}:${id}`; if (!touched.has(key)) touched.set(key, { k: kk, id, ...stateOf(ctx, kk, id) }); };
  const skipped = [], done = [];
  const taken = new Set(present.map((x) => fold(x.name)));
  ctx.db.exec("BEGIN");
  try {
    for (const it of movable) {
      const clash = conflicts.find((c) => c.id === it.id);
      let newName = null;
      if (clash && it.parent !== target) {
        if (policy === "skip") { skipped.push({ id: it.id, name: it.name }); continue; }
        if (policy === "replace") {
          if (k !== "f" || !clash.existingId) { failed.push({ id: it.id, name: it.name, message: "Un dossier ne peut pas en remplacer un autre : choisissez « Conserver les deux »." }); continue; }
          const old = media.getMedia(ctx, clash.existingId);
          const used = old ? media.mediaUsage(ctx, old) : [];
          if (used.length) { failed.push({ id: it.id, name: it.name, message: `« ${old.name} » est utilisé par ${used[0].kind} « ${used[0].name} » : il ne peut pas être remplacé.` }); continue; }
          note("f", clash.existingId);
          ctx.db.prepare("UPDATE mk_media SET deleted_at = datetime('now'), deleted_by = ? WHERE id = ? AND organization_id = ?").run(ctx.userId ?? null, clash.existingId, ctx.organizationId);
          taken.delete(fold(it.name));
        } else {
          newName = freeName(it.name, taken, { keepExt: k === "f" });
        }
      }
      note(k, it.id);
      const finalName = newName || it.name;
      taken.add(fold(finalName));
      if (k === "f") ctx.db.prepare("UPDATE mk_media SET folder_id = ?, name = ?, sort_order = CASE WHEN folder_id IS ? THEN sort_order END, updated_at = datetime('now') WHERE id = ? AND organization_id = ?").run(target, finalName, target, it.id, ctx.organizationId);
      else ctx.db.prepare("UPDATE mk_media_folders SET parent_id = ?, name = ?, sort_order = CASE WHEN parent_id IS ? THEN sort_order END WHERE id = ? AND organization_id = ?").run(target, finalName, target, it.id, ctx.organizationId);
      done.push(it.id);
    }
    // Position : « avant tel élément » (ou à la fin) ; sans position, on respecte l'ordre existant du conteneur d'arrivée
    const pendingOrder = [];
    for (const it of movable) if (done.includes(it.id)) pendingOrder.push(it.id);
    const sameBox = movable.every((it) => it.parent === target);
    if (done.length && (beforeId !== null || afterId !== null || sameBox && before !== undefined || siblingsHaveOrder(ctx, k, target))) {
      const cur = siblings(ctx, k, target).map((x) => x.id).filter((id) => !pendingOrder.includes(id));
      let at = beforeId !== null && cur.includes(beforeId) ? cur.indexOf(beforeId) : cur.length;
      if (beforeId === null && afterId !== null && cur.includes(afterId)) at = cur.indexOf(afterId) + 1;
      const next = [...cur.slice(0, at), ...pendingOrder, ...cur.slice(at)];
      const col = k === "f" ? "mk_media" : "mk_media_folders";
      next.forEach((id, i) => {
        const want = (i + 1) * 10, now = stateOf(ctx, k, id);
        if (now && now.o !== want) { note(k, id); ctx.db.prepare(`UPDATE ${col} SET sort_order = ? WHERE id = ? AND organization_id = ?`).run(want, id, ctx.organizationId); }
      });
    }
    ctx.db.exec("COMMIT");
  } catch (error) {
    ctx.db.exec("ROLLBACK");
    if (/UNIQUE/i.test(error.message)) throw new MarketingError("invalid_state", "Un élément du même nom existe déjà à la destination.");
    throw error;
  }
  if (done.length) audit(ctx, k === "f" ? "media.moved" : "media.folder_moved", k === "f" ? "media" : "media_folder", done[0], { count: done.length, to: target });
  const undo = [...touched.values()];
  const redo = undo.map((r) => ({ k: r.k, id: r.id, ...stateOf(ctx, r.k, r.id) })).map((r) => ({ ...r, t: r.t ? 1 : 0 }));
  return { done, skipped, failed, undo: undo.map((r) => ({ ...r, t: r.t ? 1 : 0 })), redo };
}
const siblingsHaveOrder = (ctx, k, parent) => {
  if (k === "f") { const fs = fileScope(ctx); return !!ctx.db.prepare(`SELECT 1 FROM mk_media WHERE organization_id = ? AND deleted_at IS NULL AND folder_id IS ? AND sort_order IS NOT NULL AND ${fs.sql} LIMIT 1`).get(ctx.organizationId, parent, ...fs.args); }
  const c = folders.siteCond(folders.needScope(ctx));
  return !!ctx.db.prepare(`SELECT 1 FROM mk_media_folders WHERE organization_id = ? AND deleted_at IS NULL AND parent_id IS ? AND sort_order IS NOT NULL AND ${c.sql} LIMIT 1`).get(ctx.organizationId, parent, ...c.args);
};

// Annuler / Rétablir : remet des lignes dans l'état d'un instantané. Chaque ligne est revérifiée (même médiathèque, droits, pas de cycle) ; au moindre problème, RIEN n'est appliqué.
function restore(ctx, rows) {
  checkCtx(ctx);
  const s = folders.needScope(ctx);
  const list = (Array.isArray(rows) ? rows : []).slice(0, 1000);
  if (!list.length) throw new MarketingError("invalid_field", "Rien à restaurer.");
  const fs = fileScope(ctx);
  const apply = [];
  for (const r of list) {
    const id = Number(r.id), p = asId(r.p), o = r.o === null || r.o === undefined ? null : Number(r.o), n = String(r.n ?? "").slice(0, 120);
    if (!Number.isInteger(id) || (p !== null && !Number.isInteger(p)) || (o !== null && !Number.isInteger(o)) || !n.trim()) throw new MarketingError("invalid_field", "Instantané invalide.");
    if (p !== null && !folders.getFolder(ctx, p)) throw new MarketingError("invalid_state", "Impossible d'annuler : un dossier a changé ou disparu depuis.");
    if (r.k === "f") {
      const row = ctx.db.prepare(`SELECT id FROM mk_media WHERE id = ? AND organization_id = ? AND ${fs.sql}`).get(id, ctx.organizationId, ...fs.args);
      const m = row && media.getMedia(ctx, id);
      if (!m) throw new MarketingError("not_found", "Un fichier a disparu : impossible d'annuler.");
      media.assertWritable(ctx, m);
      apply.push({ k: "f", id, p, o, n, t: r.t ? 1 : 0 });
    } else if (r.k === "d") {
      const f = ctx.db.prepare("SELECT id FROM mk_media_folders WHERE id = ? AND organization_id = ? AND deleted_at IS NULL").get(id, ctx.organizationId);
      if (!f || !folders.getFolder(ctx, id)) throw new MarketingError("not_found", "Un dossier a disparu : impossible d'annuler.");
      apply.push({ k: "d", id, p, o, n, t: 0 });
    } else throw new MarketingError("invalid_field", "Instantané invalide.");
  }
  ctx.db.exec("BEGIN");
  try {
    for (const r of apply) {
      if (r.k === "f") ctx.db.prepare(`UPDATE mk_media SET folder_id = ?, sort_order = ?, name = ?, deleted_at = ${r.t ? "COALESCE(deleted_at, datetime('now'))" : "NULL"}, deleted_by = ${r.t ? "COALESCE(deleted_by, ?)" : "NULL"} WHERE id = ? AND organization_id = ?`).run(...[r.p, r.o, r.n, ...(r.t ? [ctx.userId ?? null] : []), r.id, ctx.organizationId]);
      else ctx.db.prepare("UPDATE mk_media_folders SET parent_id = ?, sort_order = ?, name = ? WHERE id = ? AND organization_id = ?").run(r.p, r.o, r.n, r.id, ctx.organizationId);
    }
    for (const r of apply.filter((x) => x.k === "d")) {
      const seen = new Set();
      for (let cur = r.id, d = 0; cur; d++, cur = ctx.db.prepare("SELECT parent_id FROM mk_media_folders WHERE id = ?").get(cur)?.parent_id) {
        if (seen.has(cur) || d > folders.MAX_DEPTH + 1) throw new MarketingError("invalid_state", "Impossible d'annuler : l'organisation des dossiers a changé depuis.");
        seen.add(cur);
      }
    }
    ctx.db.exec("COMMIT");
  } catch (error) {
    ctx.db.exec("ROLLBACK");
    if (/UNIQUE/i.test(error.message)) throw new MarketingError("invalid_state", "Impossible d'annuler : un élément du même nom existe déjà à cet endroit.");
    throw error;
  }
  audit(ctx, "media.reorganized_restore", "media", apply[0].id, { count: apply.length });
  return { restored: apply.length };
}

module.exports = { organize, restore, siblings };
