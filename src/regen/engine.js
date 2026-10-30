// AI Regeneration Orchestrator : demande → analyse → contexte → dépendances → périmètre MINIMAL → impact → aperçu (proposition enregistrée) → application contrôlée → journal, snapshots, annulation.
// Aucun moteur de génération parallèle : les textes passent par le Content Generator (reviseValue / generatePage), les images par l'AI Media, le design par le personnalisateur natif, les sections par les
// normaliseurs natifs (pages.saveDraft). Rien n'est publié. Une proposition ne modifie RIEN ; l'application revérifie les droits, les protections, les empreintes (conflits) et la révision de la page.
const { transaction } = require("../marketing/db/tx");
const analyzer = require("./analyzer");
const ctxLib = require("./context");
const protect = require("./protect");
const snaps = require("./snapshots");
const history = require("./history");
const restoreLib = require("./restore");
const designPort = require("./designPort");
const store = require("./store");
const { bad, clone, fp, findNode, walkNodes } = require("./util");
const pagesLib = () => require("../marketing/pages");
const contentGen = () => require("../contentGen");
const aiMedia = () => require("../aiMedia");
const sectionsLib = () => require("../marketing/pages/sections");

const now = () => new Date().toISOString().slice(0, 19).replace("T", " ");
const ws = (p) => (p.working || {});
const sectionOf = (page, id) => (ws(page).sections || []).find((s) => s.id === id);
const TOKEN_PATH = { primary: "tokens.colors.primary", secondary: "tokens.colors.secondary", accent: "tokens.colors.accent", background: "tokens.colors.background", text: "tokens.colors.text" };
const BG = ["default", "surface", "primary", "accent", "dark"], PADDING = ["none", "sm", "md", "lg", "xl"];

// ---------- périmètre minimal ----------
// Règle : le plus petit périmètre qui satisfait la demande ; toute extension est EXPLIQUÉE et soumise à confirmation, jamais décidée en silence.
function planScope(analysis, resolved, dep) {
  const a = analysis, p = { executor: null, scope: "", why: "", targets: [], needsConfirmation: false, escalation: null };
  const secLabel = resolved.section ? ctxLib.label(resolved.section) : "";
  if (a.intent === "change_design") { p.executor = "design_token"; p.scope = "design"; p.why = "La demande concerne une couleur du design : seul ce réglage du personnalisateur est modifié (brouillon), sans toucher aux pages."; p.targets = [{ kind: "design", ref: TOKEN_PATH[a.property.token] || "tokens.colors", label: `Couleur « ${a.property.token || "?"} » du design` }]; p.needsConfirmation = true; return p; }
  if (a.intent === "change_style") {
    if (a.property.name === "fontSize") { if (resolved.node) { p.executor = "style_node"; p.scope = "node"; p.why = "Un seul élément est modifié (taille du texte)."; p.targets = [{ kind: "node", ref: resolved.node.id, label: `Élément ${resolved.node.type}`, value: resolved.node }]; } else { p.executor = null; p.unsupported = "La taille du titre d'une section native (bandeau, cartes…) n'est pas un réglage de la section : elle suit le design du site. Elle ne se règle que sur un élément d'une section libre (sélectionnez-le) ou globalement dans le personnalisateur."; } return p; }
    if (resolved.section) { p.executor = "style_section"; p.scope = "section"; p.why = `Un seul réglage de style (${a.property.name}) de ${secLabel} est modifié ; son contenu et les autres sections ne sont pas touchés.`; p.targets = [{ kind: "section", ref: resolved.section.id, label: secLabel, value: resolved.section }]; }
    else p.unsupported = "Précisez la section à modifier (sélectionnez-la ou nommez-la).";
    return p;
  }
  if (a.intent === "rewrite_text") {
    if (resolved.fieldKey) { p.executor = "text_field"; p.scope = "field"; p.why = "Un seul texte est réécrit (périmètre minimal) ; la section et la page ne sont pas régénérées."; p.targets = [{ kind: "field", ref: resolved.fieldKey, label: `Texte de ${secLabel}`, value: fieldInfo(resolved.section, resolved.fieldKey).current }]; return p; }
    if (resolved.section) { p.executor = "text_section"; p.scope = "section"; p.why = "Aucun texte précis n'est désigné : les textes de cette section sont réécrits ensemble (cohérence), les autres sections ne sont pas touchées."; p.targets = [{ kind: "section", ref: resolved.section.id, label: secLabel, value: resolved.section }]; return p; }
    if (resolved.page) { p.executor = "text_page"; p.scope = "page"; p.why = "La demande vise toute la page : ses textes sont réécrits section par section ; la structure, les styles et les images sont conservés."; p.targets = [{ kind: "page", ref: String(resolved.page.id), label: `Page « ${resolved.page.name} »`, value: resolved.page.working }]; p.needsConfirmation = true; return p; }
    return p;
  }
  if (a.intent === "replace_image") {
    if (resolved.section) { p.executor = "image"; p.scope = "section"; p.why = "Seule l'image de cet emplacement est régénérée (AI Media) ; l'ancienne reste dans la médiathèque."; p.targets = [{ kind: "section", ref: resolved.section.id, label: secLabel, value: resolved.section }]; }
    else p.unsupported = "Précisez l'image concernée (sélectionnez la section qui la contient).";
    return p;
  }
  if (a.intent === "add_section") { p.executor = "add_section"; p.scope = "page"; p.why = "Une section est ajoutée ; les sections existantes ne sont ni modifiées ni régénérées."; p.targets = resolved.page ? [{ kind: "page", ref: String(resolved.page.id), label: `Page « ${resolved.page.name} »`, value: null }] : []; return p; }
  if (a.intent === "redesign_page" || a.intent === "mobile_advice") { p.unsupported = a.note; return p; }
  return p;
}

// ---------- exécuteurs : calculent le changement SANS écrire ----------
async function prepare(ctx, siteId, analysis, resolved, plan, { call = null, context = {} } = {}) {
  const page = resolved.page, out = { changes: [], payload: {}, aiCalls: 0 };
  const ex = plan.executor;
  if (ex === "style_section") {
    const prop = analysis.property, s = resolved.section; let val = prop.value;
    if (prop.name === "padding") { const i = PADDING.indexOf((s.style || {}).padding || "md"); val = val === "lg" ? PADDING[Math.min(i + 1, 4)] : val === "sm" ? PADDING[Math.max(i - 1, 0)] : val; }
    const allowed = { background: BG, padding: PADDING, align: ["left", "center", "right"], width: ["narrow", "normal", "wide", "full"] }[prop.name];
    if (!allowed || !allowed.includes(val)) throw bad(`Valeur « ${val} » non prise en charge pour ${prop.name}.`);
    const before = (s.style || {})[prop.name] ?? "(par défaut)";
    out.changes.push({ path: `section:${s.id}.style.${prop.name}`, label: `${prop.name} de ${ctxLib.label(s)}`, before: String(before), after: val, category: "style" }); out.payload = { sectionId: s.id, prop: prop.name, value: val };
  } else if (ex === "style_node") {
    const n = resolved.node, cur = ((n.styles || {}).desktop || {}).fontSize || "16px", num = parseFloat(cur) || 16, unit = (String(cur).match(/[a-z%]+$/) || ["px"])[0], next = `${Math.max(8, Math.min(120, Math.round(num * (analysis.property.direction > 0 ? 1.25 : 0.8))))}${unit}`;
    out.changes.push({ path: `node:${n.id}.styles.desktop.fontSize`, label: "Taille du texte", before: cur, after: next, category: "style" }); out.payload = { nodeId: n.id, value: next };
  } else if (ex === "text_field") {
    const f = fieldInfo(resolved.section, resolved.fieldKey);
    const r = await contentGen().reviseValue(ctx, siteId, { value: f.current, label: f.label, max: f.max, line: f.line, path: f.path, key: f.key, op: analysis.op, instruction: analysis.raw, call, facts: context.facts || {}, country: context.country || "", language: context.language || "fr", voice: context.voice || null });
    const v = r.variants[0]; if (v.blocking) throw bad("La variante proposée contient une information non étayée (chiffre, contact ou affirmation non fournie) : elle n'est pas proposée. Reformulez la demande ou modifiez le texte à la main.", "unsupported_claim");
    out.aiCalls = r.aiCalls; out.changes.push({ path: f.key, label: f.label, before: f.current, after: v.text, category: "content" }); out.payload = { fieldKey: f.key, path: f.path, sectionId: resolved.section.id, value: v.text };
  } else if (ex === "text_section" || ex === "text_page") {
    const only = ex === "text_section" ? [resolved.section.id] : null;
    const set = await contentGen().generatePage(ctx, siteId, { pageId: page.id, context: { company: context.facts || {}, language: context.language || "fr", country: context.country || "", audience: context.audience || "" }, voiceOverride: context.voice || null, only, scope: "all", call, force: true });
    out.aiCalls = 1; out.payload = { setId: set.id };
    for (const [k, f] of Object.entries(set.fields)) out.changes.push({ path: k, label: f.label, before: f.base, after: f.value, category: "content" });
    if (!out.changes.length) throw bad("Aucun texte à réécrire dans ce périmètre.", "nothing_to_generate");
  } else if (ex === "design_token") {
    const path = TOKEN_PATH[analysis.property.token], port = designPort.port(), st = port.state(ctx, siteId, () => true);
    const before = (st.values || {})[path] ?? st.changes[path] ?? "(valeur actuelle du design)";
    out.changes.push({ path, label: `Couleur « ${analysis.property.token} »`, before: String(before), after: analysis.property.value, category: "style" }); out.payload = { path, value: analysis.property.value };
  } else if (ex === "image") {
    const needs = aiMedia().plan(ctx, siteId, { pageIds: [page.id] }).filter((n) => n.sectionId === resolved.section.id && n.status !== "no_slot");
    const main = needs.filter((n) => n.slot === "image"), pick = main.length === 1 ? main : needs;
    if (pick.length !== 1) throw bad(pick.length ? "Plusieurs emplacements d'image dans cette section : précisez lequel." : "Cette section n'a pas d'emplacement d'image géré.", pick.length ? "ambiguous" : "invalid_field");
    const need = pick[0], est = aiMedia().estimate(ctx, siteId, { needKeys: [need.key], provider: "demo" });
    out.changes.push({ path: `section:${resolved.section.id}.image`, label: "Image", before: need.status === "assigned" ? "image actuelle" : "emplacement à pourvoir", after: "nouvelle image proposée (fournisseur de démonstration, à associer ensuite)", category: "media" });
    out.payload = { needKey: need.key, estimate: est };
  } else if (ex === "add_section") {
    const type = analysis.target.typeHint, secs = ws(page).sections || [];
    const blank = require("../marketing/pages/blanks").blanks(ctx).find((b) => b.type === type);
    if (!blank || !blank.blank) throw bad(blank && blank.unavailable ? blank.unavailable : `Le type de section « ${type} » ne peut pas être ajouté automatiquement.`, "invalid_field");
    let index = secs.length, after = "en fin de page";
    if (analysis.target.afterType) { const idxs = secs.map((s, i) => (s.type === analysis.target.afterType ? i : -1)).filter((i) => i >= 0); if (idxs.length === 1) { index = idxs[0] + 1; after = `après ${ctxLib.label(secs[idxs[0]])}`; } else { const e = bad(idxs.length ? `Plusieurs sections « ${analysis.target.afterHint} » : après laquelle ajouter ?` : `Aucune section « ${analysis.target.afterHint} » dans cette page : où l'ajouter ?`, "ambiguous"); e.candidates = secs.map((s) => ({ id: s.id, label: ctxLib.label(s) })); throw e; } }
    out.changes.push({ path: `section:(nouvelle)`, label: `Nouvelle section ${type}`, before: "", after: after, category: "structure" }); out.payload = { type, index, section: blank.blank };
  } else throw bad("Aucune action applicable pour cette demande.");
  return out;
}
function fieldInfo(section, key) { const d = contentGen().fields.describe(section).find((x) => x.key === key); if (!d) throw bad("Champ introuvable.", "not_found"); return d; }

// ---------- proposition ----------
async function propose(ctx, siteId, { text, selection = {}, projectId = null, can = () => true, call = null, context = {} } = {}) {
  ctxLib.siteGuard(ctx, siteId); store.ensureSchema(ctx.db);
  const analysis = analyzer.analyze(text, selection);
  if (analysis.intent === "advice") return { status: "advice", analysis, message: "C'est une question de conseil : aucune modification n'est préparée. Reformulez en demandant une modification précise si vous voulez que j'agisse." };
  const resolved = ctxLib.resolve(ctx, siteId, analysis, selection);
  if (resolved.ambiguities.length) return { status: "clarification", analysis, questions: resolved.ambiguities, message: "Ma demande n'est pas assez précise pour modifier le site sans risque : j'ai besoin d'une précision." };
  const dep = ctxLib.dependencies(ctx, siteId, analysis, resolved);
  const plan = planScope(analysis, resolved, dep);
  if (plan.unsupported || !plan.executor) return { status: "unsupported", analysis, message: plan.unsupported || analysis.note || "Cette demande n'a pas d'action automatique sûre pour le moment." };
  const imp = ctxLib.impact(ctx, siteId, analysis, resolved, dep, plan);
  // périmètre élargi par les dépendances : EXPLIQUÉ, jamais silencieux
  if (dep.scopeKind === "global" && !analysis.scope.explicitGlobal && analysis.intent !== "change_design") imp.reasons.push("la demande locale touche une ressource globale");
  if (dep.scopeKind === "component" || dep.scopeKind === "shared") plan.escalation = `Cet élément est ${dep.scopeKind === "component" ? "un composant réutilisable" : "partagé"} : la modification dépasse le périmètre local demandé (${dep.pages.length || dep.media.length} élément(s) concerné(s)). Confirmation requise.`;
  const confirm = Boolean(plan.needsConfirmation || imp.requiresConfirmation || plan.escalation);
  const prep = await prepare(ctx, siteId, analysis, resolved, plan, { call, context });
  const baseFps = {}; for (const t of plan.targets) baseFps[`${t.kind}:${t.ref}`] = fp(t.value === undefined ? null : t.value);
  if (resolved.page) baseFps[`pageData:${resolved.page.id}`] = fp(restoreLib.currentPageData(resolved.page));
  const opId = history.create(ctx, siteId, { projectId, actor: "ai", kind: plan.executor, request: analysis.raw, intent: analysis.intent, scope: plan.scope, target: { pageId: resolved.page ? resolved.page.id : null, sectionId: resolved.section ? resolved.section.id : null, nodeId: resolved.node ? resolved.node.id : null, fieldKey: resolved.fieldKey || null, targets: plan.targets.map((t) => ({ kind: t.kind, ref: t.ref, label: t.label })) },
    plan: { executor: plan.executor, scope: plan.scope, why: plan.why, escalation: plan.escalation, confirm, payload: prep.payload, impact: imp, dep: { scopeKind: dep.scopeKind } }, changes: prep.changes, status: "proposed", aiCalls: prep.aiCalls, provider: prep.aiCalls ? "ai.call" : "", costMicro: null, costKind: prep.aiCalls ? "unknown" : "none", base: { pageRevision: resolved.page ? resolved.page.revision : null, fps: baseFps } });
  return { status: "proposed", opId, analysis, plan: { executor: plan.executor, scope: plan.scope, why: plan.why, escalation: plan.escalation, requiresConfirmation: confirm }, impact: imp, preview: { changes: prep.changes, preserved: preserved(resolved, plan) }, usage: { aiCalls: prep.aiCalls, estimate: prep.payload.estimate || null, note: prep.aiCalls ? "Un appel IA a été consommé pour préparer cette proposition ; son coût n'est pas communiqué (estimation indisponible)." : "Aucun appel IA : modification directe." } };
}
function preserved(resolved, plan) { const out = []; if (resolved.page) { const n = (ws(resolved.page).sections || []).length; out.push(plan.scope === "page" || plan.scope === "design" ? `structure et styles de ${n} section(s)` : `${Math.max(n - 1, 0)} autre(s) section(s) de la page, intactes`); } out.push("autres pages du site", "médias et réglages globaux (hors périmètre)"); return out; }

// ---------- application ----------
async function apply(ctx, siteId, opId, { confirm = false, allow = [], resolve = null, can = () => true } = {}) {
  ctxLib.siteGuard(ctx, siteId);
  const op = history.get(ctx, siteId, opId);
  if (op.status !== "proposed") throw bad("Cette proposition a déjà été traitée.", "conflict");
  const plan = op.plan, t = op.target, pl = plan.payload || {};
  if (plan.confirm && confirm !== true) throw bad("Cette modification a un impact élevé : confirmez-la explicitement après avoir lu l'impact.", "confirm_required");
  if (plan.executor === "design_token") return applyDesign(ctx, siteId, op, { allow, resolve, can });
  if (plan.confirm && confirm !== true) throw bad("Cette modification a un impact élevé : confirmez-la explicitement après avoir lu l'impact.", "confirm_required");
  const page = ctxLib.pageOf(ctx, siteId, t.pageId);
  // --- conflits : la cible a-t-elle changé depuis la proposition ? ---
  const fpsNow = {}; for (const tg of t.targets || []) fpsNow[`${tg.kind}:${tg.ref}`] = fp(currentValueOf(page, tg));
  const changed = (t.targets || []).filter((tg) => { const k = `${tg.kind}:${tg.ref}`; return Object.hasOwn(op.base.fps, k) && op.base.fps[k] !== fp(null) && op.base.fps[k] !== fpsNow[k]; });
  const pageMoved = op.base.pageRevision !== null && op.base.pageRevision !== page.revision;
  if (changed.length && resolve !== "use_ai") { const e = bad(`Conflit : ${changed.map((c) => c.label).join(", ")} a été modifié depuis la proposition (modification manuelle ou autre opération). Rien n'a été écrit. Choisissez : conserver la version actuelle (refuser), ou appliquer quand même la proposition de l'IA.`, "conflict"); e.detail = { changed, resolutions: ["keep_user", "use_ai"] }; throw e; }
  if (pageMoved && !changed.length) op.merged = true; // la page a changé ailleurs mais pas la cible : rebasage sûr
  // --- protections (côté serveur) ---
  if (plan.executor !== "add_section") protect.assertWritable(ctx, siteId, [...(t.targets || []).map((tg) => ({ kind: tg.kind, ref: tg.ref, label: tg.label, value: currentValueOf(page, tg) }))], { allow });
  if (protect.isLocked(ctx, siteId, [["page", page.id], ...(t.sectionId ? [["section", t.sectionId]] : [])])) throw bad("La page ou la section est verrouillée : aucune régénération.", "protected");
  if (plan.confirm && confirm !== true) throw bad("Cette modification a un impact élevé : confirmez-la explicitement après avoir lu l'impact.", "confirm_required");
  const before = [], after = [];
  let result = {};
  const run = () => {
    before.push(snaps.takePage(ctx, siteId, page.id, { label: `Avant : ${op.request.slice(0, 60)}` }).id);
    if (t.sectionId) { try { before.push(snaps.takeSection(ctx, siteId, page.id, t.sectionId, { label: "Avant (section)" }).id); } catch { /* section créée par l'opération */ } }
    if (t.nodeId) { try { before.push(snaps.takeNode(ctx, siteId, page.id, t.nodeId, { label: "Avant (élément)" }).id); } catch { /* */ } }
    const content = clone(ws(page));
    const secs = content.sections || [];
    if (plan.executor === "style_section") { const s = secs.find((x) => x.id === pl.sectionId); s.style = { ...(s.style || {}), [pl.prop]: pl.value }; }
    else if (plan.executor === "style_node") { const f = findNode(secs, pl.nodeId); f.node.styles = { ...(f.node.styles || {}), desktop: { ...((f.node.styles || {}).desktop || {}), fontSize: pl.value } }; }
    else if (plan.executor === "text_field") { const s = secs.find((x) => x.id === pl.sectionId); const w = contentGen().fields.write(s, [[pl.path, pl.value]]); delete w.__applied; secs[secs.indexOf(s)] = w; }
    else if (plan.executor === "add_section") { const s = clone(pl.section); s.id = sectionsLib().newSectionId(); secs.splice(Math.min(pl.index, secs.length), 0, s); result.sectionId = s.id; t.sectionId = t.sectionId || s.id; }
    else if (plan.executor === "text_section" || plan.executor === "text_page") {
      const set = contentGen().getSet(ctx, siteId, pl.setId);
      if (set.pageId !== page.id) throw bad("Proposition de textes incohérente avec la page.", "conflict");
      const out = contentGen().apply(ctx, siteId, pl.setId, { overwriteManual: allow.filter((a) => /\//.test(a)), applySeo: false }); result.skipped = out.skipped; result.written = out.written.length;
      if (!out.written.length) throw bad(`Aucun texte n'a pu être écrit${out.skipped.length ? ` : ${out.skipped[0].why}` : ""}.`, "nothing_to_apply");
    } else if (plan.executor === "image") {
      const tasks = aiMedia().start(ctx, siteId, { needKeys: [pl.needKey], provider: "demo", regenerate: true }, {}); result.task = tasks[0] ? tasks[0].id : null;
    }
    if (!["text_section", "text_page", "image"].includes(plan.executor)) pagesLib().saveDraft(ctx, page.id, content, { revision: page.revision });
    after.push(snaps.takePage(ctx, siteId, page.id, { label: `Après : ${op.request.slice(0, 60)}` }).id);
    if (t.sectionId) { try { after.push(snaps.takeSection(ctx, siteId, page.id, t.sectionId, { label: "Après (section)" }).id); } catch { /* */ } }
    if (t.nodeId) { try { after.push(snaps.takeNode(ctx, siteId, page.id, t.nodeId, { label: "Après (élément)" }).id); } catch { /* */ } }
    const np = ctxLib.pageOf(ctx, siteId, page.id);
    for (const tg of t.targets || []) protect.mark(ctx, siteId, tg.kind, tg.ref, currentValueOf(np, tg), op.id);
    if (plan.executor === "add_section") protect.mark(ctx, siteId, "section", result.sectionId, sectionOf(np, result.sectionId), op.id);
  };
  transaction(ctx.db, run);
  history.attach(ctx, op.id, "before", before); history.attach(ctx, op.id, "after", after);
  history.update(ctx, siteId, op.id, { status: "applied", appliedAt: now(), reversible: plan.executor !== "image" ? 1 : 1, plan: { ...plan, result } });
  return { opId: op.id, status: "applied", result, merged: Boolean(op.merged), note: plan.executor === "image" ? "Génération lancée : l'image n'est pas encore associée. Elle ne remplace l'ancienne qu'après confirmation explicite." : "Brouillon mis à jour : rien n'est publié." };
}
function currentValueOf(page, tg) {
  if (tg.kind === "section") return sectionOf(page, tg.ref) || null;
  if (tg.kind === "node") { const f = findNode(ws(page).sections || [], tg.ref); return f ? f.node : null; }
  if (tg.kind === "field") { const [sid] = String(tg.ref).split("/"), s = sectionOf(page, sid); if (!s) return null; const d = contentGen().fields.describe(s).find((x) => x.key === tg.ref); return d ? d.current : null; }
  if (tg.kind === "page") return ws(page);
  return null;
}
async function applyDesign(ctx, siteId, op, { allow, resolve, can }) {
  const pl = op.plan.payload, port = designPort.port(), st = port.state(ctx, siteId, can);
  if (protect.protectionOf(ctx, siteId, "design", "design") === "locked" || protect.protectionOf(ctx, siteId, "design", pl.path) === "locked") throw bad("Le design (ou ce réglage) est verrouillé.", "protected");
  protect.assertWritable(ctx, siteId, [{ kind: "design", ref: pl.path, label: "Réglage du design", value: st.changes[pl.path] ?? null }], { allow });
  const baseFp = op.base.fps[`design:${pl.path}`];
  if (baseFp !== undefined && baseFp !== fp(null) && baseFp !== fp(st.changes[pl.path] ?? null) && resolve !== "use_ai") { const e = bad("Conflit : ce réglage du design a été modifié depuis la proposition. Rien n'a été écrit.", "conflict"); e.detail = { resolutions: ["keep_user", "use_ai"] }; throw e; }
  const before = [snaps.takeDesign(ctx, siteId, { can, label: `Avant : ${op.request.slice(0, 60)}` }).id];
  port.saveDraft(ctx, siteId, { ...st.changes, [pl.path]: pl.value }, can);
  const after = [snaps.takeDesign(ctx, siteId, { can, label: `Après : ${op.request.slice(0, 60)}` }).id];
  protect.mark(ctx, siteId, "design", pl.path, pl.value, op.id);
  history.attach(ctx, op.id, "before", before); history.attach(ctx, op.id, "after", after);
  history.update(ctx, siteId, op.id, { status: "applied", appliedAt: now() });
  return { opId: op.id, status: "applied", result: {}, note: "Brouillon du personnalisateur mis à jour : rien n'est publié (publiez depuis le personnalisateur)." };
}
function reject(ctx, siteId, opId) { const op = history.get(ctx, siteId, opId); if (op.status !== "proposed") throw bad("Cette proposition a déjà été traitée.", "conflict"); history.update(ctx, siteId, opId, { status: "rejected" }); return { opId, status: "rejected" }; }

// ---------- annuler / rétablir (au niveau de l'opération logique) ----------
function snapsOf(op, phase) { return (op.snapshots || []).filter((s) => s.phase === phase); }
function undo(ctx, siteId, opId = null, { restoreAnyway = false, can = () => true } = {}) {
  ctxLib.siteGuard(ctx, siteId); store.ensureSchema(ctx.db);
  let op;
  if (opId) op = history.get(ctx, siteId, opId);
  else { const r = ctx.db.prepare("SELECT id FROM mk_regen_ops WHERE organization_id = ? AND site_id = ? AND status = 'applied' AND kind NOT IN ('undo','redo','restore') ORDER BY id DESC LIMIT 1").get(ctx.organizationId, siteId); if (!r) throw bad("Aucune opération à annuler.", "nothing_to_undo"); op = history.get(ctx, siteId, r.id); }
  if (op.status !== "applied") throw bad("Seule une opération appliquée peut être annulée.", "conflict");
  if (!op.reversible) throw bad("Cette opération n'est pas réversible.", "irreversible");
  // l'état actuel doit être celui que l'opération a produit (sinon : modification postérieure → confirmation explicite)
  const afters = snapsOf(op, "after"), befores = snapsOf(op, "before");
  const level = (s) => s.level;
  let res = { restored: [], kept: [], notes: [] }, lastId = null;
  const pageBefore = befores.find((s) => s.level === "page"), designBefore = befores.find((s) => s.level === "design");
  if (pageBefore) {
    const afterP = afters.find((s) => s.level === "page"), page = snaps.pageOf(ctx, siteId, snaps.get(ctx, siteId, pageBefore.id).data.pageId);
    if (afterP && snaps.get(ctx, siteId, afterP.id).fp !== fp(restoreLib.currentPageData(page)) && !restoreAnyway) { const e = bad("Conflit : la page a été modifiée depuis cette opération (modification manuelle ou autre opération). L'annuler écraserait ces changements. Confirmez pour continuer : l'état actuel sera conservé dans l'historique.", "conflict"); e.detail = { resolutions: ["restore_anyway"] }; throw e; }
    res = restoreLib.restore(ctx, siteId, pageBefore.id, { restoreAnyway: true, can, request: `Annulation : ${op.request.slice(0, 80)}`, parentId: op.id, kind: "undo", actor: "human" }); lastId = res.opId;
  } else if (designBefore) {
    const afterD = afters.find((s) => s.level === "design"), cur = designPort.port().state(ctx, siteId, can);
    if (afterD && snaps.get(ctx, siteId, afterD.id).fp !== fp({ changes: cur.changes, rev: cur.rev }) && !restoreAnyway) { const e = bad("Conflit : le design a été modifié depuis cette opération. Confirmez pour l'annuler quand même.", "conflict"); e.detail = { resolutions: ["restore_anyway"] }; throw e; }
    res = restoreLib.restore(ctx, siteId, designBefore.id, { restoreAnyway: true, can, request: `Annulation : ${op.request.slice(0, 80)}`, parentId: op.id, kind: "undo", actor: "human" }); lastId = res.opId;
  } else throw bad("Aucun état antérieur enregistré pour cette opération.", "irreversible");
  history.update(ctx, siteId, op.id, { status: "undone" });
  return { undoneOp: op.id, opId: lastId, ...res };
}
function redo(ctx, siteId, opId = null, { restoreAnyway = false, can = () => true } = {}) {
  ctxLib.siteGuard(ctx, siteId); store.ensureSchema(ctx.db);
  const r = opId ? { id: opId } : ctx.db.prepare("SELECT id FROM mk_regen_ops WHERE organization_id = ? AND site_id = ? AND status = 'undone' AND kind NOT IN ('undo','redo','restore') ORDER BY id DESC LIMIT 1").get(ctx.organizationId, siteId);
  if (!r) throw bad("Rien à rétablir.", "nothing_to_redo");
  const op = history.get(ctx, siteId, r.id);
  if (op.status !== "undone") throw bad("Seule une opération annulée peut être rétablie.", "conflict");
  const afterP = snapsOf(op, "after").find((s) => s.level === "page") || snapsOf(op, "after").find((s) => s.level === "design");
  if (!afterP) throw bad("Aucun état à rétablir.", "irreversible");
  const res = restoreLib.restore(ctx, siteId, afterP.id, { restoreAnyway, can, request: `Rétablissement : ${op.request.slice(0, 80)}`, parentId: op.id, kind: "redo", actor: "human" });
  history.update(ctx, siteId, op.id, { status: "applied" });
  return { redoneOp: op.id, ...res };
}
module.exports = { propose, apply, reject, undo, redo, planScope, prepare };
