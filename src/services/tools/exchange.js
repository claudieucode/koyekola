// Export / import : exécuteurs branchés sur le moteur d'exécution des outils (runner.js) + création des opérations.
//   export  : build() par lots → fichier JSON conservé 24 h pour téléchargement (jamais de secret) ;
//   import  : phase « analyse » (aucune écriture : rapport, conflits, erreurs) → attente de CONFIRMATION → phase « apply » (par lots, annulable) ;
//   annuler un import : met à la corbeille ce que l'import a créé (pages, articles) et supprime ses menus, redirections et termes inutilisés.
const path = require("node:path");
const db = require("../../config/database");
const { dataDir } = require("../../config/paths");
const { sameScope } = require("../siteScope"); // R9-2 : égalité de portée « principal ou site » (siteScope)
const { transaction } = require("../../marketing/db/tx");
const runs = require("./runs");
const runner = require("./runner");
const exporter = require("./exporter");
const importer = require("./importer");

const EXPORT_DIR = path.join(dataDir, "exports"); // privé : hors de uploads/, jamais servi par le serveur de fichiers
const BATCH = 20;
const MAX_STORED_ITEMS = 3000;
const light = (it) => ({ type: it.type, ref: it.ref, label: it.label, action: it.action, reason: it.reason || null, issues: it.issues, warnings: it.warnings, existing: it.existing || null });
// Conversion d'une source externe (WordPress, flux…) vers le format interne ; une erreur de lecture est un message clair, jamais une page d'erreur
function convertExternal(source, input, opts) {
  const def = require("./importers/registry").get(source);
  if (!def || typeof def.convert !== "function") return { errors: ["Importateur inconnu."] };
  try { const out = def.convert(input, opts); return { data: out.data, warnings: out.warnings || [], errors: [] }; }
  catch (error) { return { errors: [error.user ? error.message : "Le fichier n'a pas pu être lu (format inattendu)."] }; }
}
const summarize = (a) => ({ counts: a.counts, conflicts: a.conflicts, errors: a.errors, blocked: a.blocked, skippedTypes: a.skippedTypes, warnings: a.warnings });

// ---------- Export ----------
runner.register("export", async (run, api) => {
  const opts = run.options ? JSON.parse(run.options) : {};
  const out = await exporter.build(api.ctx, api, { types: opts.types || [], siteId: run.site_id, filters: opts.filters || {}, scope: opts.scope || "all", format: opts.format || "json", mediaFiles: Boolean(opts.mediaFiles), archiveDir: EXPORT_DIR, runId: run.id });
  if (out.cancelled) return { status: "cancelled", message: "Export annulé : aucun fichier produit." };
  const base = { counts: out.counts, format: out.format, mime: out.mime, ext: out.ext, matched: out.matched, skippedFormat: out.skippedFormat };
  // Archive avec médias : le fichier reste dans un dossier PRIVÉ (hors de uploads/, jamais servi statiquement) ; la base ne garde que son nom
  if (out.archive) return { status: "done", result: `@file:${path.basename(out.archive.file)}`, report: { ...base, bytes: out.archive.bytes, archive: { entries: out.archive.entries, includedFiles: out.archive.includedFiles, missingFiles: out.archive.missingFiles } }, message: "Export terminé : archive prête." };
  return { status: "done", result: out.text, report: { ...base, bytes: Buffer.byteLength(out.text) }, message: "Export terminé." };
});

// ---------- Import ----------
runner.register("import", async (run, api) => {
  const opts = JSON.parse(run.options || "{}");
  const external = Boolean(opts.source && opts.source !== "kolakisa");
  const parsed = external ? convertExternal(opts.source, run.input, opts) : importer.parseFile(run.input);
  if (parsed.errors.length) return { status: "failed", phase: run.phase || "analyse", message: parsed.errors.join(" "), report: { errors: parsed.errors } };
  const types = opts.types || [];
  const plan = importer.analyse(api.ctx, parsed.data, { siteId: run.site_id, types, onConflict: opts.onConflict || "skip", opts });
  if (run.phase !== "apply") {
    // Analyse à blanc : rien n'a été écrit
    api.setTotal(plan.items.length);
    api.reset();
    api.advance({ done: 0 });
    const stored = plan.items.length > MAX_STORED_ITEMS ? plan.items.filter((i) => i.action !== "create").slice(0, MAX_STORED_ITEMS) : plan.items;
    return { status: "awaiting", phase: "analyse", plan: { items: stored.map(light), truncated: stored.length < plan.items.length }, report: { analysis: summarize(plan), source: { siteName: parsed.data.source && parsed.data.source.siteName, exportedAt: parsed.data.exportedAt, platform: parsed.data.source && parsed.data.source.platform, version: parsed.data.source && parsed.data.source.version, url: parsed.data.source && parsed.data.source.url }, extras: parsed.data.extras || null }, message: plan.blocked ? "Des conflits empêchent l'import (stratégie « tout arrêter »)." : "Analyse terminée : vérifiez le rapport avant de confirmer." };
  }
  if (plan.blocked) return { status: "failed", phase: "apply", message: "Import refusé : conflits détectés avec la stratégie « tout arrêter »." };
  return applyPlan(run, api, parsed.data, plan, opts);
});

async function applyPlan(run, api, data, plan, opts) {
  const ctx = api.ctx;
  const siteId = run.site_id;
  const idMap = new Map(); // référence du fichier → { type, id }
  const results = []; // détail par élément (borné)
  const created = { pages: [], articles: [], taxonomies: [], menus: [], redirects: [], comments: [], media: [] };
  const state = { mediaUrls: new Map(), mediaBytes: 0 }; // médias téléchargés : adresse d'origine → fichier local
  const per = {};
  const bump = (type, k) => { const c = (per[type] ||= { created: 0, updated: 0, skipped: 0, failed: 0 }); c[k]++; };
  const todo = plan.items.filter((i) => ["create", "update", "duplicate", "skip", "error"].includes(i.action));
  api.setTotal(todo.length);
  api.reset();
  const sourcesByType = (type) => (type === "site" || type === "settings" ? [data.resources[type]] : data.resources[type] || []);
  // Ordre de dépendance : termes → pages → articles → menus → redirections → médias → SEO
  const ordered = [];
  // Source externe : médias AVANT pages et articles (les adresses des images sont réécrites vers les fichiers locaux au moment de la création)
  const order = opts.source && opts.source !== "kolakisa" ? ["taxonomies", "media", "pages", "articles", "comments"] : exporter.ORDER;
  for (const type of order) {
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
          let pre = null;
          // Téléchargement d'un média distant : AVANT la transaction (asynchrone), borné et protégé contre les accès au réseau interne
          if (it.type === "media" && raw && raw.remoteUrl && it.action === "create") pre = await fetchRemoteMedia(raw.remoteUrl, state);
          const out = transaction(db, () => apply[it.type](ctx, { it, raw, siteId, idMap, created, opts, state, pre, run }));
          if (out.id && raw && raw.ref) idMap.set(raw.ref, { type: it.type, id: out.id });
          bump(it.type, out.result === "updated" ? "updated" : "created");
          done = 1;
          push(results, it, out.result, out.message || "", out.id);
          if (it.sourceKey && out.id && out.result === "created") recordSource(ctx, siteId, run, opts, it, out);
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
// Enregistre la correspondance source → contenu créé (doublons et reprise) ; une erreur ici ne fait jamais échouer l'import
function recordSource(ctx, siteId, run, opts, it, out) {
  try {
    if (!opts.source || opts.source === "kolakisa") return;
    db.prepare("INSERT OR REPLACE INTO mk_import_sources (organization_id, site_id, site_key, source, resource_type, source_key, local_id, local_ref, run_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)")
      .run(ctx.organizationId, siteId ?? null, siteId || 0, opts.source, it.type, it.sourceKey, out.id, out.path || null, run && run.id || null);
  } catch (error) { console.error("[KOLAKISA] Import : correspondance source non enregistrée :", String(error.message).slice(0, 120)); }
}
const MEDIA_BYTES_TOTAL = 150 * 1024 * 1024;
async function fetchRemoteMedia(url, state) {
  if (state.mediaBytes >= MEDIA_BYTES_TOTAL) return { error: "volume total de téléchargement atteint (150 Mo)" };
  const feed = require("../../marketing/rss/feed");
  try { const r = await feed.fetchBuffer(url, { maxBytes: 12 * 1024 * 1024, timeoutMs: 15000, accept: "image/*,application/pdf,*/*;q=0.5" }); state.mediaBytes += r.buffer.length; return r; }
  catch (error) { return { error: String(error.message || "échec").slice(0, 160) }; }
}
// Images du contenu : adresse d'origine remplacée par le fichier local téléchargé ; une image restée distante n'est pas supprimée en silence (l'assainisseur ne garde que les images locales) :
// elle devient un LIEN vers la source, signalé dans le résultat.
function rewriteImages(html, state) {
  let kept = 0;
  const out = String(html ?? "").replace(/<img\b[^>]*>/gi, (tag) => {
    const src = (/\bsrc\s*=\s*["']([^"']+)["']/i.exec(tag) || [])[1];
    if (!src) return tag;
    const alt = (/\balt\s*=\s*["']([^"']*)["']/i.exec(tag) || [])[1] || "";
    if (state.mediaUrls.has(src)) return tag.replace(src, state.mediaUrls.get(src));
    if (/^https?:\/\//i.test(src)) { kept++; return `<a href="${src.replace(/"/g, "%22")}">${alt ? alt.replace(/[<>"]/g, "") : "Image"} (image restée chez la source)</a>`; }
    return tag;
  });
  return { html: out, remote: kept };
}
function push(results, it, result, message, id) { if (results.length < 1500) results.push({ type: it.type, ref: it.ref, label: it.label, result, message: String(message || "").slice(0, 240), id: id || null }); }
function mapExisting(idMap, it, raw) { if (raw && raw.ref && it.existing && it.type !== "media" && it.type !== "seo") idMap.set(raw.ref, { type: it.type, id: it.existing }); }
function finalReport({ per, results, created, plan, cancelled, partial = false }) {
  return { cancelled, partial, per, created, results, warnings: plan.items.flatMap((i) => i.warnings.map((w) => `${i.label} : ${w}`)).slice(0, 100), errors: plan.items.filter((i) => i.action === "error").length };
}

// ---------- Création des ressources, une par service métier ----------
const uniqueName = (table, base, where = "", args = []) => { let name = base; for (let n = 2; db.prepare(`SELECT 1 FROM ${table} WHERE name = ? COLLATE NOCASE ${where}`).get(name, ...args); n++) name = `${base.slice(0, 90)} (${n})`; return name; };
const resolve = (idMap, ref, type) => { const m = ref && idMap.get(ref); return m && m.type === type ? m.id : null; };

// Contenu d'une source externe : auteur choisi par la personne qui importe (jamais créé depuis le fichier), date d'origine, rattachement au site de destination,
// publication seulement si elle a été demandée ET autorisée ; sinon brouillon.
function externalArticle(ctx, { id, raw, siteId, opts, state, idMap }) {
  const articles = require("../articles");
  const notes = [];
  const author = Number((opts.authorMap || {})[raw.authorKey]) || Number(opts.defaultAuthor) || ctx.userId;
  db.prepare("UPDATE posts SET author_id = ? WHERE id = ?").run(author, id);
  if (raw.date) db.prepare("UPDATE posts SET created_at = ? WHERE id = ?").run(raw.date.slice(0, 19).replace("T", " "), id);
  if (siteId) { try { require("../siteContent").assign(ctx, { type: "post", id, siteId }); } catch (error) { notes.push(`non rattaché au site (${importer.clip(error.message, 80)})`); } }
  if (raw.coverMediaRef) {
    const m = idMap.get(raw.coverMediaRef);
    const row = m && m.type === "media" ? db.prepare("SELECT path FROM mk_media WHERE id = ?").get(m.id) : null;
    if (row && /^\/uploads\//.test(row.path)) { try { articles.applyImported(id, { cover_path: row.path }, ctx.userId); } catch { notes.push("image mise en avant non rattachée"); } }
    else notes.push("image mise en avant non importée");
  }
  if (opts.keepPublished && raw.sourceStatus === "publish") {
    if (!ctx.can("articles.publish")) notes.push("brouillon (droit de publication manquant)");
    else {
      try {
        articles.publish(id, ctx.userId);
        if (raw.date) db.prepare("UPDATE posts SET published_at = ? WHERE id = ?").run(raw.date.slice(0, 19).replace("T", " "), id);
        notes.push("publié (comme à l'origine)");
      } catch (error) { notes.push(`resté en brouillon : ${importer.clip(error.message, 100)}`); }
    }
  } else notes.push(raw.sourceStatus && raw.sourceStatus !== "draft" ? `brouillon (statut d'origine « ${raw.sourceStatus} »)` : "brouillon");
  return `Créé : ${notes.join(" ; ")}.`;
}

const APPLY = {
  comments(ctx, { raw, idMap, created }) {
    const comments = require("../comments");
    const post = resolve(idMap, raw.articleRef, "articles");
    if (!post) throw new Error("Article d'origine absent : commentaire non importé.");
    const parent = raw.parentRef ? resolve(idMap, raw.parentRef, "comments") : null;
    const id = comments.importOne({ postId: post, parentId: parent, name: raw.author_name, email: raw.author_email, body: raw.body, status: raw.status, date: raw.date });
    created.comments.push(id);
    return { result: "created", id, message: raw.parentRef && !parent ? "Commentaire parent absent : importé au premier niveau." : "" };
  },

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

  pages(ctx, { it, raw, siteId, idMap, created, state }) {
    const pages = require("../../marketing/pages");
    const landing = require("../../marketing/landing");
    const urls = require("../urls");
    let content = raw.content;
    if (state && state.mediaUrls.size) { let j = JSON.stringify(content); for (const [from, to] of state.mediaUrls) j = j.split(JSON.stringify(from).slice(1, -1)).join(to); content = JSON.parse(j); }
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

  articles(ctx, { it, raw, idMap, created, siteId, opts, state }) {
    const articles = require("../articles");
    const blog = require("../blog");
    const taxonomy = require("../taxonomy");
    let id;
    if (it.action === "update") id = it.existing;
    else {
      const draft = articles.createDraft({ title: importer.line(raw.title, 150), userId: ctx.userId, siteId });
      id = draft.id;
      const slug = it.action === "duplicate" ? blog.uniqueSlug(opts.source && opts.source !== "kolakisa" ? it.slug : `${it.slug}-copie`, id) : blog.uniqueSlug(it.slug, id);
      if (slug !== draft.slug) db.prepare("UPDATE posts SET slug = ? WHERE id = ?").run(slug, id);
      created.articles.push(id);
    }
    let linkNote = "";
    if (opts.source && opts.source !== "kolakisa") { const rw = rewriteImages(raw.content, state); raw = { ...raw, content: rw.html }; if (rw.remote) linkNote = ` ${rw.remote} image(s) restée(s) chez la source (lien conservé).`; }
    articles.applyImported(id, raw, ctx.userId);
    const cats = (raw.categoryRefs || []).map((r) => resolve(idMap, r, "taxonomies")).filter(Boolean);
    const tags = (raw.tagRefs || []).map((r) => resolve(idMap, r, "taxonomies")).filter(Boolean);
    const primary = resolve(idMap, raw.primaryCategoryRef, "taxonomies");
    if (cats.length || tags.length) taxonomy.setTerms("post", id, { categoryIds: cats, primaryId: primary && cats.includes(primary) ? primary : cats[0] ?? null, tagIds: tags });
    let note = "";
    if (opts.source && opts.source !== "kolakisa" && it.action !== "update") note = externalArticle(ctx, { id, raw, siteId, opts, state, idMap }) + linkNote;
    return { result: it.action === "update" ? "updated" : "created", id, message: it.action === "update" ? "Contenu mis à jour (version précédente dans l'historique)." : (note || "Créé en brouillon (jamais publié d'office).") };
  },

  menus(ctx, { it, raw, siteId, idMap, created }) {
    const navigation = require("../navigation");
    const name = it.action === "duplicate" ? uniqueName("nav_menus", `${importer.line(raw.name, 50)} (import)`, `AND ${sameScope("site_id")}`, [siteId]) : importer.line(raw.name, 60);
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

  media(ctx, { it, raw, siteId, created, state, pre }) {
    const media = require("../../marketing/media");
    if (raw.remoteUrl !== undefined) {
      // Média distant : fichier déjà téléchargé (borné, adresse publique vérifiée) ; type et contenu réels vérifiés par la médiathèque (jamais le nom ni l'en-tête seuls)
      if (!pre || pre.error) throw new Error(`téléchargement impossible (${pre ? pre.error : "non effectué"}) : l'article garde le lien d'origine`);
      let name = String(raw.name || "fichier").replace(/[^\p{L}\p{N}._ -]/gu, "").slice(0, 80) || "fichier";
      if (!/\.[a-z0-9]{2,5}$/i.test(name)) { const ext = (/\.([a-z0-9]{2,5})(?:$|\?)/i.exec(raw.remoteUrl) || [])[1]; if (ext) name += `.${ext.toLowerCase()}`; }
      const saved = media.saveUpload(ctx, { buffer: pre.buffer, originalName: name, declaredType: pre.contentType, siteId });
      created.media.push(saved.id);
      state.mediaUrls.set(raw.remoteUrl, saved.path);
      return { result: "created", id: saved.id, path: saved.path, message: "Fichier téléchargé." };
    }
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
  const total = c.pages.length + c.articles.length + c.menus.length + c.redirects.length + c.taxonomies.length + (c.comments || []).length + (c.media || []).length;
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
  await each(c.comments || [], "Commentaire", (id) => { db.prepare("DELETE FROM blog_comments WHERE id = ? AND metadata LIKE '%\"imported\":true%'").run(id); });
  await each(c.media || [], "Média", (id) => { require("../../marketing/media").trashMedia(ctx, id); });
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
  each(c.comments || [], (id) => { db.prepare("DELETE FROM blog_comments WHERE id = ? AND metadata LIKE '%\"imported\":true%'").run(id); });
  each(c.menus, (id) => navigation.remove(id));
  each(c.redirects, (id) => redirects.remove(id, ctx.userId));
  each((c.taxonomies || []).slice().reverse(), (id) => taxonomy.remove(id));
  return { removed, failed };
}

// ---------- Création des opérations (appelées par les routes) ----------
// scope : « all » (tout ce qui est exportable et non sensible), « articles », « pages », « other » (un seul type, `other`) ; sans scope : liste de types explicite (API historique)
function startExport(ctx, { siteId, types = [], scope = null, other = null, filters = {}, format = "json", mediaFiles = false }) {
  const allowed = exporter.allowedTypes(ctx, { siteId, mode: "export" });
  let wanted = types;
  if (scope === "all") wanted = allowed.filter((t) => !exporter.TYPES[t].sensitive);
  else if (scope === "articles") wanted = ["articles"];
  else if (scope === "pages") wanted = ["pages"];
  else if (scope === "other") wanted = other ? [String(other)] : [];
  else if (scope !== null) throw Object.assign(new Error("Sélection inconnue."), { user: true });
  const chosen = exporter.ORDER.filter((t) => wanted.includes(t) && allowed.includes(t));
  if (!chosen.length) throw Object.assign(new Error("Aucune ressource exportable dans cette sélection (droits ou portée)."), { user: true });
  if (!["json", "wxr"].includes(format)) throw Object.assign(new Error("Format inconnu : choisissez le format natif Kolakisa ou WXR."), { user: true });
  if (format === "wxr" && scope === "other") { const bad = chosen.find((t) => !require("./wxr").SUPPORTED.includes(t)); if (bad) throw Object.assign(new Error(`« ${exporter.TYPES[bad].label} » n'existe que dans le format natif Kolakisa : choisissez ce format.`), { user: true }); }
  const s = scope || "all";
  const nf = exporter.normalizeFilters(ctx, siteId, s, filters);
  if (!nf.ok) throw Object.assign(new Error(nf.errors.join(" ")), { user: true });
  if (["articles", "pages"].includes(s) && exporter.count(ctx, s, siteId, nf.filters) === 0) throw Object.assign(new Error("Aucun contenu ne correspond à cette sélection : modifiez les filtres."), { user: true, empty: true });
  const run = runs.create({ organizationId: ctx.organizationId, siteId, userId: ctx.userId, kind: "export", options: { types: chosen, scope: s, filters: ["articles", "pages"].includes(s) ? filters : {}, format, mediaFiles: Boolean(mediaFiles) }, expiresInHours: 24 });
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
// Import d'une source externe (WordPress, flux…) : même moteur, même analyse à blanc, même confirmation. Le texte de la source est gardé sur le serveur le temps de l'opération (48 h).
function startExternalImport(ctx, { siteId, source, text, types, onConflict = "duplicate", options = {} }) {
  const registry = require("./importers/registry");
  const def = registry.get(source);
  if (!def || typeof def.convert !== "function") throw Object.assign(new Error("Importateur inconnu."), { user: true });
  if (!registry.enabled(db, ctx.organizationId, source)) throw Object.assign(new Error("Cet importateur est désactivé pour votre organisation."), { user: true });
  for (const p of def.permissions) if (!ctx.can(p)) throw Object.assign(new Error("Vous n'avez pas la permission d'utiliser cet importateur."), { user: true });
  const allowed = exporter.allowedTypes(ctx, { siteId, mode: "import", external: true });
  const chosen = exporter.ORDER.filter((t) => types.includes(t) && allowed.includes(t));
  if (!chosen.length) throw Object.assign(new Error("Aucun type de contenu importable pour vous dans ce site (articles, pages et catégories sont réservés à l'équipe de l'organisation)."), { user: true });
  const strategy = onConflict === "skip" ? "skip" : "duplicate";
  const clean = { source, types: chosen, onConflict: strategy, downloadMedia: Boolean(options.downloadMedia), keepPublished: Boolean(options.keepPublished) };
  const run = runs.create({ organizationId: ctx.organizationId, siteId, userId: ctx.userId, kind: "import", options: clean, input: text, expiresInHours: 48 });
  runs.update(run.id, { phase: "analyse" });
  runner.start(run, "analyse");
  return run;
}
// Reprise d'un import interrompu ou en échec : nouvelle analyse du MÊME fichier ; ce qui a déjà été importé est reconnu (identifiant source) et ignoré
function resumeImport(ctx, id) {
  const run = runs.get(ctx.organizationId, id, { heavy: true });
  if (!run || run.kind !== "import" || !run.options.source || run.options.source === "kolakisa") throw Object.assign(new Error("Cet import ne peut pas être repris."), { user: true });
  if (!["failed", "cancelled"].includes(run.status) || !run.input) throw Object.assign(new Error("Seul un import interrompu ou en échec, dont le fichier est encore conservé, peut être repris."), { user: true });
  const next = runs.create({ organizationId: ctx.organizationId, siteId: run.site_id, userId: ctx.userId, kind: "import", options: run.options, input: run.input, expiresInHours: 48 });
  runs.update(next.id, { phase: "analyse" });
  runner.start(next, "analyse");
  return next;
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

module.exports = { EXPORT_DIR, startExternalImport, resumeImport, convertExternal, applyNow, startExport, startImport, confirmImport, startUndo, STRATEGIES: importer.STRATEGIES, TYPES: exporter.TYPES, ORDER: exporter.ORDER };
