// Projet de boutique par IA (Programme 21.10) : ORCHESTRATEUR. Il ne contient AUCUNE logique commerciale : le catalogue, les stocks, les prix, les commandes et les paiements restent dans le moteur
// e-commerce (src/marketing/shop, migration 121) ; ce module prépare des BROUILLONS (analyse, plan, structure, produits, configuration), les fait valider par la personne, puis les écrit dans le moteur
// uniquement par ses services natifs (catalog.saveCategory, catalog.createProduct, store.saveSettings…), de façon IDEMPOTENTE (table `applied`).
// Portée : tout passe par `load` (organisation ET, pour un accès limité à un site, ce site) ; le site d'un projet est relu en base, jamais pris d'une requête.
const { MarketingError } = require("../../errors");
const { checkCtx, audit } = require("../../audience/shared");
const { transaction } = require("../../db/tx");
const { validSite } = require("../../audit");
const siteModules = require("../../siteModules");
const analyzer = require("./analyzer");
const planner = require("./planner");
const structure = require("./structure");
const products = require("./products");
const csv = require("./csv");
const config = require("./config");
const validation = require("./validation");
const seo = require("./seo");
const caps = require("./capabilities");

const err = (code, message) => new MarketingError(code, message);
const nowOf = (ctx) => (typeof ctx.now === "function" ? ctx.now() : Date.now());
const parse = (s, fb) => { try { return s ? JSON.parse(s) : fb; } catch { return fb; } };
const limited = (ctx) => ctx.siteScope !== undefined && ctx.siteScope !== null;
const shop = () => ({ catalog: require("../../shop/catalog"), store: require("../../shop/store") });
const scopeOf = (ctx, siteId) => ({ db: ctx.db, organizationId: ctx.organizationId, siteId });
const MAX_UNDO = 30, MAX_PRODUCTS = 500;

const STEPS = Object.freeze([
  { key: "brief", label: "Projet commercial" }, { key: "modele", label: "Modèle économique" }, { key: "architecture", label: "Architecture de la boutique" }, { key: "catalogue", label: "Organisation du catalogue" },
  { key: "produits", label: "Préparation des produits" }, { key: "design", label: "Design de la boutique" }, { key: "medias", label: "Images et médias" }, { key: "configuration", label: "Configuration commerciale" },
  { key: "seo", label: "SEO" }, { key: "apercu", label: "Prévisualisation" }, { key: "verifications", label: "Vérifications" }, { key: "publication", label: "Publication" },
]);

// ───────── Accès ─────────
function scopeSql(ctx) {
  if (!limited(ctx)) return { sql: "", params: [] };
  return Number.isInteger(ctx.siteScope) ? { sql: " AND site_id = ?", params: [ctx.siteScope] } : { sql: " AND 1 = 0", params: [] };
}
function load(ctx, id) {
  checkCtx(ctx);
  const sc = scopeSql(ctx);
  const row = ctx.db.prepare(`SELECT * FROM mk_ai_shops WHERE id = ? AND organization_id = ?${sc.sql}`).get(Number(id), ctx.organizationId, ...sc.params);
  if (!row) throw err("not_found", "Projet de boutique introuvable.");
  return row;
}
const gate = (ctx) => siteModules.assertEnabled(ctx, "ai");
const project = (row) => ({ analysis: parse(row.analysis_json, {}), plan: parse(row.plan_json, { pages: [] }), structure: parse(row.structure_json, { categories: [] }), products: parse(row.products_json, []), config: parse(row.config_json, {}), applied: parse(row.applied_json, {}) });
const view = (row) => ({ id: row.id, siteId: row.site_id, status: row.status, revision: row.revision, brief: row.brief_text, createdAt: row.created_at, updatedAt: row.updated_at, ...project(row) });
function event(ctx, shopId, action, summary, revision) {
  ctx.db.prepare("INSERT INTO mk_ai_shop_events (shop_id, organization_id, user_id, action, summary, revision, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)").run(shopId, ctx.organizationId, ctx.userId ?? null, action, String(summary).slice(0, 240), revision, nowOf(ctx));
}
const snapshotOf = (row) => JSON.stringify({ analysis: row.analysis_json, plan: row.plan_json, structure: row.structure_json, products: row.products_json, config: row.config_json });
function pushState(ctx, id, stack, snapshot, label) {
  ctx.db.prepare("INSERT INTO mk_ai_shop_states (shop_id, organization_id, stack, snapshot, label, created_at) VALUES (?, ?, ?, ?, ?, ?)").run(id, ctx.organizationId, stack, snapshot, String(label || "").slice(0, 160), nowOf(ctx));
  if (stack === "undo") ctx.db.prepare("DELETE FROM mk_ai_shop_states WHERE shop_id = ? AND stack = 'undo' AND id NOT IN (SELECT id FROM mk_ai_shop_states WHERE shop_id = ? AND stack = 'undo' ORDER BY id DESC LIMIT ?)").run(id, id, MAX_UNDO);
}
const popState = (ctx, id, stack) => { const r = ctx.db.prepare("SELECT * FROM mk_ai_shop_states WHERE shop_id = ? AND stack = ? ORDER BY id DESC LIMIT 1").get(id, stack); if (r) ctx.db.prepare("DELETE FROM mk_ai_shop_states WHERE id = ?").run(r.id); return r || null; };
const countStack = (ctx, id, stack) => ctx.db.prepare("SELECT COUNT(*) n FROM mk_ai_shop_states WHERE shop_id = ? AND stack = ?").get(id, stack).n;

// Écrit les brouillons (révision conditionnelle). `fn(p)` modifie l'objet projet et renvoie le résumé.
function mutate(ctx, id, { revision, label, undoable = true } = {}, fn) {
  checkCtx(ctx); gate(ctx);
  const row = load(ctx, id);
  if (revision === undefined || Number(revision) !== row.revision) throw err("conflict", "Ce projet a changé depuis son affichage : rechargez-le.");
  const p = project(row);
  let summary;
  try { summary = fn(p, row); } catch (e) { if (e instanceof MarketingError) throw e; throw err("invalid_field", e.message); }
  const now = nowOf(ctx);
  transaction(ctx.db, () => {
    const r = ctx.db.prepare("UPDATE mk_ai_shops SET analysis_json = ?, plan_json = ?, structure_json = ?, products_json = ?, config_json = ?, applied_json = ?, revision = revision + 1, updated_at = ? WHERE id = ? AND organization_id = ? AND revision = ?")
      .run(JSON.stringify(p.analysis), JSON.stringify(p.plan), JSON.stringify(p.structure), JSON.stringify(p.products), JSON.stringify(p.config), JSON.stringify(p.applied), now, row.id, ctx.organizationId, row.revision);
    if (!r.changes) throw err("conflict", "Ce projet a été modifié par quelqu'un d'autre : rechargez-le.");
    if (undoable) { pushState(ctx, id, "undo", snapshotOf(row), label || summary); ctx.db.prepare("DELETE FROM mk_ai_shop_states WHERE shop_id = ? AND stack = 'redo'").run(id); }
    event(ctx, id, label || "edit", summary, row.revision + 1);
  });
  return view(load(ctx, id));
}

// ───────── Création ─────────
function create(ctx, { brief, siteId }) {
  checkCtx(ctx); gate(ctx);
  const text = String(brief ?? "").replace(/\u0000/g, "").trim();
  if (text.length < 20) throw err("brief_too_short", "Décrivez votre boutique en quelques phrases (20 caractères au moins) : ce que vous vendez, où, à qui.");
  if (text.length > 6000) throw err("brief_too_long", "Description trop longue (6 000 caractères au plus).");
  const site = limited(ctx) ? validSite(ctx.db, ctx.organizationId, ctx.siteScope) : validSite(ctx.db, ctx.organizationId, Number(siteId));
  if (site === null || site === undefined) throw err(limited(ctx) ? "forbidden" : "invalid_field", limited(ctx) ? "Ce site n'est pas accessible avec vos droits." : "Choisissez un site de votre organisation pour la boutique.");
  const analysis = analyzer.analyze(text);
  const blog = siteModules.isEnabled(ctx.db, ctx.organizationId, site, "blog");
  const plan = planner.plan(analysis, { blog });
  const struct = structure.build(analysis.sector.key);
  const now = nowOf(ctx);
  const id = transaction(ctx.db, () => {
    const r = ctx.db.prepare("INSERT INTO mk_ai_shops (organization_id, site_id, user_id, status, brief_text, analysis_json, plan_json, structure_json, config_json, created_at, updated_at) VALUES (?, ?, ?, 'draft', ?, ?, ?, ?, ?, ?, ?)")
      .run(ctx.organizationId, site, ctx.userId ?? null, text, JSON.stringify(analysis), JSON.stringify(plan), JSON.stringify(struct), JSON.stringify({ factOverrides: {} }), now, now);
    const sid = Number(r.lastInsertRowid);
    event(ctx, sid, "created", `Projet créé (secteur : ${analysis.sector.label}).`, 1);
    audit(ctx, "ai_shop.created", "ai_shop", sid, { sector: analysis.sector.key });
    return sid;
  });
  return view(load(ctx, id));
}


// Création avec site neuf éventuel : le brief est contrôlé AVANT toute création de site ; si la création du projet échoue ensuite, le site créé est ARCHIVÉ (jamais supprimé)
function createWithSite(ctx, { brief, siteId, newSiteName }) {
  checkCtx(ctx); gate(ctx);
  const text = String(brief ?? "").trim();
  if (text.length < 20) throw err("brief_too_short", "Décrivez votre boutique en quelques phrases (20 caractères au moins) : ce que vous vendez, où, à qui.");
  if (!newSiteName) return create(ctx, { brief: text, siteId });
  if (limited(ctx)) throw err("forbidden", "Un accès limité à un site ne peut pas créer de nouveau site.");
  const name = clean(newSiteName, 80); if (name.length < 2) throw err("invalid_field", "Donnez un nom à la boutique (2 caractères au moins).");
  const pagesLib = require("../../pages"); const site = pagesLib.createSite(ctx, { name });
  try { return create(ctx, { brief: text, siteId: site.id }); } catch (e) { try { pagesLib.archiveSite(ctx, site.id); } catch { /* l'erreur d'origine prime */ } throw e; }
}

// ───────── Modifications des brouillons ─────────
const clean = (v, max) => String(v ?? "").replace(/[\u0000-\u001f<>]/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
function edit(ctx, id, op, { revision } = {}) {
  if (!op || typeof op !== "object") throw err("invalid_field", "Modification invalide.");
  return mutate(ctx, id, { revision, label: String(op.label || "").slice(0, 160) || undefined }, (p, row) => {
    const k = String(op.op || "");
    if (k.startsWith("plan_")) { const r = planner.edit(p.plan, { ...op, op: k.slice(5) }); return r; }
    if (k.startsWith("cat_")) { const r = structure.edit(p.structure, { ...op, op: k.slice(4) }); return r; }
    switch (k) {
      case "set_fact": {
        if (!/^[a-zA-Z]{2,30}$/.test(String(op.key || ""))) throw new Error("Information inconnue.");
        p.config.factOverrides = { ...(p.config.factOverrides || {}), [op.key]: op.value === null ? null : clean(op.value, 200) };
        p.analysis = analyzer.analyze(row.brief_text, p.config.factOverrides); return `Information « ${op.key} » précisée.`;
      }
      case "replan": { p.plan = planner.plan(p.analysis, { blog: siteModules.isEnabled(ctx.db, ctx.organizationId, row.site_id, "blog") }); return "Plan de boutique régénéré (l'ancien reste récupérable avec Annuler)."; }
      case "restructure": { p.structure = structure.build(p.analysis.sector.key); return "Structure du catalogue régénérée (l'ancienne reste récupérable avec Annuler)."; }
      case "accept_plan": { p.plan.accepted = true; return "Plan de boutique accepté."; }
      case "accept_structure": { const pr = structure.problems(p.structure).filter((x) => x.level === "warn"); if (pr.length) throw new Error(`Corrigez d'abord : ${pr[0].message}`); p.structure.accepted = true; return "Structure du catalogue acceptée."; }
      case "add_product": {
        if (p.products.length >= MAX_PRODUCTS) throw new Error(`${MAX_PRODUCTS} brouillons au plus.`);
        const d = products.normalizeDraft(op.product || {}, { currency: currency(p), categories: p.structure.categories });
        p.products.push({ ...d, issues: [], missing: products.missingOf(d) }); return `Brouillon « ${d.name} » ajouté.`;
      }
      case "update_product": {
        const i = p.products.findIndex((x) => x.key === op.key); if (i < 0) throw new Error("Brouillon introuvable.");
        if (p.applied.products && p.applied.products[op.key]) throw new Error("Ce produit est déjà créé dans le catalogue : modifiez-le dans l'administration de la boutique (le brouillon n'est plus la référence).");
        const merged = { ...p.products[i], ...op.product, key: op.key }; const d = products.normalizeDraft({ ...merged, facts: op.product && op.product.facts !== undefined ? op.product.facts : merged.facts }, { currency: currency(p), categories: p.structure.categories });
        // Le contenu généré dépend du nom et des faits : s'ils changent, il est périmé (retiré avec ses alertes) et doit être régénéré ; sinon il est conservé
        const stale = d.name !== p.products[i].name || JSON.stringify(d.facts) !== JSON.stringify(p.products[i].facts);
        p.products[i] = { ...d, content: stale ? null : p.products[i].content, issues: stale ? [] : p.products[i].issues || [], missing: products.missingOf(d) }; return `Brouillon « ${d.name} » modifié${stale && p.products[i].content === null && d.content !== null ? " (contenu périmé retiré : à régénérer)" : ""}.`;
      }
      case "remove_product": { const i = p.products.findIndex((x) => x.key === op.key); if (i < 0) throw new Error("Brouillon introuvable."); const [d] = p.products.splice(i, 1); return `Brouillon « ${d.name} » retiré (le catalogue n'est pas touché).`; }
      case "set_config": { p.config.proposal = { ...(p.config.proposal || {}), ...sanitizeProposal(op.proposal || {}) }; return "Configuration commerciale préparée (rien n'est encore appliqué)."; }
      default: throw new Error("Modification inconnue.");
    }
  });
}
const currency = (p) => (p.analysis.facts.currency ? p.analysis.facts.currency.value : (p.config.proposal && p.config.proposal.currency) || "EUR");
// La proposition de configuration ne contient que des valeurs SAISIES par la personne ; clés, secrets et valeurs hors liste sont écartés
function sanitizeProposal(i) {
  const out = {};
  if (i.currency !== undefined) out.currency = String(i.currency).toUpperCase().slice(0, 3);
  if (i.defaultCountry !== undefined) out.defaultCountry = String(i.defaultCountry).toUpperCase().slice(0, 2);
  if (Array.isArray(i.markets)) out.markets = [...new Set(i.markets.map((m) => String(m).toUpperCase().slice(0, 2)))].slice(0, 30);
  if (Array.isArray(i.paymentMethods)) out.paymentMethods = i.paymentMethods.map(String).filter((m) => ["stripe", "manual"].includes(m));
  for (const k of ["taxEnabled", "pricesIncludeTax"]) if (i[k] !== undefined) out[k] = Boolean(i[k]);
  if (i.notifyEmail !== undefined) out.notifyEmail = String(i.notifyEmail).slice(0, 200);
  if (i.manualInstructions !== undefined) out.manualInstructions = String(i.manualInstructions).slice(0, 2000);
  if (Array.isArray(i.zones)) out.zones = i.zones.slice(0, 20).map((z) => ({ name: clean(z.name, 80), countries: (Array.isArray(z.countries) ? z.countries : String(z.countries || "").split(/[\s,;]+/)).filter(Boolean).map((c) => String(c).toUpperCase().slice(0, 2)).slice(0, 60), methods: (Array.isArray(z.methods) ? z.methods : []).slice(0, 10).map((m) => ({ name: clean(m.name, 80), kind: ["flat", "free_over", "weight"].includes(m.kind) ? m.kind : "flat", costCents: m.costCents === undefined || m.costCents === null || m.costCents === "" ? null : Number(m.costCents), minSubtotalCents: m.minSubtotalCents === undefined || m.minSubtotalCents === "" ? undefined : Number(m.minSubtotalCents) })) }));
  if (Array.isArray(i.taxRules)) out.taxRules = i.taxRules.slice(0, 20).map((t) => ({ name: clean(t.name, 60), country: String(t.country || "").toUpperCase().slice(0, 2) || "*", rateBp: t.rateBp === undefined || t.rateBp === "" ? null : Number(t.rateBp) }));
  return out;
}

// ───────── Annuler / rétablir (brouillons du projet uniquement) ─────────
function restore(row, snap) { return { analysis_json: snap.analysis, plan_json: snap.plan, structure_json: snap.structure, products_json: snap.products, config_json: snap.config }; }
function swap(ctx, id, from, to, revision) {
  checkCtx(ctx); gate(ctx);
  const row = load(ctx, id);
  if (revision === undefined || Number(revision) !== row.revision) throw err("conflict", "Ce projet a changé depuis son affichage : rechargez-le.");
  const st = popState(ctx, id, from);
  if (!st) throw err(from === "undo" ? "nothing_to_undo" : "nothing_to_redo", from === "undo" ? "Rien à annuler." : "Rien à rétablir.");
  const snap = parse(st.snapshot, null);
  transaction(ctx.db, () => {
    pushState(ctx, id, to, snapshotOf(row), st.label);
    const r = restore(row, snap);
    const u = ctx.db.prepare("UPDATE mk_ai_shops SET analysis_json = ?, plan_json = ?, structure_json = ?, products_json = ?, config_json = ?, revision = revision + 1, updated_at = ? WHERE id = ? AND organization_id = ? AND revision = ?").run(r.analysis_json, r.plan_json, r.structure_json, r.products_json, r.config_json, nowOf(ctx), id, ctx.organizationId, row.revision);
    if (!u.changes) throw err("conflict", "Ce projet a changé : rechargez-le.");
    event(ctx, id, from === "undo" ? "undo" : "redo", `${from === "undo" ? "Annulé" : "Rétabli"} : ${st.label || "modification"}.`, row.revision + 1);
  });
  return view(load(ctx, id));
}
const undo = (ctx, id, { revision } = {}) => swap(ctx, id, "undo", "redo", revision);
const redo = (ctx, id, { revision } = {}) => swap(ctx, id, "redo", "undo", revision);

// ───────── Produits : contenu, CSV ─────────
async function generateProduct(ctx, id, key, { useAi = false, style } = {}) {
  const row = load(ctx, id); const p = project(row);
  const d = p.products.find((x) => x.key === key); if (!d) throw err("not_found", "Brouillon introuvable.");
  if (style && !products.STYLES[style]) throw err("invalid_field", "Style inconnu.");
  const call = useAi ? require("../index").call : null;
  const fact = (k) => (p.analysis.facts[k] ? p.analysis.facts[k].value : "");
  const gen = await products.generate(ctx, { ...d, style: style || d.style }, { shopName: fact("shopName"), language: fact("language") || "fr", call, useAi: Boolean(useAi) });
  const fresh = load(ctx, id);
  return mutate(ctx, id, { revision: fresh.revision, label: `Contenu de « ${d.name} »` }, (q) => { const i = q.products.findIndex((x) => x.key === key); if (i < 0) throw new Error("Brouillon introuvable."); q.products[i] = gen; return `Contenu généré pour « ${d.name} » (${gen.content.source === "ai" ? "IA" : "gabarit sans IA"}).`; });
}
function existingCatalog(ctx, siteId) {
  return ctx.db.prepare("SELECT slug, sku FROM mk_shop_products WHERE organization_id = ? AND site_id IS ? AND deleted_at IS NULL").all(ctx.organizationId, siteId);
}
// Aperçu d'un CSV : rien n'est enregistré
function previewCsv(ctx, id, text) {
  const row = load(ctx, id); const p = project(row);
  const parsed = csv.parse(text, { currency: currency(p), categories: p.structure.categories });
  const drafts = parsed.rows.filter((r) => r.draft).map((r) => r.draft);
  const dup = products.duplicates([...p.products.filter((x) => !(p.applied.products || {})[x.key]), ...drafts], existingCatalog(ctx, row.site_id));
  return { ...parsed, duplicates: dup, wouldAdd: drafts.length };
}
function addCsv(ctx, id, text, { revision } = {}) {
  return mutate(ctx, id, { revision, label: "Import CSV" }, (p, row) => {
    const parsed = csv.parse(text, { currency: currency(p), categories: p.structure.categories });
    const drafts = parsed.rows.filter((r) => r.draft).map((r) => r.draft);
    if (p.products.length + drafts.length > MAX_PRODUCTS) throw new Error(`${MAX_PRODUCTS} brouillons au plus.`);
    const dup = products.duplicates([...p.products, ...drafts], existingCatalog(ctx, row.site_id));
    const bad = new Set(dup.map((d) => d.key));
    const kept = drafts.filter((d) => !bad.has(d.key));
    for (const d of kept) p.products.push({ ...d, issues: [], missing: products.missingOf(d) });
    return `${kept.length} brouillon(s) ajouté(s) depuis le CSV, ${drafts.length - kept.length} écarté(s) comme doublon(s), ${parsed.rows.length - drafts.length} ligne(s) invalide(s).`;
  });
}

// ───────── Application au moteur e-commerce (idempotente) ─────────
function applyStructure(ctx, id) {
  checkCtx(ctx); gate(ctx); siteModules.assertEnabled(ctx, "commerce");
  const row = load(ctx, id); const p = project(row);
  if (!p.structure.accepted) throw err("not_accepted", "Acceptez d'abord la structure du catalogue.");
  const { catalog } = shop(); const s = scopeOf(ctx, row.site_id);
  const applied = { ...(p.applied.categories || {}) }; let created = 0, reused = 0;
  for (const c of structure.ordered(p.structure)) {
    if (applied[c.key] && catalog.categoryById(s, applied[c.key])) { reused += 1; continue; }
    const slug = catalog.slugify(c.name); const existing = catalog.categoryBySlug(s, slug);
    if (existing) { applied[c.key] = existing.id; reused += 1; continue; }
    applied[c.key] = catalog.saveCategory(s, { name: c.name, parent_id: c.parent ? applied[c.parent] : null }); created += 1;
  }
  persistApplied(ctx, row, { categories: applied }, `Catégories : ${created} créée(s), ${reused} déjà présente(s).`);
  return { created, reused, categories: applied };
}
async function applyPages(ctx, id) {
  checkCtx(ctx); gate(ctx);
  const row = load(ctx, id); const p = project(row);
  if (!p.plan.accepted) throw err("not_accepted", "Acceptez d'abord le plan de la boutique.");
  const pageGen = require("../../../pageGen"); const pagesLib = require("../../pages");
  const done = p.applied.pages || {};
  const alive = (pid) => { try { const pg = pagesLib.getPage(ctx, pid); return Boolean(pg && !pg.archived_at); } catch { return false; } };
  const todo = p.plan.pages.filter((x) => x.kind === "page" && !(done[x.key] && alive(done[x.key])));
  if (!todo.length) return { created: 0, pages: done };
  const site = pagesLib.getSite(ctx, row.site_id);
  const gen = planner.toPageGenPlan({ ...p.plan, pages: todo }, (p.analysis.facts.shopName && p.analysis.facts.shopName.value) || (site && site.name));
  const run = await pageGen.generate(ctx, row.site_id, gen, { useAi: false, layout: require("../../../designGen").appliedLayout(ctx, row.site_id) });
  const decisions = Object.fromEntries(run.result.pages.filter((x) => x.status === "ready").map((x) => [x.key, x.existing ? "skip" : "create"])); // une page existante n'est JAMAIS écrasée
  const out = pageGen.apply(ctx, row.site_id, run.id, decisions, {});
  const map = { ...done };
  for (const [k, v] of Object.entries(out)) map[k] = v.pageId;
  persistApplied(ctx, row, { pages: map, pagesRun: run.id }, `Pages éditoriales : ${Object.keys(out).length} créée(s) en brouillon.`);
  return { created: Object.keys(out).length, pages: map, run: run.id };
}
function persistApplied(ctx, row, patch, summary) {
  const fresh = load(ctx, row.id); const ap = parse(fresh.applied_json, {});
  const next = { ...ap, ...patch };
  transaction(ctx.db, () => { ctx.db.prepare("UPDATE mk_ai_shops SET applied_json = ?, revision = revision + 1, updated_at = ? WHERE id = ? AND organization_id = ?").run(JSON.stringify(next), nowOf(ctx), row.id, ctx.organizationId); event(ctx, row.id, "applied", summary, fresh.revision + 1); });
}
// Crée les produits choisis EN BROUILLON dans le catalogue natif. Refuse : prix absent, affirmation critique non étayée, doublon, catégorie non créée. Un produit déjà créé n'est jamais recréé.
function applyProducts(ctx, id, keys = null) {
  checkCtx(ctx); gate(ctx); siteModules.assertEnabled(ctx, "commerce");
  const row = load(ctx, id); const p = project(row);
  const { catalog } = shop(); const s = scopeOf(ctx, row.site_id);
  const applied = { ...(p.applied.products || {}) }; const catMap = p.applied.categories || {};
  const pick = p.products.filter((d) => !keys || keys.includes(d.key));
  if (!pick.length) throw err("invalid_field", "Aucun brouillon à créer.");
  const dup = products.duplicates(p.products.filter((d) => !applied[d.key]), existingCatalog(ctx, row.site_id)); // un brouillon déjà créé n'est pas un « doublon » de son propre produit
  const results = [];
  for (const d of pick) {
    if (applied[d.key] && catalog.getProduct(s, applied[d.key])) { results.push({ key: d.key, name: d.name, status: "already", id: applied[d.key] }); continue; }
    const why = [];
    if (d.priceCents === null || d.priceCents === undefined) why.push("prix non renseigné");
    if ((d.issues || []).some((i) => i.level === "critical")) why.push("affirmation non étayée à corriger");
    if (dup.some((x) => x.key === d.key)) why.push(dup.find((x) => x.key === d.key).reason);
    if (d.categoryKey && !catMap[d.categoryKey]) why.push("catégorie pas encore créée dans le catalogue");
    if (why.length) { results.push({ key: d.key, name: d.name, status: "refused", reasons: why }); continue; }
    try {
      const c = d.content || {};
      const description = [c.description || "", ...(c.benefits && c.benefits.length ? ["", "Points forts :", ...c.benefits.map((b) => `- ${b}`)] : [])].join("\n").trim();
      const pid = catalog.createProduct(s, {
        name: d.name, type: d.type, status: "draft", price_cents: d.priceCents, sku: d.sku || undefined, short_description: c.shortDescription || "", description,
        image_url: d.image || undefined, seo_title: c.seoTitle || "", seo_description: c.metaDescription || "", ...(d.stock !== null ? { manage_stock: 1, stock_qty: d.stock } : {}),
        ...(d.type === "variable" ? { attributes: d.attributes } : {}), ...(d.categoryKey ? { category_ids: [catMap[d.categoryKey]] } : {}),
      }, ctx.userId ?? null);
      let variants = 0;
      if (d.type === "variable") for (const combo of products.combinations(d.attributes)) { catalog.saveVariant(s, pid, { options: combo, manage_stock: 1, stock_qty: 0 }); variants += 1; } // stock 0 = rupture à renseigner ; ni SKU ni prix inventés
      applied[d.key] = pid; results.push({ key: d.key, name: d.name, status: "created", id: pid, variants });
    } catch (e) { results.push({ key: d.key, name: d.name, status: "refused", reasons: [e instanceof MarketingError ? e.message : "Erreur à la création."] }); }
  }
  const created = results.filter((r) => r.status === "created").length;
  if (created) persistApplied(ctx, row, { products: applied }, `Produits : ${created} créé(s) en brouillon dans le catalogue.`);
  return { results, created, refused: results.filter((r) => r.status === "refused").length };
}
function applyConfig(ctx, id, items) {
  checkCtx(ctx); gate(ctx); siteModules.assertEnabled(ctx, "commerce");
  const row = load(ctx, id); const p = project(row);
  const use = items || p.config.proposal || {};
  const r = config.apply(ctx, row.site_id, use);
  persistApplied(ctx, row, { config: { at: nowOf(ctx), done: r.done.length } }, `Configuration : ${r.done.length} élément(s) appliqué(s), ${r.refused.length} refusé(s).`);
  return r;
}
// Image d'un produit du catalogue : médiathèque du site uniquement (provenance et droits conservés par le gestionnaire de médias)
function assignImage(ctx, id, productId, mediaId, { alt } = {}) {
  checkCtx(ctx); gate(ctx);
  const row = load(ctx, id); const { catalog } = shop(); const s = scopeOf(ctx, row.site_id);
  const prod = catalog.getProduct(s, Number(productId)); if (!prod) throw err("not_found", "Produit introuvable.");
  const lib = require("../../../aiMedia").library(ctx, row.site_id, { limit: 200 });
  const item = lib.find((m) => m.id === Number(mediaId)); if (!item) throw err("not_found", "Image introuvable dans la médiathèque de ce site.");
  catalog.updateProduct(s, prod.id, { image_url: item.path });
  event(ctx, id, "image", `Image « ${item.name || item.id} » associée à « ${prod.name} ».`, row.revision);
  return { product: prod.id, image: item.path, aiGenerated: Boolean(item.aiGenerated), alt: alt || item.alt || "" };
}

// ───────── Design (Design Generator, contexte boutique) ─────────
async function generateDesign(ctx, id, brief = {}, { useAi = false } = {}) {
  gate(ctx);
  const row = load(ctx, id); const p = project(row); const f = (k) => (p.analysis.facts[k] ? p.analysis.facts[k].value : "");
  const text = [brief.text, f("positioning"), f("audience"), p.analysis.sector.label].filter(Boolean).join(". ").slice(0, 2000);
  const run = await require("../../../designGen").generate(ctx, row.site_id, { text, category: "boutique", sector: p.analysis.sector.label, country: f("country"), lang: f("language") || "fr" }, { useAi: Boolean(useAi) });
  return { run: { id: run.id, status: run.status, chosen: run.chosen, proposals: run.proposals.map((x) => ({ key: x.key, name: x.name, description: x.description, ok: x.report && x.report.ok, colors: (x.design && x.design.colors) || null, fonts: (x.design && x.design.fonts) || null })) } };
}
const dg = () => require("../../../designGen");
const designCompare = (ctx, id, rid, key, o) => dg().compare(ctx, load(ctx, id).site_id, Number(rid), String(key), o);
const designApply = (ctx, id, rid, key, o) => dg().apply(ctx, load(ctx, id).site_id, Number(rid), String(key), o);
const designUndo = (ctx, id, rid, o) => dg().undo(ctx, load(ctx, id).site_id, Number(rid), o);


// ───────── Publication guidée ─────────
// Ordre : (1) contrôles bloquants hors produits (paiement, livraison, taxes, variantes) → sinon RIEN n'est modifié ; (2) publication des produits choisis qui passent les contrôles ;
// (3) publication des pages éditoriales créées ; (4) ouverture de la boutique SEULEMENT si demandée, autorisée (shop.payments) et sans erreur restante. Aucun paiement n'est effectué.
function publish(ctx, id, { productIds = null, pages = true, open = false } = {}, { can = () => true } = {}) {
  checkCtx(ctx); gate(ctx); siteModules.assertEnabled(ctx, "commerce");
  if (!can("shop.write")) throw err("forbidden", "Vous n'avez pas le droit de modifier la boutique.");
  const row = load(ctx, id); const p = project(row); const siteId = row.site_id;
  const before = validation.validate(ctx, siteId, view(row));
  const blocking = before.checks.filter((c) => c.level === "error" && !["products", "checkout"].includes(c.key));
  if (blocking.length) throw err("preflight_failed", `Publication impossible : ${blocking.map((b) => b.message).join(" ")}`);
  const { catalog } = shop(); const s = scopeOf(ctx, siteId); const out = { products: [], pages: [], opened: false, refused: [] };
  const drafts = ctx.db.prepare("SELECT id, name, price_cents, description, status FROM mk_shop_products WHERE organization_id = ? AND site_id IS ? AND deleted_at IS NULL AND status = 'draft'").all(ctx.organizationId, siteId);
  for (const d of drafts.filter((x) => !productIds || productIds.includes(x.id))) {
    if (!d.price_cents) { out.refused.push({ name: d.name, reason: "prix nul : non publié" }); continue; }
    if (!String(d.description || "").trim()) { out.refused.push({ name: d.name, reason: "description vide : non publié" }); continue; }
    if (/\[à compléter\]/.test(d.description)) { out.refused.push({ name: d.name, reason: "description contenant « [à compléter] » : non publié" }); continue; }
    catalog.updateProduct(s, d.id, { status: "published" }); out.products.push(d.name);
  }
  if (pages) {
    const pagesLib = require("../../pages");
    if (!can("pages.publish")) { out.refused.push({ name: "pages", reason: "droit de publier des pages absent" }); }
    else for (const [key, pid] of Object.entries(p.applied.pages || {})) { try { pagesLib.publish(ctx, pid); out.pages.push(key); } catch (e) { out.refused.push({ name: `page ${key}`, reason: e instanceof MarketingError ? e.message : "erreur de publication" }); } }
  }
  const after = validation.validate(ctx, siteId, view(load(ctx, id)));
  if (open) {
    if (!can("shop.payments")) out.refused.push({ name: "ouverture", reason: "ouvrir la boutique exige le droit « paiements » (administrateur)" });
    else if (!after.readyToSell) out.refused.push({ name: "ouverture", reason: `boutique pas prête à vendre : ${after.blockers.join(" ") || "aucun produit publié"}` });
    else { shop().store.saveSettings(s, { enabled: 1 }); out.opened = true; }
  }
  persistApplied(ctx, row, { publishedAt: nowOf(ctx) }, `Publication : ${out.products.length} produit(s), ${out.pages.length} page(s)${out.opened ? ", boutique ouverte" : ""}.`);
  return { ...out, validation: after };
}

// ───────── État du projet ─────────
function state(ctx, id, { can = () => true } = {}) {
  const row = load(ctx, id); const v = view(row); const siteId = row.site_id;
  const c = caps.forSite(ctx, siteId);
  const s = scopeOf(ctx, siteId);
  const catalogRows = ctx.db.prepare("SELECT id, name, type, status, price_cents, sku, image_url, slug FROM mk_shop_products WHERE organization_id = ? AND site_id IS ? AND deleted_at IS NULL ORDER BY id DESC LIMIT 100").all(ctx.organizationId, siteId);
  const catalogCount = ctx.db.prepare("SELECT COUNT(*) n FROM mk_shop_products WHERE organization_id = ? AND site_id IS ? AND deleted_at IS NULL").get(ctx.organizationId, siteId).n;
  const catCount = ctx.db.prepare("SELECT COUNT(*) n FROM mk_shop_categories WHERE organization_id = ? AND site_id IS ?").get(ctx.organizationId, siteId).n;
  const val = validation.validate(ctx, siteId, v);
  const cfg = config.state(ctx, siteId, v.config.proposal || {});
  const draftIssues = seo.checkDrafts(v.products);
  const appliedProducts = v.applied.products || {};
  const pendingDrafts = v.products.filter((d) => !appliedProducts[d.key]);
  const site = require("../../pages").getSite(ctx, siteId);
  let designRuns = [], designApplied = null;
  try { designRuns = dg().listRuns(ctx, siteId); const a = designRuns.find((r) => r.status === "applied"); designApplied = a ? a.id : null; } catch { designRuns = []; }
  const factsMissing = v.analysis.missing || [];
  const status = (cond, partial) => (cond ? "done" : partial ? "in_progress" : "not_started");
  const S = (key, st, detail) => ({ key, label: STEPS.find((x) => x.key === key).label, status: st, detail });
  const steps = [
    S("brief", "done", "Brief analysé."),
    S("modele", v.analysis.models.some((m) => m.status === "unsupported") ? "error" : factsMissing.length ? "to_review" : "done", factsMissing.length ? `${factsMissing.length} information(s) à préciser.` : "Modèle commercial identifié."),
    S("architecture", v.plan.accepted ? (Object.keys(v.applied.pages || {}).length ? "done" : "in_progress") : "to_review", v.plan.accepted ? "Plan accepté." : "Plan à relire et accepter."),
    S("catalogue", v.structure.accepted ? (catCount ? "done" : "in_progress") : "to_review", v.structure.accepted ? `${catCount} catégorie(s) dans le catalogue.` : "Structure à relire et accepter."),
    S("produits", catalogCount ? (pendingDrafts.length ? "in_progress" : "done") : v.products.length ? "in_progress" : "not_started", `${catalogCount} produit(s) dans le catalogue, ${pendingDrafts.length} brouillon(s) en attente.`),
    S("design", designApplied ? "done" : designRuns.length ? "in_progress" : "not_started", designApplied ? "Direction artistique appliquée au brouillon des styles." : "Aucune direction appliquée."),
    S("medias", !catalogCount ? "not_started" : val.checks.find((x) => x.key === "images").level === "ok" ? "done" : "to_review", val.checks.find((x) => x.key === "images").message),
    S("configuration", cfg.todo.some((t) => t.level === "blocking") ? "error" : cfg.todo.some((t) => t.level === "warning") ? "to_review" : "done", cfg.todo.length ? `${cfg.todo.length} point(s) à traiter.` : "Configuration complète."),
    S("seo", !catalogCount && !v.products.length ? "not_started" : val.seo.issues.some((i) => i.level === "warn") || draftIssues.some((i) => i.level === "warn") ? "to_review" : "done", `${val.seo.issues.length + draftIssues.length} remarque(s).`),
    S("apercu", catalogCount ? "to_review" : "not_started", catalogCount ? "À regarder avant d'ouvrir la boutique." : "Rien à prévisualiser."),
    S("verifications", val.errors ? "error" : val.warnings ? "to_review" : catalogCount ? "done" : "not_started", `${val.errors} erreur(s) bloquante(s), ${val.warnings} avertissement(s).`),
    S("publication", val.readyToSell && c.shopOpen ? "done" : val.readyToSell ? "to_review" : "not_started", val.readyToSell ? (c.shopOpen ? "Boutique ouverte." : "Prête à être ouverte.") : "Pas prête à vendre."),
  ];
  const done = steps.filter((x) => x.status === "done").length;
  return {
    project: { id: row.id, siteId, siteName: site ? site.name : "", name: (v.analysis.facts.shopName && v.analysis.facts.shopName.value) || (site && site.name) || "Boutique", status: row.status, revision: row.revision, updatedAt: row.updated_at },
    brief: v.brief, analysis: v.analysis, plan: v.plan, structure: { ...v.structure, problems: structure.problems(v.structure) }, drafts: v.products, applied: v.applied, config: cfg,
    catalog: { count: catalogCount, categories: catCount, products: catalogRows.map((r) => ({ id: r.id, name: r.name, type: r.type, status: r.status, priceCents: r.price_cents, sku: r.sku, image: r.image_url, slug: r.slug })) },
    capabilities: { productTypes: c.productTypes, paymentProviders: c.paymentProviders, currency: c.currency, absent: c.absent, shopOpen: c.shopOpen, commerceModule: c.commerceModule },
    steps, progress: { done, total: steps.length, percent: Math.round((done / steps.length) * 100), current: (steps.find((x) => x.status !== "done") || steps[steps.length - 1]).key },
    validation: val, seoDrafts: draftIssues, design: { runs: designRuns, applied: designApplied },
    undo: { canUndo: countStack(ctx, id, "undo") > 0, canRedo: countStack(ctx, id, "redo") > 0, undoLabel: (ctx.db.prepare("SELECT label FROM mk_ai_shop_states WHERE shop_id = ? AND stack = 'undo' ORDER BY id DESC LIMIT 1").get(id) || {}).label || "" },
    history: ctx.db.prepare("SELECT action, summary, revision, created_at FROM mk_ai_shop_events WHERE shop_id = ? ORDER BY id DESC LIMIT 40").all(id).map((h) => ({ action: h.action, summary: h.summary, revision: h.revision, at: h.created_at })),
    styles: products.STYLES, can: { write: can("shop.write"), payments: can("shop.payments"), publish: can("pages.publish") },
  };
}
function list(ctx) {
  checkCtx(ctx);
  const sc = scopeSql(ctx);
  return ctx.db.prepare(`SELECT id, site_id, status, revision, updated_at, substr(brief_text, 1, 120) AS excerpt, analysis_json FROM mk_ai_shops WHERE organization_id = ?${sc.sql} ORDER BY updated_at DESC, id DESC LIMIT 100`).all(ctx.organizationId, ...sc.params)
    .map((r) => { const a = parse(r.analysis_json, {}); return { id: r.id, siteId: r.site_id, name: (a.facts && a.facts.shopName && a.facts.shopName.value) || r.excerpt, excerpt: r.excerpt, status: r.status, updatedAt: r.updated_at, sector: a.sector ? a.sector.label : "" }; });
}
const history = (ctx, id) => { load(ctx, id); return ctx.db.prepare("SELECT action, summary, revision, created_at FROM mk_ai_shop_events WHERE shop_id = ? ORDER BY id").all(id); };
module.exports = { STEPS, create, createWithSite, load, view, edit, undo, redo, state, list, history, generateProduct, previewCsv, addCsv, applyStructure, applyPages, applyProducts, applyConfig, publish, assignImage, generateDesign, designCompare, designApply, designUndo, MAX_PRODUCTS };
