// Proposition → application des compositions (programme 22.3). Une proposition n'écrit RIEN. L'application :
//  · revérifie le site (jamais lu du corps de la requête), la page, la révision et les empreintes (conflit → 409) ;
//  · respecte le Preservation Engine de 21.9 (section verrouillée → refus ; validée / modifiée à la main → confirmation explicite `allow`) ;
//  · écrit un BROUILLON par `pages.saveDraft` (normaliseurs natifs, historique natif des révisions) — jamais de publication ;
//  · prend des instantanés avant/après et journalise l'opération dans l'historique de 21.9 : « annuler » = `regen.undo` (aucun second mécanisme).
// Tables créées à la demande (même convention que 21.4–21.9) : mk_layout_sections (contenu d'origine d'une section générée, pour la régénérer sans perdre le texte).
const { MarketingError } = require("../marketing/errors");
const { transaction } = require("../marketing/db/tx");
const engine = require("./index");

const bad = (m, code = "invalid_field") => new MarketingError(code, m);
const regen = () => require("../regen");
const pagesLib = () => require("../marketing/pages");
const fpOf = (v) => require("../regen/util").fp(v);
const json = (s, d) => { try { const v = JSON.parse(s); return v && typeof v === "object" ? v : d; } catch { return d; } };

function ensureSchema(db) {
  db.exec(`CREATE TABLE IF NOT EXISTS mk_layout_sections (
    site_id INTEGER NOT NULL REFERENCES mk_sites(id) ON DELETE CASCADE, page_id INTEGER NOT NULL, section_id TEXT NOT NULL, organization_id INTEGER NOT NULL,
    pattern_id TEXT NOT NULL, role TEXT NOT NULL, content TEXT NOT NULL, fp TEXT NOT NULL, op_id INTEGER, updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    PRIMARY KEY (site_id, page_id, section_id))`);
  // Charge utile d'une proposition (sections complètes) : hors de l'historique de 21.9, dont le plan est borné à 8 Ko
  db.exec(`CREATE TABLE IF NOT EXISTS mk_layout_proposals (op_id INTEGER PRIMARY KEY, site_id INTEGER NOT NULL REFERENCES mk_sites(id) ON DELETE CASCADE, organization_id INTEGER NOT NULL, payload TEXT NOT NULL)`);
}
const guard = (ctx, siteId) => { const r = regen(); r.ctxLib.siteGuard(ctx, siteId); r.store.ensureSchema(ctx.db); ensureSchema(ctx.db); };
const pageOf = (ctx, siteId, pageId) => regen().ctxLib.pageOf(ctx, siteId, pageId);
const ws = (p) => (p.working || {});
const record = (ctx, siteId, pageId, sectionId) => { const r = ctx.db.prepare("SELECT * FROM mk_layout_sections WHERE site_id = ? AND page_id = ? AND section_id = ? AND organization_id = ?").get(siteId, pageId, sectionId, ctx.organizationId); return r ? { patternId: r.pattern_id, role: r.role, content: json(r.content, {}), fp: r.fp } : null; };

// Aperçu filaire : structure RÉELLE (pistes de grille, portées, sens du flex) résolue pour un écran, avec l'héritage ordinateur → tablette → mobile du moteur natif
const FIELDS = ["display", "gridTemplate", "columns", "flexDirection", "gridColumnSpan", "gridRowSpan", "gridColumnStart", "gridColumnEnd", "gridRowStart", "gridRowEnd", "minHeight", "backgroundColor", "aspectRatio", "columnCount"];
function wire(section, bp = "desktop") {
  const order = bp === "desktop" ? ["desktop"] : bp === "tablet" ? ["desktop", "tablet"] : ["desktop", "tablet", "mobile"];
  const conv = (n) => {
    const st = {};
    for (const b of order) Object.assign(st, (n.styles || {})[b] || {});
    const o = { t: n.type };
    if (st.display === "none") return null;
    for (const k of FIELDS) if (st[k] !== undefined) o[k] = st[k];
    const p = n.props || {};
    if (n.type === "heading") { o.l = (p.text || "").slice(0, 40); o.lv = p.level; } else if (n.type === "button") o.l = p.label; else if (n.type === "image") o.l = p.alt || ""; else if (n.type === "gallery") o.n = (p.images || []).length; else if (n.type === "text") o.l = String(p.html || "").replace(/<[^>]+>/g, "").slice(0, 40);
    if (n.children) o.c = n.children.map(conv).filter(Boolean);
    return o;
  };
  return { type: "layout", c: (section.children || []).map(conv).filter(Boolean), bp };
}

// Proposition : items = [{ role, content?, patternId?, sectionId?, index? }] ; sans contenu, celui de la section générée précédemment est réutilisé
function propose(ctx, siteId, { pageId, items, site = {}, page: pageInfo = {}, projectId = null } = {}) {
  guard(ctx, siteId);
  const page = pageOf(ctx, siteId, pageId);
  if (!Array.isArray(items) || !items.length) throw bad("Aucune composition demandée.");
  if (items.length > 12) throw bad("12 compositions au plus par opération.");
  const intent = engine.intent.analyze({ type: pageInfo.type || page.type || "", name: page.name, goal: pageInfo.goal || "" }, site);
  const secs = ws(page).sections || [];
  const used = secs.map((s) => (record(ctx, siteId, page.id, s.id) || {}).patternId).filter(Boolean);
  const results = [], changes = [], reasons = [];
  let confirm = items.length > 1;
  if (items.length > 1) reasons.push("plusieurs sections modifiées en une opération");
  const sd = `${site.name || ""}:${page.id}`;
  items.forEach((it, i) => {
    const existing = it.sectionId ? secs.find((s) => s.id === it.sectionId) : null;
    if (it.sectionId && !existing) throw bad("Section introuvable dans cette page.", "not_found");
    const rec = existing ? record(ctx, siteId, page.id, existing.id) : null;
    const content = it.content || (rec && rec.content);
    if (!content) throw bad(`Section ${i + 1} : aucun contenu à composer (le contenu d'origine de cette section est inconnu : fournissez-le).`);
    const role = it.role || (rec && rec.role) || engine.KIND_ROLE[content.kind] || "text";
    const r = engine.composeSection(ctx, { seed: `${sd}:${existing ? existing.id : i}`, role, content, intent, patternId: it.patternId || null, used });
    if (!r.ok) throw bad(`Section ${i + 1} : ${r.reason || (r.errors && r.errors[0]) || "composition impossible"}`);
    let manual = false;
    if (existing) {
      const state = regen().protect.stateOf(ctx, siteId, "section", existing.id, existing);
      manual = state === "user_modified" || state === "validated" || state === "locked" || Boolean(rec && rec.fp !== fpOf(existing));
      if (state === "locked") reasons.push(`la section ${i + 1} est verrouillée`);
      else if (manual) { confirm = true; reasons.push(`la section ${i + 1} contient des modifications manuelles ou validées`); }
    }
    // Conserver l'identifiant : la section remplacée garde sa place et son identifiant (liens, ancres, historique)
    const section = existing ? { ...r.section, id: existing.id } : r.section;
    used.push(r.patternId);
    changes.push({ index: i, action: existing ? "replace" : "insert", sectionId: section.id, role, patternId: r.patternId, label: r.label, family: r.family, score: r.balance.score, manual });
    results.push({ ...r, section, wire: { desktop: wire(section, "desktop"), tablet: wire(section, "tablet"), mobile: wire(section, "mobile") } });
  });
  const base = { pageRevision: page.revision, fps: Object.fromEntries(items.filter((x) => x.sectionId).map((x) => [`section:${x.sectionId}`, fpOf(secs.find((s) => s.id === x.sectionId))])) };
  const opId = regen().histories.create(ctx, siteId, { projectId, actor: "human", kind: "layout", request: `Composition : ${changes.map((c) => c.label).join(", ")}`.slice(0, 600), intent: "layout", scope: items.length > 1 ? "page" : "section",
    target: { pageId: page.id, sectionId: items[0].sectionId || null, targets: changes.filter((c) => c.action === "replace").map((c) => ({ kind: "section", ref: c.sectionId, label: c.label })) }, plan: { executor: "layout", confirm, reasons },
    changes, status: "proposed", base, reversible: true });
  const payload = { items: results.map((r, i) => ({ action: changes[i].action, index: items[i].index ?? null, section: r.section, patternId: r.patternId, role: r.role, content: engine.cleanContent(items[i].content || (record(ctx, siteId, page.id, items[i].sectionId) || {}).content || {}) })) };
  const text = JSON.stringify(payload);
  if (text.length > 2000000) throw bad("Composition trop volumineuse.");
  ctx.db.prepare("INSERT INTO mk_layout_proposals (op_id, site_id, organization_id, payload) VALUES (?, ?, ?, ?)").run(opId, siteId, ctx.organizationId, text);
  return { opId, status: "proposed", requiresConfirmation: confirm, reasons, changes, results: results.map((r) => ({ role: r.role, patternId: r.patternId, label: r.label, family: r.family, balance: r.balance, corrected: r.corrected, metrics: r.metrics, adaptation: r.adaptation, alternatives: r.alternatives, timing: r.timing, wire: r.wire })), intent };
}

function apply(ctx, siteId, opId, { confirm = false, allow = [] } = {}) {
  guard(ctx, siteId);
  const R = regen();
  const op = R.histories.get(ctx, siteId, opId);
  if (op.kind !== "layout") throw bad("Cette opération n'est pas une composition.", "conflict");
  if (op.status !== "proposed") throw bad("Cette proposition a déjà été traitée.", "conflict");
  const plan = op.plan;
  const row = ctx.db.prepare("SELECT payload FROM mk_layout_proposals WHERE op_id = ? AND site_id = ? AND organization_id = ?").get(op.id, siteId, ctx.organizationId);
  if (!row) throw bad("Proposition introuvable.", "not_found");
  const items = json(row.payload, {}).items || [];
  if (plan.confirm && confirm !== true) throw bad("Cette modification touche plusieurs sections ou des éléments modifiés à la main : confirmez-la explicitement après avoir lu l'aperçu.", "confirm_required");
  const page = pageOf(ctx, siteId, op.target.pageId);
  const secs = JSON.parse(JSON.stringify(ws(page).sections || []));
  // conflits : la section visée a changé depuis la proposition
  for (const [k, f] of Object.entries(op.base.fps || {})) { const sid = k.slice(8); const cur = secs.find((s) => s.id === sid); if (cur && f !== fpOf(cur)) throw bad("Conflit : une section a été modifiée depuis la proposition. Rien n'a été écrit : régénérez la proposition.", "conflict"); }
  // protections (serveur)
  for (const it of items) if (it.action === "replace") {
    const cur = secs.find((s) => s.id === it.section.id);
    if (R.protect.isLocked(ctx, siteId, [["page", page.id], ["section", it.section.id]])) { const e = bad("La page ou la section est verrouillée : aucune régénération.", "protected"); throw e; }
    R.protect.assertWritable(ctx, siteId, [{ kind: "section", ref: it.section.id, label: it.patternId, value: cur }], { allow });
  }
  const before = [], after = [];
  transaction(ctx.db, () => {
    before.push(R.snapshots.takePage(ctx, siteId, page.id, { label: `Avant : ${op.request.slice(0, 60)}` }).id);
    for (const it of items) {
      const i = secs.findIndex((s) => s.id === it.section.id);
      if (it.action === "replace" && i >= 0) secs[i] = it.section;
      else secs.splice(Math.min(it.index ?? secs.length, secs.length), 0, it.section);
    }
    pagesLib().saveDraft(ctx, page.id, { ...ws(page), sections: secs }, { revision: page.revision });
    after.push(R.snapshots.takePage(ctx, siteId, page.id, { label: `Après : ${op.request.slice(0, 60)}` }).id);
    const np = pageOf(ctx, siteId, page.id);
    for (const it of items) {
      const cur = (ws(np).sections || []).find((s) => s.id === it.section.id);
      R.protect.mark(ctx, siteId, "section", it.section.id, cur, op.id);
      ctx.db.prepare("INSERT INTO mk_layout_sections (site_id, page_id, section_id, organization_id, pattern_id, role, content, fp, op_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT (site_id, page_id, section_id) DO UPDATE SET pattern_id = excluded.pattern_id, role = excluded.role, content = excluded.content, fp = excluded.fp, op_id = excluded.op_id, updated_at = datetime('now')")
        .run(siteId, page.id, it.section.id, ctx.organizationId, it.patternId, it.role, JSON.stringify(it.content).slice(0, 60000), fpOf(cur), op.id);
    }
  });
  R.histories.attach(ctx, op.id, "before", before); R.histories.attach(ctx, op.id, "after", after);
  R.histories.update(ctx, siteId, op.id, { status: "applied", appliedAt: new Date().toISOString().replace("T", " ").slice(0, 19) });
  return { opId: op.id, status: "applied", note: "Brouillon mis à jour : rien n'est publié. Annulation possible depuis l'historique." };
}
const reject = (ctx, siteId, opId) => { guard(ctx, siteId); const op = regen().histories.get(ctx, siteId, opId); if (op.kind !== "layout" || op.status !== "proposed") throw bad("Cette proposition a déjà été traitée.", "conflict"); regen().histories.update(ctx, siteId, opId, { status: "rejected" }); return { opId, status: "rejected" }; };
const undo = (ctx, siteId, opId, o = {}) => { guard(ctx, siteId); return regen().undo(ctx, siteId, opId, o); };
// Variantes proposées pour une section (existante ou à créer) : structures réellement différentes, avec aperçu filaire par écran. N'écrit rien.
function variantsFor(ctx, siteId, { pageId, sectionId = null, role = null, content = null, site = {}, pageInfo = {}, max = 8 } = {}) {
  guard(ctx, siteId);
  const page = pageOf(ctx, siteId, pageId), secs = ws(page).sections || [];
  const existing = sectionId ? secs.find((s) => s.id === sectionId) : null;
  if (sectionId && !existing) throw bad("Section introuvable dans cette page.", "not_found");
  const rec = existing ? record(ctx, siteId, page.id, existing.id) : null;
  const c = content || (rec && rec.content);
  if (!c) throw bad("Aucun contenu à composer : fournissez le contenu de la section.");
  const r = role || (rec && rec.role) || engine.KIND_ROLE[c.kind] || "text";
  const intent = engine.intent.analyze({ type: pageInfo.type || page.type || "", name: page.name, goal: pageInfo.goal || "" }, site);
  const out = engine.variants(ctx, { seed: `${site.name || ""}:${page.id}:${existing ? existing.id : 0}`, role: r, content: c, intent, max });
  return { role: r, current: rec ? rec.patternId : null, variants: out.variants.map((v) => ({ patternId: v.patternId, family: v.family, label: v.label, mode: v.mode, score: v.score, findings: v.findings, metrics: v.metrics, adaptation: v.adaptation, wire: { desktop: wire(v.section, "desktop"), tablet: wire(v.section, "tablet"), mobile: wire(v.section, "mobile") } })), rejected: out.rejected, content: engine.cleanContent(c) };
}
// Sections d'une page avec leur layout d'origine (si générées par ce moteur) et leur état de protection
function sectionsOf(ctx, siteId, pageId) {
  guard(ctx, siteId);
  const page = pageOf(ctx, siteId, pageId);
  return { page: { id: page.id, name: page.name, revision: page.revision }, sections: (ws(page).sections || []).map((s, i) => { const rec = record(ctx, siteId, page.id, s.id); return { id: s.id, index: i, type: s.type, name: s.name || "", generated: Boolean(rec), patternId: rec ? rec.patternId : null, role: rec ? rec.role : null, content: rec ? rec.content : null, state: regen().protect.stateOf(ctx, siteId, "section", s.id, s) }; }) };
}
// Catalogue exposé à l'interface : layouts réellement générables (tous passent par le normaliseur natif — voir les tests)
function catalog() { return { families: engine.patterns.FAMILIES, patterns: engine.patterns.REG.map((d) => ({ id: d.id, family: d.family, label: d.label, roles: d.roles, mode: d.mode, summary: d.summary })), roles: engine.patterns.roles() }; }
module.exports = { variantsFor, sectionsOf, propose, apply, reject, undo, wire, catalog, ensureSchema, record };
