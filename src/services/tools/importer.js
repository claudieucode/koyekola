// Import de contenu (palier 13) : fichier « kolakisa-site@1 » → ANALYSE (rien n'est écrit) → rapport → confirmation → import par lots.
// Chaque ressource est créée par le SERVICE MÉTIER de son domaine (pages, articles, taxonomies, navigation, redirections, médias, SEO) :
// jamais d'écriture directe dans les tables. Les droits sont ceux de la personne qui importe, dans le site choisi.
// Garanties : aucune suppression, aucun écrasement silencieux (stratégie de conflit explicite), pages et articles toujours créés en
// BROUILLON, contenu assaini, aucun compte ni droit importé, aucune adresse de domaine importée, remappage des identifiants par références.
const crypto = require("node:crypto");
const { sameScope } = require("../siteScope"); // R9-2 : égalité de portée « principal ou site » (siteScope)
const db = require("../../config/database");
const { transaction } = require("../../marketing/db/tx");
const { FORMAT, TYPES, ORDER, MAX_PER_TYPE, allowedTypes } = require("./exporter");

const MAX_BYTES = 20 * 1024 * 1024;
const STRATEGIES = { skip: "Ignorer les éléments déjà présents", update: "Mettre à jour les éléments déjà présents", duplicate: "Créer des copies", stop: "Tout arrêter s'il y a un conflit" };
const REF = /^[a-z]{1,2}\d{1,12}$/;
const clip = (v, n) => String(v ?? "").replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, "").slice(0, n);
const line = (v, n) => clip(v, n).replace(/\s+/g, " ").trim();

// ---------- Lecture et validation du fichier (aucune écriture) ----------
function parseFile(text) {
  const errors = [];
  if (typeof text !== "string" || !text.trim()) return { errors: ["Le fichier est vide."] };
  if (Buffer.byteLength(text) > MAX_BYTES) return { errors: [`Fichier trop volumineux (${MAX_BYTES / 1048576} Mo au plus).`] };
  let data;
  try { data = JSON.parse(text); } catch { return { errors: ["Fichier illisible : ce n'est pas du JSON valide (fichier abîmé ou tronqué)."] }; }
  if (!data || typeof data !== "object" || Array.isArray(data)) return { errors: ["Fichier non reconnu : un export KOLAKISA est attendu."] };
  if (data.format !== FORMAT) return { errors: [`Format non reconnu (« ${line(data.format, 40) || "absent"} ») : exportez le site depuis Outils → Exporter (format ${FORMAT}).`] };
  if (!data.resources || typeof data.resources !== "object" || Array.isArray(data.resources)) return { errors: ["Fichier incomplet : aucune ressource."] };
  if (data.integrity && data.integrity.sha256) {
    const sum = crypto.createHash("sha256").update(JSON.stringify(data.resources)).digest("hex");
    if (sum !== data.integrity.sha256) errors.push("Le contenu du fichier a été modifié ou abîmé depuis l'export (somme de contrôle différente).");
  }
  for (const [type, list] of Object.entries(data.resources)) {
    if (!Object.hasOwn(TYPES, type)) { errors.push(`Type de ressource inconnu : « ${line(type, 30)} ».`); continue; }
    if (type === "site" || type === "settings") { if (!list || typeof list !== "object" || Array.isArray(list)) errors.push(`« ${TYPES[type].label} » : objet attendu.`); continue; }
    if (!Array.isArray(list)) { errors.push(`« ${TYPES[type].label} » : liste attendue.`); continue; }
    if (list.length > MAX_PER_TYPE) errors.push(`« ${TYPES[type].label} » : ${list.length} éléments (${MAX_PER_TYPE} au plus par import).`);
  }
  if (errors.length) return { errors };
  return { data, errors };
}

// ---------- Plan (analyse à blanc) ----------
const labelOf = { settings: () => "Paramètres du site", pages: (i) => i.name || i.slug, taxonomies: (i) => `${i.taxonomy} · ${i.name}`, articles: (i) => i.title, menus: (i) => i.name, redirects: (i) => `${i.source} → ${i.target}`, media: (i) => i.path, seo: (i) => `${i.entityType} · ${i.entityKey}`, site: (i) => i.name || "Réglages du site", comments: () => "" };

// Retourne { items: [{ type, ref, label, action, existing, issues, warnings, data }], counts, blocked }
function analyse(ctx, data, { siteId, types, onConflict }) {
  const pagesLib = require("../../marketing/pages");
  const nodes = require("../../marketing/pages/nodes");
  const taxonomy = require("../taxonomy");
  const redirects = require("../../seo/redirects");
  const seoMeta = require("../../seo/meta");
  const urls = require("../urls");
  const allowed = allowedTypes(ctx, { siteId, mode: "import" });
  const items = [];
  const refs = new Map(); // références du fichier : ref → { type }
  const warnings = [];
  const selected = ORDER.filter((t) => types.includes(t) && Object.hasOwn(data.resources, t));
  const skippedTypes = [];
  for (const t of Object.keys(data.resources)) if (!selected.includes(t)) skippedTypes.push(t);

  const push = (type, item, base) => { const it = { type, ref: item.ref || null, label: line(labelOf[type](item), 120), action: "create", existing: null, issues: [], warnings: [], ...base }; items.push(it); return it; };
  const dupRef = new Set();

  for (const type of selected) {
    const list = type === "site" || type === "settings" ? [data.resources[type]] : data.resources[type];
    if (!allowed.includes(type)) {
      for (const item of list) { const it = push(type, item || {}, { action: "error" }); it.issues.push(type === "comments" ? "Les commentaires ne sont pas importés (confidentialité : ils s'exportent seulement)." : "Vous n'avez pas le droit d'importer ce type de ressource dans ce site."); }
      continue;
    }
    for (const raw of list) {
      const item = raw && typeof raw === "object" ? raw : {};
      const it = push(type, item, {});
      if (type !== "site" && type !== "settings" && type !== "redirects" && type !== "seo") {
        if (!item.ref || !REF.test(String(item.ref))) it.issues.push("Référence manquante ou invalide.");
        else if (dupRef.has(item.ref)) it.issues.push(`Référence en double (${item.ref}).`);
        else { dupRef.add(item.ref); refs.set(item.ref, { type }); }
      }
      try {
        if (type === "pages") {
          if (!line(item.name, 100)) it.issues.push("Nom de la page manquant.");
          if (!item.content || !Array.isArray(item.content.sections)) it.issues.push("Contenu de la page manquant.");
          else {
            const norm = pagesLib.normalizeContent(ctx, { name: line(item.name, 100) || "Page" }, item.content);
            try { nodes.lockedWidgetChanges([], norm.sections, ctx.can); } catch (e) { it.issues.push(`Contenu réservé : ${e.message}`); }
          }
          const slug = urls.normalizeSlug(item.slug || item.name, { max: 60 });
          it.slug = slug;
          const ex = db.prepare("SELECT id, site_id, archived_at FROM mk_landing_pages WHERE slug = ?").get(slug);
          if (ex) { it.existing = ex.id; it.action = "conflict"; it.reason = ex.archived_at ? "adresse prise par une page à la corbeille" : (ex.site_id ?? null) !== (siteId ?? null) ? "adresse déjà utilisée par une page d'un autre site" : "une page porte déjà cette adresse"; it.crossSite = (ex.site_id ?? null) !== (siteId ?? null); it.trashed = Boolean(ex.archived_at); }
          if (item.kind === "step") it.warnings.push("Étape de tunnel importée comme page simple.");
        } else if (type === "taxonomies") {
          if (!taxonomy.TAXONOMIES[item.taxonomy]) it.issues.push(`Type de taxonomie inconnu : « ${line(item.taxonomy, 30)} ».`);
          if (!line(item.name, 60)) it.issues.push("Nom manquant.");
          const slug = urls.normalizeSlug(item.slug || item.name, { max: 80, fallback: "terme" });
          it.slug = slug;
          const ex = taxonomy.TAXONOMIES[item.taxonomy] ? taxonomy.bySlug(item.taxonomy, slug) : null;
          if (ex) { it.existing = ex.id; it.action = "conflict"; it.reason = "ce terme existe déjà"; }
        } else if (type === "articles") {
          if (!line(item.title, 150)) it.issues.push("Titre de l'article manquant.");
          if (typeof item.content !== "string") it.issues.push("Contenu de l'article manquant.");
          else if (item.content.length > 250000) it.issues.push("Contenu trop long (250 000 caractères au plus).");
          else {
            const { sanitizeBlogHtml, markdownToEditorHtml } = require("../../utils/blogHtml");
            const html = item.content_format === "markdown" ? markdownToEditorHtml(item.content) : item.content;
            if (sanitizeBlogHtml(html).length < html.length * 0.98 && /<\s*(script|iframe|object|embed|form)\b|\son\w+\s*=|javascript:/i.test(html)) it.warnings.push("Du code actif (script, cadre, événement) sera retiré du contenu.");
          }
          const slug = urls.normalizeSlug(item.slug || item.title, { max: 120, fallback: "article" });
          it.slug = slug;
          const ex = db.prepare("SELECT id, status, published, deleted_at FROM posts WHERE slug = ?").get(slug);
          if (ex) { it.existing = ex.id; it.action = "conflict"; it.reason = ex.deleted_at ? "adresse prise par un article à la corbeille" : "un article porte déjà cette adresse"; it.live = Boolean(ex.published); it.trashed = Boolean(ex.deleted_at); }
          for (const r of [...(item.categoryRefs || []), ...(item.tagRefs || [])]) if (typeof r !== "string" || !REF.test(r)) it.issues.push("Référence de catégorie ou d'étiquette invalide.");
        } else if (type === "menus") {
          if (!line(item.name, 60)) it.issues.push("Nom du menu manquant.");
          if (!Array.isArray(item.items)) it.issues.push("Éléments du menu manquants.");
          else if (item.items.length > 500) it.issues.push("Trop d'éléments (500 au plus).");
          const ex = db.prepare(`SELECT id FROM nav_menus WHERE ${sameScope("site_id")} AND name = ? COLLATE NOCASE`).get(siteId, line(item.name, 60));
          if (ex) { it.existing = ex.id; it.action = "conflict"; it.reason = "un menu porte déjà ce nom"; }
          if ((item.locations || []).length) it.warnings.push("Les emplacements du menu (en-tête, pied de page) ne sont pas appliqués : à choisir dans Navigation.");
        } else if (type === "redirects") {
          if (typeof item.source !== "string" || typeof item.target !== "string") it.issues.push("Source ou destination manquante.");
          else {
            const external = /^https?:\/\//i.test(item.target.trim());
            if (external && !ctx.can("redirects.external")) it.issues.push("Redirection vers un site extérieur : réservée aux administrateurs.");
            const v = redirects.validate({ source: item.source, target: item.target, status: item.status, siteId });
            const exists = v.value.source_path && db.prepare(`SELECT id, site_id FROM seo_redirects WHERE source_path = ? AND ${sameScope("site_id")}`).get(v.value.source_path, siteId ?? null); // R8 lot 6 : l'ancienne adresse n'est unique que PAR site
            if (exists) { it.existing = exists.id; it.action = "conflict"; it.reason = (exists.site_id ?? null) !== (siteId ?? null) ? "une redirection d'un autre site existe déjà pour cette adresse" : "une redirection existe déjà pour cette adresse"; it.crossSite = (exists.site_id ?? null) !== (siteId ?? null); }
            else for (const e of v.errors) it.issues.push(e);
          }
        } else if (type === "media") {
          if (typeof item.path !== "string" || !/^\/uploads\/marketing\/\d{1,9}\/(?:site-\d{1,9}\/)?(?:\d{4}\/(?:0[1-9]|1[0-2])\/)?[A-Za-z0-9_.-]{1,200}$/.test(item.path)) it.issues.push("Chemin de fichier invalide.");
          else {
            const ex = db.prepare("SELECT id FROM mk_media WHERE organization_id = ? AND path = ? AND deleted_at IS NULL").get(ctx.organizationId, item.path);
            if (!ex) { it.action = "skip"; it.reason = "fichier absent de la médiathèque (les fichiers ne sont pas importés)"; }
            else { it.existing = ex.id; it.action = "conflict"; it.reason = "fichier déjà présent : seules les métadonnées peuvent être mises à jour"; }
          }
        } else if (type === "seo") {
          const allowedSeo = ["page", "blog_category", "blog_tag", "course_category"];
          if (!allowedSeo.includes(item.entityType) || !seoMeta.validKey(item.entityType, item.entityKey)) { it.action = "skip"; it.reason = "réglage SEO d'un contenu non portable (identifiants propres à l'ancien site)"; }
          else {
            const cur = seoMeta.get(item.entityType, item.entityKey);
            if (Object.values(cur).some((v) => v !== null && v !== "" && typeof v !== "object") && (cur.seo_title || cur.seo_description || cur.canonical_url)) { it.action = "conflict"; it.reason = "des réglages SEO existent déjà pour ce contenu"; it.existing = 1; }
          }
        } else if (type === "settings") {
          const engine = require("../settings");
          const scope = { siteId };
          const cur = engine.readAll(scope, ctx);
          const incoming = item && item.values && typeof item.values === "object" ? item.values : null;
          if (!incoming) it.issues.push("Valeurs de réglages manquantes.");
          else {
            const apply = {};
            let differing = 0;
            for (const [k, raw] of Object.entries(incoming)) {
              const d = engine.byKey(scope, k);
              if (!d) { it.warnings.push(`« ${line(k, 40)} » : réglage inconnu pour ce périmètre, ignoré.`); continue; }
              if (d.sensitive) { it.warnings.push(`« ${d.label} » : réglage sensible (domaine, indexation, accueil, adresses), jamais importé.`); continue; }
              if (k === "site_name") { it.warnings.push("« Nom du site » : le nom du site de destination est conservé."); continue; }
              if (d.type === "page") { it.warnings.push(`« ${d.label} » : une page se choisit dans le site de destination, ignoré.`); continue; }
              const v = engine.validate(d, raw && typeof raw === "object" && "value" in raw ? raw.value : raw, scope, ctx);
              if (!v.ok) { it.warnings.push(`${v.error} Ignoré.`); continue; }
              if (!ctx.can(d.perm)) { it.warnings.push(`« ${d.label} » : permission « ${d.perm} » requise, ignoré.`); continue; }
              if (JSON.stringify(v.value ?? "") !== JSON.stringify(cur[k].value ?? "")) { apply[k] = v.value; differing++; }
            }
            it.apply = apply;
            if (!differing) { it.action = "skip"; it.reason = "les réglages sont identiques"; }
            else { it.existing = siteId || 1; it.action = "conflict"; it.reason = `${differing} réglage(s) diffèrent des valeurs actuelles`; }
          }
        } else if (type === "site") {
          it.existing = siteId; it.action = "conflict"; it.reason = "les réglages actuels du site seraient remplacés (couleurs, polices, identité)";
          it.warnings.push("L'adresse publique (domaine) n'est jamais importée : elle se règle dans le site de destination.");
        }
      } catch (error) { it.issues.push(clip(error.message, 200)); }
    }
  }

  // Références croisées : une catégorie, une page ou un article cité doit exister dans le fichier ou dans le site
  const known = (ref) => refs.has(ref);
  for (const it of items) {
    if (it.issues.length) { it.action = "error"; continue; }
    const pool = data.resources[it.type];
    const src = Array.isArray(pool) ? pool.find((x) => x && x.ref === it.ref) : pool;
    if (it.type === "taxonomies" && src && src.parentRef && !known(src.parentRef)) it.warnings.push("Catégorie parente absente du fichier : le terme sera créé au premier niveau.");
    if (it.type === "articles" && src) for (const r of [...(src.categoryRefs || []), ...(src.tagRefs || [])]) if (!known(r)) it.warnings.push(`Terme ${r} absent du fichier : ignoré.`);
    if (it.type === "menus" && src) for (const m of src.items || []) if (m.objectRef && !known(m.objectRef)) it.warnings.push(`Élément « ${line(m.label, 40)} » : ressource ${m.objectRef} absente du fichier, élément ignoré.`);
  }

  // Décision selon la stratégie de conflit (jamais d'écrasement silencieux : « update » exige le droit « tools.overwrite »)
  for (const it of items) {
    if (it.action !== "conflict") continue;
    if (onConflict === "update") {
      if (!ctx.can("tools.overwrite")) { it.action = "error"; it.issues.push("Mettre à jour des éléments existants exige la permission « tools.overwrite »."); }
      else if ((it.type === "pages" || it.type === "redirects") && (it.crossSite || it.trashed)) { it.action = "skip"; it.warnings.push(`Non modifiée : ${it.reason}.`); }
      else if (it.type === "articles" && (it.live || it.trashed)) { it.action = "skip"; it.warnings.push(it.live ? "Article en ligne : jamais modifié par un import (créez une copie)." : `Non modifié : ${it.reason}.`); }
      else if (it.type === "menus") { it.action = "skip"; it.warnings.push("Un menu existant n'est jamais modifié par un import (créez une copie)."); }
      else it.action = "update";
    } else if (onConflict === "duplicate") {
      if (["redirects", "media", "seo", "site", "settings"].includes(it.type)) { it.action = "skip"; it.warnings.push("Pas de copie possible pour ce type : ignoré."); } else it.action = "duplicate";
    } else it.action = "skip"; // skip et stop : rien n'est modifié
  }

  const counts = {};
  for (const it of items) { const c = (counts[it.type] ||= { total: 0, create: 0, update: 0, duplicate: 0, skip: 0, conflict: 0, error: 0 }); c.total++; c[it.action === "conflict" ? "conflict" : it.action]++; }
  const conflicts = items.filter((i) => i.existing && (i.action === "skip" || i.action === "update" || i.action === "duplicate" || i.action === "conflict")).length;
  const blocked = onConflict === "stop" && conflicts > 0;
  return { items, counts, conflicts, errors: items.filter((i) => i.action === "error").length, blocked, skippedTypes, warnings, refs: [...refs.keys()].length };
}

module.exports = { MAX_BYTES, STRATEGIES, parseFile, analyse, clip, line };
