// Restore Engine : restaure un widget, une section, une page, plusieurs pages, le design ou le site depuis un snapshot. Principes :
//  - une restauration est une NOUVELLE opération (parent → l'opération d'origine) : aucune version postérieure n'est supprimée ; l'état d'avant est conservé (snapshot « avant ») donc la restauration elle-même s'annule ;
//  - écriture dans le BROUILLON via pages.saveDraft (normaliseurs natifs, contrôle de révision) : jamais de publication ; une page invalide est refusée sans rien écrire ;
//  - les sections verrouillées par la personne sont CONSERVÉES telles quelles lors d'une restauration de page ;
//  - si l'état actuel diffère du dernier état connu (modification non suivie, ex. édition manuelle), la restauration est refusée tant que la personne ne confirme pas explicitement (`restoreAnyway`).
const { transaction } = require("../marketing/db/tx");
const snaps = require("./snapshots");
const history = require("./history");
const protect = require("./protect");
const designPort = require("./designPort");
const { bad, clone, fp, findNode } = require("./util");
const pagesLib = () => require("../marketing/pages");

const clamp = (i, n) => Math.max(0, Math.min(n, Number.isInteger(i) ? i : n));
function lastKnownFp(ctx, siteId, level, ref) { const r = ctx.db.prepare("SELECT fp FROM mk_regen_snapshots WHERE site_id = ? AND level = ? AND ref = ? ORDER BY id DESC LIMIT 1").get(siteId, level, String(ref)); return r ? r.fp : null; }
// États « connus » d'une section / d'un élément : son dernier snapshot propre ET son contenu dans le dernier snapshot de PAGE (les sauvegardes de page suivent aussi ses éléments)
function knownFps(ctx, siteId, level, ref) {
  const out = []; const own = lastKnownFp(ctx, siteId, level, ref); if (own) out.push(own);
  const [pageId, id] = String(ref).split(":");
  if (level === "section" || level === "node") { const r = ctx.db.prepare("SELECT data FROM mk_regen_snapshots WHERE site_id = ? AND level = 'page' AND ref = ? ORDER BY id DESC LIMIT 1").get(siteId, String(pageId)); if (r) { const d = snaps.unpackData(r.data); const secs = (d.content || {}).sections || []; if (level === "section") { const x = secs.find((q) => q.id === id); if (x) out.push(fp(x)); } else { const f = findNode(secs, id); if (f) out.push(fp(f.node)); } } }
  return out;
}
const currentPageData = (p) => ({ pageId: p.id, name: p.name, revision: p.revision, content: clone(p.working) });

// Applique un snapshot de page/section/nœud dans le contenu COURANT de la page (copie) ; retourne { content, kept[], notes[] }
function mergeInto(ctx, siteId, page, snap, scope) {
  const cur = clone(page.working), kept = [], notes = [];
  const lockedSection = (id) => protect.isLocked(ctx, siteId, [["page", page.id], ["section", id]]);
  if (snap.level === "page" && !scope) {
    const want = clone(snap.data.content), have = cur.sections || [];
    for (const s of have) if (lockedSection(s.id)) { kept.push({ kind: "section", ref: s.id, why: "section verrouillée : conservée" }); const i = (want.sections || []).findIndex((x) => x.id === s.id); if (i >= 0) want.sections[i] = s; else (want.sections = want.sections || []).splice(clamp(have.findIndex((x) => x.id === s.id), (want.sections || []).length), 0, s); }
    return { content: { ...cur, ...want, sections: want.sections || [] }, kept, notes };
  }
  const sectionId = scope && scope.sectionId, nodeId = scope && scope.nodeId;
  if (snap.level === "page" && sectionId) {
    const src = (snap.data.content.sections || []).find((s) => s.id === sectionId); if (!src) throw bad("Cette section n'existe pas dans cette version.", "not_found");
    if (lockedSection(sectionId)) throw bad("Cette section est verrouillée : déverrouillez-la avant de la restaurer.", "protected");
    const i = (cur.sections || []).findIndex((s) => s.id === sectionId);
    if (i >= 0) cur.sections[i] = clone(src); else { const at = clamp((snap.data.content.sections || []).findIndex((s) => s.id === sectionId), (cur.sections || []).length); (cur.sections = cur.sections || []).splice(at, 0, clone(src)); notes.push("section réinsérée à sa position d'origine"); }
    return { content: cur, kept, notes };
  }
  if (snap.level === "section") {
    const src = snap.data.section; if (lockedSection(src.id)) throw bad("Cette section est verrouillée : déverrouillez-la avant de la restaurer.", "protected");
    const i = (cur.sections || []).findIndex((s) => s.id === src.id);
    if (i >= 0) cur.sections[i] = clone(src); else { (cur.sections = cur.sections || []).splice(clamp(snap.data.index, cur.sections.length), 0, clone(src)); notes.push("section réinsérée à sa position d'origine"); }
    return { content: cur, kept, notes };
  }
  if (snap.level === "node" || (snap.level === "page" && nodeId)) {
    const node = snap.level === "node" ? snap.data.node : (() => { const f = findNode(snap.data.content.sections || [], nodeId); return f && f.node; })();
    const secId = snap.level === "node" ? snap.data.sectionId : (() => { const f = findNode(snap.data.content.sections || [], nodeId); return f && f.section.id; })();
    if (!node) throw bad("Cet élément n'existe pas dans cette version.", "not_found");
    if (lockedSection(secId)) throw bad("La section de cet élément est verrouillée.", "protected");
    if (protect.protectionOf(ctx, siteId, "node", node.id) === "locked") throw bad("Cet élément est verrouillé.", "protected");
    const found = findNode(cur.sections || [], node.id);
    if (found) { const sibs = found.parent ? found.parent.children : found.section.children; sibs[sibs.indexOf(found.node)] = clone(node); }
    else { const parentId = snap.level === "node" ? snap.data.parentId : null; const sec = (cur.sections || []).find((s) => s.id === secId); if (!sec) throw bad("La section de cet élément n'existe plus : restaurez d'abord la section.", "conflict"); const par = parentId ? (findNode(cur.sections, parentId) || {}).node : null; const arr = par ? (par.children = par.children || []) : (sec.children = sec.children || []); arr.splice(clamp(snap.data.index, arr.length), 0, clone(node)); notes.push("élément réinséré à sa position d'origine"); }
    return { content: cur, kept, notes };
  }
  throw bad("Restauration non prise en charge pour ce niveau.");
}
const scopeLevelOf = (snap, scope) => (scope && scope.nodeId ? "node" : scope && scope.sectionId ? "section" : snap.level);

// Restaure. `restoreAnyway` : confirmation explicite quand l'état actuel diffère du dernier état connu. Retourne { opId, restored[], kept[], notes[] }.
function restore(ctx, siteId, snapId, { scope = null, restoreAnyway = false, can = () => true, request = "", parentId = null, kind = "restore", actor = "human" } = {}) {
  const snap = snaps.get(ctx, siteId, snapId);
  const before = [], after = [], restored = [], kept = [], notes = [];
  const done = (r) => { restored.push(r); };
  const conflictCheck = (level, ref, currentValue, label) => { const known = knownFps(ctx, siteId, level, ref); if (known.length && !known.includes(fp(currentValue)) && !restoreAnyway) { const e = bad(`${label} : l'état actuel contient des modifications qui ne figurent dans aucune version enregistrée (modification manuelle récente). Confirmez la restauration pour continuer : l'état actuel sera conservé dans l'historique.`, "conflict"); e.detail = [{ level, ref }]; throw e; } };
  const restorePage = (pageId, pageSnap, sc) => {
    const page = snaps.pageOf(ctx, siteId, pageId);
    if (protect.isLocked(ctx, siteId, [["page", page.id]])) throw bad(`La page « ${page.name} » est verrouillée : déverrouillez-la avant de la restaurer.`, "protected");
    // restauration PARTIELLE (section, élément) : seul l'élément visé est comparé à son dernier état connu ; le reste de la page n'est pas concerné
    const secs = (page.working || {}).sections || [];
    const sid = (sc && sc.sectionId) || (pageSnap.level === "section" ? pageSnap.data.sectionId : null), nid = (sc && sc.nodeId) || (pageSnap.level === "node" ? pageSnap.data.nodeId : null);
    if (nid) { const f = findNode(secs, nid); if (f) conflictCheck("node", `${page.id}:${nid}`, f.node, "Élément"); }
    else if (sid) { const cur = secs.find((x) => x.id === sid); if (cur) conflictCheck("section", `${page.id}:${sid}`, cur, "Section"); }
    else conflictCheck("page", String(page.id), currentPageData(page), `Page « ${page.name} »`);
    const b = snaps.takePage(ctx, siteId, page.id, { label: `Avant restauration — « ${page.name} »` }); before.push(b.id);
    const m = mergeInto(ctx, siteId, page, pageSnap, sc);
    pagesLib().saveDraft(ctx, page.id, m.content, { revision: page.revision });
    const a = snaps.takePage(ctx, siteId, page.id, { label: `Après restauration — « ${page.name} »` }); after.push(a.id);
    try { const np = snaps.pageOf(ctx, siteId, page.id); if (nid && findNode((np.working || {}).sections || [], nid)) snaps.takeNode(ctx, siteId, page.id, nid, { label: "Après restauration — élément" }); else if (sid && ((np.working || {}).sections || []).some((x) => x.id === sid)) snaps.takeSection(ctx, siteId, page.id, sid, { label: "Après restauration — section" }); } catch { /* le suivi fin n'est jamais bloquant */ }
    kept.push(...m.kept); notes.push(...m.notes); done({ level: sc ? scopeLevelOf(pageSnap, sc) : "page", pageId: page.id, name: page.name });
    // la personne a choisi cet état : plus de marque « écrit par l'IA » sur la page
    ctx.db.prepare("DELETE FROM mk_regen_marks WHERE site_id = ? AND ref LIKE ?").run(siteId, `${page.id}%`);
  };
  const run = () => {
    if (snap.level === "page") restorePage(snap.data.pageId, snap, scope);
    else if (snap.level === "section" || snap.level === "node") restorePage(snap.data.pageId, snap, null);
    else if (snap.level === "design") {
      const port = designPort.port(), cur = port.state(ctx, siteId, can);
      if (protect.protectionOf(ctx, siteId, "design", "design") === "locked") throw bad("Le design est verrouillé : déverrouillez-le avant de le restaurer.", "protected");
      conflictCheck("design", "design", { changes: cur.changes, rev: cur.rev }, "Design");
      before.push(snaps.takeDesign(ctx, siteId, { can, label: "Avant restauration — design" }).id);
      port.saveDraft(ctx, siteId, snap.data.changes, can);
      after.push(snaps.takeDesign(ctx, siteId, { can, label: "Après restauration — design" }).id); done({ level: "design" });
    } else if (snap.level === "site") {
      const port = designPort.port(); let designBefore = null;
      if (snap.data.design) {
        const dsnap = snaps.get(ctx, siteId, snap.data.design), cur = port.state(ctx, siteId, can);
        if (protect.protectionOf(ctx, siteId, "design", "design") !== "locked") {
          conflictCheck("design", "design", { changes: cur.changes, rev: cur.rev }, "Design");
          designBefore = snaps.takeDesign(ctx, siteId, { can, label: "Avant restauration — design" }); before.push(designBefore.id);
          port.saveDraft(ctx, siteId, dsnap.data.changes, can); after.push(snaps.takeDesign(ctx, siteId, { can, label: "Après restauration — design" }).id); done({ level: "design" });
        } else kept.push({ kind: "design", ref: "design", why: "design verrouillé : conservé" });
      }
      try {
        transaction(ctx.db, () => { for (const p of snap.data.pages) { try { snaps.pageOf(ctx, siteId, p.pageId); } catch { kept.push({ kind: "page", ref: String(p.pageId), why: "page supprimée ou archivée depuis : ignorée" }); continue; } if (protect.isLocked(ctx, siteId, [["page", p.pageId]])) { kept.push({ kind: "page", ref: String(p.pageId), why: "page verrouillée : conservée" }); continue; } restorePage(p.pageId, snaps.get(ctx, siteId, p.snapId), null); } });
      } catch (e) { if (designBefore) { try { port.saveDraft(ctx, siteId, snaps.get(ctx, siteId, designBefore.id).data.changes, can); } catch { /* le design reste dans l'état restauré : signalé par l'erreur */ } } throw e; }
    } else throw bad("Niveau de version inconnu.");
  };
  if (snap.level === "site") run(); else transaction(ctx.db, run);
  const opId = history.create(ctx, siteId, { actor, kind, request: request || `Restauration de la version n° ${snap.id}`, intent: kind, scope: snap.level, target: { snapshot: snap.id, level: snap.level, pageId: snap.data.pageId || null, sectionId: (scope && scope.sectionId) || snap.data.sectionId || null }, changes: restored.map((r) => ({ path: `${r.level}${r.pageId ? `:${r.pageId}` : ""}`, before: "état actuel conservé", after: `version n° ${snap.id}` })), status: "applied", parentId, before, after, reversible: true });
  history.update(ctx, siteId, opId, { appliedAt: new Date().toISOString().slice(0, 19).replace("T", " ") });
  return { opId, restored, kept, notes };
}
module.exports = { restore, mergeInto, lastKnownFp, currentPageData };
