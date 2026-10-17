// Export / import : exécuteurs branchés sur le moteur d'exécution des outils (runner.js) + création des opérations.
//   export  : build() par lots → fichier JSON conservé 24 h pour téléchargement (jamais de secret) ;
//   import  : phase « analyse » (aucune écriture : rapport, conflits, erreurs) → attente de CONFIRMATION → phase « apply » (par lots, annulable) ;
//   annuler un import : met à la corbeille ce que l'import a créé (pages, articles) et supprime ses menus, redirections et termes inutilisés.
const db = require("../../config/database");
const { transaction } = require("../../marketing/db/tx");
const runs = require("./runs");
const runner = require("./runner");
const exporter = require("./exporter");
const importer = require("./importer");

const BATCH = 20;
const MAX_STORED_ITEMS = 3000;
const light = (it) => ({ type: it.type, ref: it.ref, label: it.label, action: it.action, reason: it.reason || null, issues: it.issues, warnings: it.warnings, existing: it.existing || null });
const summarize = (a) => ({ counts: a.counts, conflicts: a.conflicts, errors: a.errors, blocked: a.blocked, skippedTypes: a.skippedTypes, warnings: a.warnings });

// ---------- Export ----------
runner.register("export", async (run, api) => {
  const opts = run.options ? JSON.parse(run.options) : {};
  const out = await exporter.build(api.ctx, api, { types: opts.types || [], siteId: run.site_id });
  if (out.cancelled) return { status: "cancelled", message: "Export annulé : aucun fichier produit." };
  return { status: "done", result: out.text, report: { counts: out.counts, bytes: Buffer.byteLength(out.text) }, message: "Export terminé." };
});

// ---------- Import ----------
runner.register("import", async (run, api) => {
  const opts = JSON.parse(run.options || "{}");
  const parsed = importer.parseFile(run.input);
  if (parsed.errors.length) return { status: "failed", phase: "analyse", message: parsed.errors.join(" "), report: { errors: parsed.errors } };
  const types = opts.types || [];
  const plan = importer.analyse(api.ctx, parsed.data, { siteId: run.site_id, types, onConflict: opts.onConflict || "skip" });
  if (run.phase !== "apply") {
    // Analyse à blanc : rien n'a été écrit
    api.setTotal(plan.items.length);
    api.reset();
    api.advance({ done: 0 });
    const stored = plan.items.length > MAX_STORED_ITEMS ? plan.items.filter((i) => i.action !== "create").slice(0, MAX_STORED_ITEMS) : plan.items;
    return { status: "awaiting", phase: "analyse", plan: { items: stored.map(light), truncated: stored.length < plan.items.length }, report: { analysis: summarize(plan), source: { siteName: parsed.data.source && parsed.data.source.siteName, exportedAt: parsed.data.exportedAt } }, message: plan.blocked ? "Des conflits empêchent l'import (stratégie « tout arrêter »)." : "Analyse terminée : vérifiez le rapport avant de confirmer." };
  }
  if (plan.blocked) return { status: "failed", phase: "apply", message: "Import refusé : conflits détectés avec la stratégie « tout arrêter »." };
  return applyPlan(run, api, parsed.data, plan, opts);
});

async function applyPlan(run, api, data, plan, opts) {
  const ctx = api.ctx;
  const siteId = run.site_id;
  const idMap = new Map(); // référence du fichier → { type, id }
  const results = []; // détail par élément (borné)
  const created = { pages: [], articles: [], taxonomies: [], menus: [], redirects: [] };
  const per = {};
  const bump = (type, k) => { const c = (per[type] ||= { created: 0, updated: 0, skipped: 0, failed: 0 }); c[k]++; };
  const todo = plan.items.filter((i) => ["create", "update", "duplicate", "skip", "error"].includes(i.action));
  api.setTotal(todo.length);
  api.reset();
  const sourcesByType = (type) => (type === "site" || type === "settings" ? [data.resources[type]] : data.resources[type] || []);
  // Ordre de dépendance : termes → pages → articles → menus → redirections → médias → SEO
  const ordered = [];
  for (const type of exporter.ORDER) {
    const planned = plan.items.filter((i) => i.type === type);
    const src = sourcesByType(type);
    planned.forEach((it, idx) => ordered.push({ it, raw: src[idx] }));
  }
  const apply = APPLY;
  let n = 0;
  for (let i = 0; i < ordered.length; i += BATCH) {
    if (api.cancelled()) {
      const report = finalReport({ per, results, created, plan, cancelled: true });
      return { status: "cancelled", phase: "apply", report, message: `Import annulé après ${n} élément(s) traité(s) : ce qui a été importé reste en place (voir le rapport, « Annuler cet import » le retire).` };
    }
    const slice = ordered.slice(i, i + BATCH);
    for (const { it, raw } of slice) {
      n++;
      let done = 0, failed = 0, skipped = 0;
      try {
        if (it.action === "error") { bump(it.type, "failed"); failed = 1; push(results, it, "failed", it.issues.join(" ")); }
        else if (it.action === "skip") { bump(it.type, "skipped"); skipped = 1; if (it.existing) mapExisting(idMap, it, raw); push(results, it, "skipped", it.reason || (it.warnings[0] || "")); }
        else {
          const out = transaction(db, () => apply[it.type](ctx, { it, raw, siteId, idMap, created, opts }));
          if (out.id && raw && raw.ref) idMap.set(raw.ref, { type: it.type, id: out.id });
          bump(it.type, out.result === "updated" ? "updated" : "created");
          done = 1;
          push(results, it, out.result, out.message || "", out.id);
        }
      } catch (error) {
        bump(it.type, "failed"); failed = 1;
        push(results, it, "failed", runner.messageOf(error));
      }
      api.advance({ done, failed, skipped, conflicts: it.existing ? 1 : 0 });
    }
    api.message(`Import : ${Math.min(n, ordered.length)} / ${ordered.length}`);
    // Rapport partiel conservé à chaque lot : après une interruption (redémarrage du serveur), on sait exactement ce qui a été créé (et on peut l'annuler)
    runs.update(run.id, { report: finalReport({ per, results: results.slice(0, 300), created, plan, cancelled: false, partial: true }) });
    await api.yieldTurn();
  }
  const report = finalReport({ per, results, created, plan, cancelled: false });
  const failed = Object.values(per).reduce((a, c) => a + c.failed, 0);
  return { status: "done", phase: "apply", report, message: failed ? `Import terminé avec ${failed} erreur(s).` : "Import terminé." };
}
function push(results, it, result, message, id) { if (results.length < 1500) results.push({ type: it.type, ref: it.ref, label: it.label, result, message: String(message || "").slice(0, 240), id: id || null }); }
function mapExisting(idMap, it, raw) { if (raw && raw.ref && it.existing && it.type !== "media" && it.type !== "seo") idMap.set(raw.ref, { type: it.type, id: it.existing }); }
function finalReport({ per, results, created, plan, cancelled, partial = false }) {
  return { cancelled, partial, per, created, results, warnings: plan.items.flatMap((i) => i.warnings.map((w) => `${i.label} : ${w}`)).slice(0, 100), errors: plan.items.filter((i) => i.action === "error").length };
}

// ---------- Création des ressources, une par service métier ----------
const uniqueName = (table, base, where = "", args = []) => { let name = base; for (let n = 2; db.prepare(`SELECT 1 FROM ${table} WHERE name = ? COLLATE NOCASE ${where}`).get(name, ...args); n++) name = `${base.slice(0, 90)} (${n})`; return name; };
const resolve = (idMap, ref, type) => { const m = ref && idMap.get(ref); return m && m.type === type ? m.id : null; };

const APPLY = {
  settings(ctx, { it, raw, siteId }) {
    const engine = require("../settings");
    const r = engine.update({ siteId }, it.apply || {}, ctx, { confirm: false });
    if (!r.ok) throw new Error((r.errors || ["Réglages refusés."]).join(" "));
    return { result: "updated", id: siteId || 1, message: `${r.changed.length} réglage(s) mis à jour.` };
  },

  site(ctx, { raw, siteId, it }) {
    const pages = require("../../marketing/pages");
    const site = pages.requireSite(ctx, siteId);
    const incoming = raw.settings || {};
    // L'adresse publique du site de destination est conservée (jamais importée) ; le reste du design est remplacé par un enregistrement validé
    const settings = { ...incoming, seo: { ...(incoming.seo || {}), publicUrl: (site.settings.seo || {}).publicUrl || "" }, extras: { ...(incoming.extras || {}), noindex: Boolean((site.settings.extras || {}).noindex) } }; // domaine et indexation de la destination : jamais importés
    pages.saveSiteDesign(ctx, siteId, { tokens: raw.tokens, settings, revision: site.settings_revision });
    void it;
    return { result: "updated", id: siteId, message: "Réglages du site remplacés (adresse publique conservée)." };
  },

  taxonomies(ctx, { it, raw, idMap, created }) {
    const taxonomy = require("../taxonomy");
    const parentId = resolve(idMap, raw.parentRef, "taxonomies");
    if (it.action === "update") { const t = taxonomy.update(it.existing, { name: importer.line(raw.name, 60), description: importer.line(raw.description, 500) }); return { result: "updated", id: t.id }; }
    const slug = it.action === "duplicate" ? undefined : it.slug;
    const t = taxonomy.create({ taxonomy: raw.taxonomy, name: it.action === "duplicate" ? `${importer.line(raw.name, 52)} (import)` : importer.line(raw.name, 60), slug, description: importer.line(raw.description, 500), parentId: taxonomy.TAXONOMIES[raw.taxonomy].hierarchical ? parentId : null });
    created.taxonomies.push(t.id);
    return { result: "created", id: t.id };
  },

  pages(ctx, { it, raw, siteId, idMap, created }) {
    const pages = require("../../marketing/pages");
    const landing = require("../../marketing/landing");
    const urls = require("../urls");
    const content = raw.content;
    if (it.action === "update") {
      const cur = pages.requirePage(ctx, it.existing);
      pages.saveDraft(ctx, cur.id, content, { revision: cur.revision });
      return { result: "updated", id: cur.id, message: "Brouillon mis à jour (la version en ligne n'a pas changé ; l'ancien brouillon est dans l'historique)." };
    }
    const name = uniqueName("mk_landing_pages", importer.line(raw.name, 100) || "Page importée", "AND organization_id = ?", [ctx.organizationId]);
    const page = pages.createPage(ctx, { name, siteId, kind: raw.kind === "landing" ? "landing" : "page" });
    const wanted = it.action === "duplicate" ? urls.uniqueSlug("page", `${it.slug}-copie`.slice(0, 60)) : it.slug;
    try { landing.saveSettings(ctx, page.id, { name, slug: wanted, formId: null, tags: Array.isArray(raw.tags) ? raw.tags.slice(0, 10) : [], indexable: Boolean(raw.indexable) }); } catch { /* adresse refusée (réservée…) : l'adresse automatique est gardée */ }
    const fresh = pages.requirePage(ctx, page.id);
    pages.saveDraft(ctx, page.id, content, { revision: fresh.revision });
    created.pages.push(page.id);
    return { result: "created", id: page.id, message: "Créée en brouillon." };
  },

  articles(ctx, { it, raw, idMap, created }) {
    const articles = require("../articles");
    const blog = require("../blog");
    const taxonomy = require("../taxonomy");
    let id;
    if (it.action === "update") id = it.existing;
    else {
      const draft = articles.createDraft({ title: importer.line(raw.title, 150), userId: ctx.userId });
      id = draft.id;
      const slug = it.action === "duplicate" ? blog.uniqueSlug(`${it.slug}-copie`, id) : blog.uniqueSlug(it.slug, id);
      if (slug !== draft.slug) db.prepare("UPDATE posts SET slug = ? WHERE id = ?").run(slug, id);
      created.articles.push(id);
    }
    articles.applyImported(id, raw, ctx.userId);
    const cats = (raw.categoryRefs || []).map((r) => resolve(idMap, r, "taxonomies")).filter(Boolean);
    const tags = (raw.tagRefs || []).map((r) => resolve(idMap, r, "taxonomies")).filter(Boolean);
    const primary = resolve(idMap, raw.primaryCategoryRef, "taxonomies");
    if (cats.length || tags.length) taxonomy.setTerms("post", id, { categoryIds: cats, primaryId: primary && cats.includes(primary) ? primary : cats[0] ?? null, tagIds: tags });
    return { result: it.action === "update" ? "updated" : "created", id, message: it.action === "update" ? "Contenu mis à jour (version précédente dans l'historique)." : "Créé en brouillon (jamais publié d'office)." };
  },

  menus(ctx, { it, raw, siteId, idMap, created }) {
    const navigation = require("../navigation");
    const name = it.action === "duplicate" ? uniqueName("nav_menus", `${importer.line(raw.name, 50)} (import)`, "AND COALESCE(site_id, 0) = COALESCE(?, 0)", [siteId]) : importer.line(raw.name, 60);
    const menu = navigation.create({ name, description: importer.line(raw.description, 300), siteId, userId: ctx.userId });
    created.menus.push(menu.id);
    const typeOfRef = { page: "pages", article: "articles", category: "taxonomies", tag: "taxonomies" };
    const map = new Map();
    const pending = [...(raw.items || [])];
    let guard = 0;
    let skipped = 0;
    while (pending.length && guard++ < 1000) {
      const idx = pending.findIndex((m) => !m.parentRef || map.has(m.parentRef));
      if (idx < 0) break; // parent introuvable : éléments restants ignorés
      const m = pending.splice(idx, 1)[0];
      const input = { type: m.type, label: m.label, url: m.url, new_tab: m.newTab ? 1 : 0, rel: m.rel, parent_id: m.parentRef ? map.get(m.parentRef) : undefined };
      if (typeOfRef[m.type]) { const oid = resolve(idMap, m.objectRef, typeOfRef[m.type]); if (!oid) { skipped++; continue; } input.object_id = oid; }
      if (m.type === "custom" && !/^(\/(?!\/)|#|https:\/\/|mailto:|tel:)/.test(String(m.url || ""))) { skipped++; continue; }
      try {
        const item = navigation.add(menu.id, input);
        navigation.updateItem(item.id, { status: m.status, visibility: m.visibility, icon: m.icon, description: m.description });
        map.set(m.ref, item.id);
      } catch { skipped++; }
    }
    skipped += pending.length;
    return { result: "created", id: menu.id, message: `${map.size} élément(s) créés${skipped ? `, ${skipped} ignoré(s) (ressource absente ou lien invalide)` : ""}. Emplacements non appliqués.` };
  },

  redirects(ctx, { it, raw, siteId, created }) {
    const redirects = require("../../seo/redirects");
    if (it.action === "update") {
      const r = redirects.update(it.existing, { source: raw.source, target: raw.target, status: raw.status, note: raw.note, enabled: raw.enabled === false ? "0" : "1", siteId }, ctx.userId);
      if (!r.ok) throw new Error(r.errors.join(" "));
      return { result: "updated", id: it.existing };
    }
    const r = redirects.create({ source: raw.source, target: raw.target, status: raw.status, note: raw.note, siteId }, ctx.userId, { source: "import" });
    if (!r.ok) throw new Error(r.errors.join(" "));
    if (raw.enabled === false) redirects.update(r.id, { source: raw.source, target: raw.target, status: raw.status, note: raw.note, enabled: "0", siteId }, ctx.userId);
    created.redirects.push(r.id);
    return { result: "created", id: r.id };
  },

  media(ctx, { it, raw }) {
    const media = require("../../marketing/media");
    media.updateMedia(ctx, it.existing, { name: raw.name, alt: raw.alt, title: raw.title, caption: raw.caption, description: raw.description });
    return { result: "updated", id: it.existing, message: "Métadonnées mises à jour (le fichier n'a pas changé)." };
  },

  seo(ctx, { raw }) {
    const seoMeta = require("../../seo/meta");
    const r = seoMeta.save(raw.entityType, raw.entityKey, { seo_title: raw.seoTitle, seo_description: raw.seoDescription, canonical_url: raw.canonicalUrl, robots_index: raw.robotsIndex, robots_follow: raw.robotsFollow,
      og_title: raw.ogTitle, og_description: raw.ogDescription, og_image_path: raw.ogImagePath, twitter_card: raw.twitterCard, focus_keyword: raw.focusKeyword, secondary_keywords: raw.secondaryKeywords }, ctx.userId);
    if (!r.ok) throw new Error(r.errors.join(" "));
    return { result: "updated", id: 1 };
  },
};

// ---------- Annuler un import : seulement ce qu'il a CRÉÉ (jamais ce qui existait avant) ----------
runner.register("import-undo", async (run, api) => {
  const source = runs.get(run.organization_id, JSON.parse(run.options || "{}").of, {});
  if (!source || !source.report || !source.report.created) return { status: "failed", message: "Import introuvable ou sans rien à annuler." };
  const c = source.report.created;
  const ctx = api.ctx;
  const pages = require("../../marketing/pages");
  const articles = require("../articles");
  const navigation = require("../navigation");
  const redirects = require("../../seo/redirects");
  const taxonomy = require("../taxonomy");
  const total = c.pages.length + c.articles.length + c.menus.length + c.redirects.length + c.taxonomies.length;
  api.setTotal(total);
  const detail = [];
  const each = async (list, label, fn) => {
    for (const id of list) {
      try { fn(id); api.advance({ done: 1 }); detail.push({ label, id, result: "retiré" }); }
      catch (e) { api.advance({ failed: 1 }); detail.push({ label, id, result: "échec", message: runner.messageOf(e) }); }
      if (detail.length % BATCH === 0) await api.yieldTurn();
    }
  };
  await each(c.pages, "Page", (id) => { const p = db.prepare("SELECT archived_at FROM mk_landing_pages WHERE id = ? AND organization_id = ?").get(id, ctx.organizationId); if (!p) throw new Error("déjà supprimée"); if (!p.archived_at) pages.archivePage(ctx, id); });
  await each(c.articles, "Article", (id) => articles.trash(id, ctx.userId));
  await each(c.menus, "Menu", (id) => navigation.remove(id));
  await each(c.redirects, "Redirection", (id) => redirects.remove(id, ctx.userId));
  await each(c.taxonomies.slice().reverse(), "Terme", (id) => taxonomy.remove(id));
  return { status: "done", report: { undone: detail }, message: "Import annulé : les pages et articles créés sont à la corbeille (restaurables) ; les mises à jour d'éléments existants se retrouvent dans l'historique." };
});

// ---------- Application immédiate (restauration d'un paquet de site, R5) ----------
// Même analyse, mêmes exécuteurs et même rapport qu'un import confirmé, mais dans la requête (le paquet a déjà été validé) ; une opération « import » est créée
// pour que « Annuler cet import » fonctionne. Si un élément échoue après une analyse sans erreur, ce qui a été créé est mis à la corbeille (pages…) ou retiré.
async function applyNow(ctx, { siteId, text, types, onConflict = "skip", source = "bundle" }) {
  const allowed = exporter.allowedTypes(ctx, { siteId, mode: "import" });
  const chosen = exporter.ORDER.filter((t) => types.includes(t) && allowed.includes(t));
  if (!chosen.length) return { ok: false, message: "Aucun type de ressource importable pour vous dans ce site." };
  const strategy = Object.hasOwn(importer.STRATEGIES, onConflict) ? onConflict : "skip";
  const run = runs.create({ organizationId: ctx.organizationId, siteId, userId: ctx.userId, kind: "import", options: { types: chosen, onConflict: strategy, source } });
  const now = () => new Date().toISOString().slice(0, 19).replace("T", " ");
  const end = (patch) => { runs.update(run.id, { finished_at: now(), phase: "apply", ...patch }); return runs.get(ctx.organizationId, run.id); };
  const parsed = importer.parseFile(text);
  if (parsed.errors.length) return { ok: false, message: parsed.errors.join(" "), run: end({ status: "failed", message: parsed.errors.join(" ") }) };
  const plan = importer.analyse(ctx, parsed.data, { siteId, types: chosen, onConflict: strategy });
  if (plan.blocked) return { ok: false, message: "Restauration refusée : conflits détectés avec la stratégie « tout arrêter ».", run: end({ status: "failed", message: "Conflits (tout arrêter)." }) };
  const bad = plan.items.filter((i) => i.action === "error");
  if (bad.length) return { ok: false, message: `Restauration refusée : ${bad.length} élément(s) invalide(s) (${bad[0].label} : ${bad[0].issues.join(" ")}).`, run: end({ status: "failed", message: "Éléments invalides.", report: { analysis: summarize(plan) } }) };
  runs.update(run.id, { phase: "apply", status: "running", started_at: now() });
  const state = { done: 0, failed: 0, skipped: 0, conflicts: 0 };
  const api = { ctx, run, setTotal: (n) => runs.update(run.id, { total: n }), advance: (d = {}) => { for (const k of Object.keys(state)) state[k] += Number(d[k] || 0); runs.update(run.id, state); }, reset: () => { for (const k of Object.keys(state)) state[k] = 0; }, message() {}, cancelled: () => false, yieldTurn: () => Promise.resolve() };
  const out = await applyPlan(runs.raw(run.id), api, parsed.data, plan, { types: chosen, onConflict: strategy });
  const failed = Object.values(out.report.per).reduce((a, c) => a + c.failed, 0);
  if (failed) {
    const undone = undoCreated(ctx, out.report.created);
    return { ok: false, message: `La restauration a échoué sur ${failed} élément(s) : ce qu'elle avait créé a été retiré${undone.failed ? ` (sauf ${undone.failed} élément(s), à retirer à la main)` : ""}.`, run: end({ status: "failed", message: "Restauration échouée, annulée.", report: { ...out.report, rolledBack: undone } }) };
  }
  return { ok: true, report: out.report, run: end({ status: "done", message: out.message, report: out.report }) };
}
// Retire ce qu'un import a CRÉÉ (même règles que « Annuler cet import ») : pages et articles à la corbeille, menus, redirections et termes supprimés
function undoCreated(ctx, c) {
  const pages = require("../../marketing/pages");
  const articles = require("../articles");
  const navigation = require("../navigation");
  const redirects = require("../../seo/redirects");
  const taxonomy = require("../taxonomy");
  let removed = 0, failed = 0;
  const each = (list, fn) => { for (const id of list || []) { try { fn(id); removed++; } catch { failed++; } } };
  each(c.pages, (id) => { const p = db.prepare("SELECT archived_at FROM mk_landing_pages WHERE id = ? AND organization_id = ?").get(id, ctx.organizationId); if (p && !p.archived_at) pages.archivePage(ctx, id); });
  each(c.articles, (id) => articles.trash(id, ctx.userId));
  each(c.menus, (id) => navigation.remove(id));
  each(c.redirects, (id) => redirects.remove(id, ctx.userId));
  each((c.taxonomies || []).slice().reverse(), (id) => taxonomy.remove(id));
  return { removed, failed };
}

// ---------- Création des opérations (appelées par les routes) ----------
function startExport(ctx, { siteId, types }) {
  const allowed = exporter.allowedTypes(ctx, { siteId, mode: "export" });
  const chosen = exporter.ORDER.filter((t) => types.includes(t) && allowed.includes(t));
  if (!chosen.length) throw Object.assign(new Error("Aucune ressource exportable dans cette sélection (droits ou portée)."), { user: true });
  const run = runs.create({ organizationId: ctx.organizationId, siteId, userId: ctx.userId, kind: "export", options: { types: chosen }, expiresInHours: 24 });
  runner.start(run, "export");
  return run;
}
function startImport(ctx, { siteId, text, types, onConflict }) {
  const allowed = exporter.allowedTypes(ctx, { siteId, mode: "import" });
  const chosen = exporter.ORDER.filter((t) => types.includes(t) && allowed.includes(t));
  if (!chosen.length) throw Object.assign(new Error("Aucun type de ressource importable pour vous dans ce site."), { user: true });
  const strategy = Object.hasOwn(importer.STRATEGIES, onConflict) ? onConflict : "skip";
  const run = runs.create({ organizationId: ctx.organizationId, siteId, userId: ctx.userId, kind: "import", options: { types: chosen, onConflict: strategy }, input: text });
  runs.update(run.id, { phase: "analyse" });
  runner.start(run, "analyse");
  return run;
}
function confirmImport(ctx, id) {
  const run = runs.get(ctx.organizationId, id);
  if (!run || run.kind !== "import" || run.status !== "awaiting") throw Object.assign(new Error("Cet import n'attend pas de confirmation."), { user: true });
  if (run.report && run.report.analysis && run.report.analysis.blocked) throw Object.assign(new Error("Import bloqué par la stratégie « tout arrêter »."), { user: true });
  runs.update(run.id, { phase: "apply", status: "queued", total: 0 });
  runner.start(runs.get(ctx.organizationId, id), "apply");
  return run;
}
function startUndo(ctx, id) {
  const src = runs.get(ctx.organizationId, id);
  if (!src || src.kind !== "import" || src.phase !== "apply" || !["done", "cancelled", "failed"].includes(src.status)) throw Object.assign(new Error("Seul un import terminé ou interrompu peut être annulé."), { user: true });
  if (db.prepare("SELECT 1 FROM cms_tool_runs WHERE kind = 'import-undo' AND organization_id = ? AND options LIKE ?").get(ctx.organizationId, `%"of":${src.id}%`)) throw Object.assign(new Error("Cet import a déjà été annulé."), { user: true });
  const run = runs.create({ organizationId: ctx.organizationId, siteId: src.site_id, userId: ctx.userId, kind: "import-undo", options: { of: src.id } });
  runner.start(run, "undo");
  return run;
}

module.exports = { applyNow, startExport, startImport, confirmImport, startUndo, STRATEGIES: importer.STRATEGIES, TYPES: exporter.TYPES, ORDER: exporter.ORDER };
