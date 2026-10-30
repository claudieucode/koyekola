// KOLAKISA CMS → Apparence → Templates (programme 20.4) : CRÉER et GÉRER SES PROPRES MODÈLES, échanger des fichiers de modèle, administrer les secteurs.
// Aucun second stockage : un modèle de page vit dans mk_page_templates (isolé par site ; « shared » = partagé avec les sites de l'organisation, action explicite et droit dédié), une composition
// de section dans appearance_patterns (services/patternLibrary.js), un composant dans mk_web_components. Les modèles OFFICIELS sont du code livré : aucune fonction d'ici ne peut les modifier.
// Tout est limité au site vérifié par le serveur (siteId : entier | null = principal).
const db = require("../config/database");
const catalog = require("./templateCatalog");
const sectionsLib = require("../marketing/pages/sections");
const meta = require("../marketing/pages/libraryMeta");
const { UserError } = require("../utils/errors");
const { transaction } = require("../marketing/db/tx");

const pagesLib = () => require("../marketing/pages");
const patternLibrary = () => require("./patternLibrary");
const appearance = () => require("./appearance");

const FORMAT = "kolakisa-template";
const LEGACY_FORMATS = Object.freeze(["kolakisa-page@1"]);
const FILE_KINDS = Object.freeze(["page", "section", "component"]);
const MAX_FILE_SECTIONS = sectionsLib.MAX_SECTIONS;
const MAX_CUSTOM_SECTORS = 60;
const line = (v, max) => String(v ?? "").replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
const isMarketing = (e) => e && e.name === "MarketingError";
// Une erreur métier du moteur devient une erreur lisible ; « doublon » / « conflit » gardent leur statut 409
const asUser = (e) => (isMarketing(e) ? new UserError(e.message, e.code === "duplicate" || e.code === "conflict" ? 409 : 400) : e);
const slugify = (s) => String(s).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40);

// ---------- Métadonnées d'un modèle (validées, jamais recopiées telles quelles) ----------
function normalizeMeta(ctx, input = {}) {
  const known = catalog.sectorMap(ctx);
  const rawSectors = Array.isArray(input.sectors) ? input.sectors : [];
  const sectors = [...new Set(rawSectors.map((k) => String(k)))];
  if (sectors.length > 6) throw new UserError("Six secteurs au plus par modèle.");
  const bad = sectors.filter((k) => !known.has(k) || !known.get(k).active);
  if (bad.length) throw new UserError(`Secteur inconnu ou désactivé : ${bad.join(", ")}.`);
  const kw = (Array.isArray(input.keywords) ? input.keywords : String(input.keywords || "").split(",")).map((k) => line(k, 30)).filter(Boolean);
  if (kw.length > 12) throw new UserError("Douze mots-clés au plus.");
  const language = String(input.language || "fr");
  if (!/^[a-z]{2}(-[A-Z]{2})?$/.test(language)) throw new UserError("Langue invalide (ex. « fr »).");
  const siteType = String(input.siteType || "");
  if (!meta.SITE_TYPES.includes(siteType)) throw new UserError("Type de site inconnu.");
  return { sectors, keywords: [...new Set(kw)], language, siteType };
}

// ---------- Création depuis une page du site ----------
function pageOf(ctx, siteId, pageId) {
  const page = pagesLib().getPage(ctx, Number(pageId));
  if (!page || page.archived_at || (page.site_id ?? null) !== (siteId ?? null)) throw new UserError("Page introuvable pour ce site.");
  return page;
}
// kind : page (toute la page) | section (sections choisies : composition du site) | component (une section : composant du site)
function saveFromPage(ctx, siteId, { kind, pageId, indexes = [], name, description = "", category = "", replace = false, userId = null, ...metaInput }) {
  if (!FILE_KINDS.includes(kind)) throw new UserError("Choisissez ce que vous enregistrez : une page, des sections ou un composant.");
  const page = pageOf(ctx, siteId, pageId);
  const nm = line(name, 60);
  if (!nm) throw new UserError("Donnez un nom au modèle.");
  const m = normalizeMeta(ctx, metaInput);
  try {
    if (kind === "page") {
      const saved = pagesLib().savePageTemplate(ctx, { name: nm, category: line(category, 60), description: line(description, 200), content: page.working, siteId, meta: m, onConflict: replace ? "replace" : "refuse", userId });
      return { ref: `mine:${saved.id}`, kind: "page", name: saved.name, version: saved.version };
    }
    if (kind === "section") {
      const created = patternLibrary().createFromPage(ctx, siteId, { pageId: page.id, indexes, name: nm, description: line(description, 200), userId });
      return { ref: `pattern:${created}`, kind: "section", name: nm, version: 1 };
    }
    const idx = Number((Array.isArray(indexes) ? indexes : [indexes])[0]);
    const section = Number.isInteger(idx) ? (page.working.sections || [])[idx] : null;
    if (!section) throw new UserError("Choisissez la section à enregistrer comme composant.");
    if (section.type === "component") throw new UserError("Cette section est déjà un composant synchronisé.");
    const comp = pagesLib().createComponent(ctx, { name: nm, section, siteId, kind: "standard" });
    return { ref: `comp:${comp.id}`, kind: "component", name: comp.name, version: comp.version || 1 };
  } catch (e) { throw asUser(e); }
}

// ---------- Modifier / partager / supprimer (modèles de pages du site) ----------
function ownTemplateRow(ctx, siteId, id) {
  const row = Number.isInteger(id) ? ctx.db.prepare("SELECT * FROM mk_page_templates WHERE id = ? AND organization_id = ?").get(id, ctx.organizationId) : null;
  // Visible pour ce site seulement s'il est à lui ou partagé avec l'organisation ; MODIFIABLE seulement par son site d'origine
  if (!row || !(row.shared || (row.site_id ?? null) === (siteId ?? null))) throw new UserError("Modèle introuvable pour ce site.");
  return row;
}
function assertOrigin(row, siteId) {
  if ((row.site_id ?? null) !== (siteId ?? null)) throw new UserError("Ce modèle est partagé par un autre site : seul son site d'origine peut le modifier ou le supprimer.");
}
function updateTemplate(ctx, siteId, { id, name, description, category, visibility, userId = null, can = () => true, ...metaInput }) {
  const row = ownTemplateRow(ctx, siteId, id);
  assertOrigin(row, siteId);
  const sets = [], params = [];
  if (name !== undefined) {
    const nm = line(name, 80); if (!nm) throw new UserError("Le nom du modèle est obligatoire.");
    const dup = ctx.db.prepare("SELECT id FROM mk_page_templates WHERE organization_id = ? AND name = ? AND id <> ?").get(ctx.organizationId, nm, row.id);
    if (dup) throw new UserError("Un modèle porte déjà ce nom : choisissez un autre nom.");
    sets.push("name = ?"); params.push(nm);
  }
  if (description !== undefined) { sets.push("description = ?"); params.push(line(description, 200)); }
  if (category !== undefined) { sets.push("category = ?"); params.push(line(category, 60) || "Mes modèles"); }
  if (["sectors", "keywords", "language", "siteType"].some((k) => metaInput[k] !== undefined)) {
    const cur = { sectors: JSON.parse(row.sectors || "[]"), keywords: String(row.keywords || "").split(","), language: row.language, siteType: row.site_type };
    const m = normalizeMeta(ctx, { ...cur, ...Object.fromEntries(Object.entries(metaInput).filter(([, v]) => v !== undefined)) });
    sets.push("sectors = ?", "keywords = ?", "language = ?", "site_type = ?"); params.push(JSON.stringify(m.sectors), m.keywords.join(", "), m.language, m.siteType);
  }
  let shared = Boolean(row.shared);
  if (visibility !== undefined) {
    if (!["site", "organization"].includes(visibility)) throw new UserError("Visibilité inconnue (« site » ou « organization »).");
    const want = visibility === "organization";
    if (want !== shared) {
      if (!can("templates.share")) throw new UserError("Partager un modèle avec tous les sites de l'organisation demande le droit « templates.share » (administrateur).");
      if (want) {
        const sections = JSON.parse(row.content).sections || [];
        const a = catalog.analyze(ctx, siteId, sections, { can: () => true });
        const own = a.deps.forms.length ? `le formulaire n° ${a.deps.forms[0]}` : a.deps.components.length ? `le composant n° ${a.deps.components[0]}` : "";
        if (own) throw new UserError(`Ce modèle ne peut pas être partagé : il cite ${own}, qui appartient à ce site seulement. Retirez cette référence puis réessayez.`);
      }
      sets.push("shared = ?"); params.push(want ? 1 : 0); shared = want;
    }
  }
  if (!sets.length) throw new UserError("Rien à modifier.");
  sets.push("updated_at = datetime('now')", "updated_by = ?"); params.push(userId);
  try { ctx.db.prepare(`UPDATE mk_page_templates SET ${sets.join(", ")} WHERE id = ?`).run(...params, row.id); }
  catch (e) { if (/UNIQUE/i.test(e.message)) throw new UserError("Un modèle porte déjà ce nom : choisissez un autre nom."); throw e; }
  try { require("../marketing/audit").recordAudit(ctx.db, { organizationId: ctx.organizationId, userId, action: "page_template.updated", resourceType: "page_template", resourceId: row.id, metadata: { visibility: shared ? "organization" : "site" }, siteId }); } catch { /* jamais bloquant */ }
  return { ref: `mine:${row.id}`, visibility: shared ? "organization" : "site" };
}
function deleteTemplate(ctx, siteId, { ref, userId = null }) {
  const { kind, id } = catalog.parseRef(ref);
  if (kind === "pattern") { patternLibrary().trashOne(siteId, Number(id), userId); return { ref, trashed: true }; }
  if (kind !== "mine") throw new UserError("Seuls vos propres modèles peuvent être supprimés (les modèles officiels sont en lecture seule).");
  const row = ownTemplateRow(ctx, siteId, Number(id));
  assertOrigin(row, siteId);
  try { pagesLib().deletePageTemplate(ctx, row.id); } catch (e) { throw asUser(e); }
  return { ref, deleted: true };
}

// ---------- Fichiers de modèle : export / import ----------
const widgetTypesOf = (sections) => { const set = new Set(); const walk = (n) => { if (!n || typeof n !== "object") return; if (typeof n.type === "string") set.add(n.type); (Array.isArray(n.children) ? n.children : []).forEach(walk); }; sections.forEach(walk); return [...set].sort(); };
function exportTemplate(ctx, siteId, ref) {
  const { kind, id } = catalog.parseRef(ref);
  let doc;
  if (kind === "mine") {
    const t = pagesLib().getPageTemplate(ctx, Number(id), { siteId });
    if (!t) throw new UserError("Modèle introuvable pour ce site.");
    doc = { kind: "page", name: t.name, description: t.description, category: t.category, language: t.language, siteType: t.siteType, sectors: t.sectors, keywords: t.keywords, version: t.version, content: { sections: t.content.sections, theme: t.content.theme, title: t.content.title, description: t.content.description, seo: t.content.seo } };
  } else if (kind === "pattern" || kind === "comp") {
    const st = catalog.structureOf(ctx, siteId, ref);
    doc = { kind: kind === "pattern" ? "section" : "component", name: st.label, description: "", category: "", language: "fr", siteType: "", sectors: [], keywords: [], version: 1, content: { sections: st.pages[0].sections } };
  } else throw new UserError("Seuls vos propres modèles peuvent être exportés.");
  return { format: FORMAT, formatVersion: catalog.FORMAT_VERSION, exportedAt: new Date().toISOString(), requires: { widgets: widgetTypesOf(doc.content.sections) }, ...doc };
}
// Migrations de format : chaque entrée transforme la version N en N + 1 (aucune n'est nécessaire tant que le format est à 1 ; l'ancien « kolakisa-page@1 » est reconnu et converti)
const MIGRATIONS = Object.freeze({});
function upgradeDocument(doc) {
  if (!doc || typeof doc !== "object" || Array.isArray(doc)) throw new UserError("Fichier de modèle invalide : un objet JSON est attendu.");
  if (LEGACY_FORMATS.includes(doc.format)) return { format: FORMAT, formatVersion: 1, kind: "page", name: doc.name, description: "", category: "", language: "fr", siteType: "", sectors: [], keywords: [], version: 1, content: doc.content };
  if (doc.format !== FORMAT) throw new UserError("Ce fichier n'est pas un modèle Kolakisa (format inconnu).");
  let v = Number(doc.formatVersion);
  if (!Number.isInteger(v) || v < 1) throw new UserError("Version de format absente ou invalide.");
  if (v > catalog.FORMAT_VERSION) throw new UserError(`Ce modèle a été créé avec une version plus récente du format (${v}) que celle de ce site (${catalog.FORMAT_VERSION}) : mettez Kolakisa à jour avant de l'importer.`);
  let out = doc;
  while (v < catalog.FORMAT_VERSION) { const step = MIGRATIONS[v]; if (!step) throw new UserError(`Aucune migration disponible depuis la version ${v} du format.`); out = step(out); v += 1; }
  return out;
}
// Importer un FICHIER crée un modèle de la bibliothèque du site (jamais une page) ; contenu entièrement revalidé par la grammaire fermée du moteur
function importFile(ctx, siteId, { document, userId = null, can = () => true }) {
  const doc = upgradeDocument(document);
  if (!FILE_KINDS.includes(doc.kind)) throw new UserError("Type de modèle non pris en charge par l'import de fichier (page, section ou composant).");
  const sections = doc.content && Array.isArray(doc.content.sections) ? doc.content.sections : null;
  if (!sections || !sections.length) throw new UserError("Le fichier ne contient aucune section.");
  if (sections.length > MAX_FILE_SECTIONS) throw new UserError(`${MAX_FILE_SECTIONS} sections au plus.`);
  const nm = line(doc.name, 60);
  if (!nm) throw new UserError("Le fichier n'indique pas de nom de modèle.");
  // Contrôle de compatibilité AVANT d'écrire : éléments inconnus, droits, références à un autre site → refus nommant la cause
  let normalized;
  try { normalized = sectionsLib.normalizeSections(ctx, sections.map((s) => ({ ...s, id: s && s.id ? s.id : sectionsLib.newSectionId() }))); }
  catch (e) { throw new UserError(`Contenu incompatible avec cette version de Kolakisa : ${e.message}`); }
  const analysis = catalog.analyze(ctx, siteId, normalized, { can });
  if (analysis.blockers.length) throw Object.assign(new UserError(`Import impossible : ${analysis.blockers.map((b) => b.message).join(" ")}`, 422), { details: { analysis } });
  const m = normalizeMeta(ctx, { sectors: (doc.sectors || []).filter((k) => catalog.sectorMap(ctx).get(k)?.active), keywords: doc.keywords, language: doc.language || "fr", siteType: doc.siteType || "" });
  // Conflit de nom : jamais de remplacement, un numéro est ajouté
  const taken = (n) => ctx.db.prepare("SELECT 1 FROM mk_page_templates WHERE organization_id = ? AND name = ?").get(ctx.organizationId, n) || ctx.db.prepare("SELECT 1 FROM mk_web_components WHERE organization_id = ? AND name = ? COLLATE NOCASE").get(ctx.organizationId, n) || ctx.db.prepare("SELECT 1 FROM appearance_patterns WHERE site_id IS ? AND name = ? COLLATE NOCASE AND deleted_at IS NULL").get(siteId, n);
  let name = nm; for (let n = 2; taken(name) && n < 200; n += 1) name = `${nm.slice(0, 52)} (${n})`;
  const out = transaction(db, () => {
    if (doc.kind === "page") {
      const saved = pagesLib().savePageTemplate(ctx, { name, category: line(doc.category, 60), description: line(doc.description, 200), content: { ...doc.content, sections: normalized }, siteId, meta: m, onConflict: "refuse", userId });
      return { ref: `mine:${saved.id}`, kind: "page", name: saved.name };
    }
    if (doc.kind === "section") {
      const p = appearance().createPattern({ name, description: line(doc.description, 200), sections: patternLibrary().strip(normalized), siteId, userId });
      return { ref: `pattern:${p}`, kind: "section", name };
    }
    const c = pagesLib().createComponent(ctx, { name, section: normalized[0], siteId, kind: "standard" });
    return { ref: `comp:${c.id}`, kind: "component", name: c.name };
  });
  return { ...out, warnings: analysis.warnings, renamed: name !== nm };
}

// ---------- Secteurs administrables (ceux de l'organisation ; les officiels sont en lecture seule) ----------
function addSector(ctx, { label, familySlug = "", familyLabel = "", userId = null }) {
  const lb = line(label, 60); if (!lb) throw new UserError("Donnez un nom au secteur.");
  const all = catalog.sectorRows(ctx, { all: true });
  if (all.filter((s) => !s.official).length >= MAX_CUSTOM_SECTORS) throw new UserError(`${MAX_CUSTOM_SECTORS} secteurs personnalisés au plus.`);
  let fam = all.find((s) => s.familySlug === familySlug);
  if (!fam) {
    const fl = line(familyLabel, 60); if (!fl) throw new UserError("Choisissez une famille existante, ou donnez le nom d'une nouvelle famille.");
    const fs = `perso-${slugify(fl)}`; fam = all.find((s) => s.familySlug === fs) || { familySlug: fs, familyLabel: fl };
  }
  let slug = slugify(lb) || "secteur", n = 2; const used = new Set(all.map((s) => s.slug));
  while (used.has(slug)) slug = `${slugify(lb).slice(0, 36)}-${n++}`;
  if (all.some((s) => s.label.toLowerCase() === lb.toLowerCase() && s.familySlug === fam.familySlug)) throw new UserError("Ce secteur existe déjà dans cette famille.");
  const pos = Math.max(0, ...all.filter((s) => s.familySlug === fam.familySlug).map((s) => 0)) + 100;
  const r = ctx.db.prepare("INSERT INTO cms_template_sectors (organization_id, slug, label, family_slug, family_label, position, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)").run(ctx.organizationId, slug, lb, fam.familySlug, fam.familyLabel, pos, userId);
  return { id: Number(r.lastInsertRowid), slug, label: lb, familySlug: fam.familySlug, familyLabel: fam.familyLabel };
}
function ownSector(ctx, id) {
  const row = Number.isInteger(id) ? ctx.db.prepare("SELECT * FROM cms_template_sectors WHERE id = ?").get(id) : null;
  if (!row) throw new UserError("Secteur introuvable.");
  if (row.organization_id === null) throw new UserError("Les secteurs officiels Kolakisa ne sont pas modifiables : ajoutez plutôt un secteur personnalisé.");
  if (row.organization_id !== ctx.organizationId) throw new UserError("Secteur introuvable.");
  return row;
}
function updateSector(ctx, { id, label, active }) {
  const row = ownSector(ctx, id);
  const sets = [], params = [];
  if (label !== undefined) { const lb = line(label, 60); if (!lb) throw new UserError("Donnez un nom au secteur."); sets.push("label = ?"); params.push(lb); }
  if (active !== undefined) { sets.push("active = ?"); params.push(active ? 1 : 0); }
  if (!sets.length) throw new UserError("Rien à modifier.");
  ctx.db.prepare(`UPDATE cms_template_sectors SET ${sets.join(", ")} WHERE id = ?`).run(...params, row.id);
  return { id: row.id };
}
function deleteSector(ctx, { id }) {
  const row = ownSector(ctx, id);
  const used = ctx.db.prepare("SELECT COUNT(*) n FROM mk_page_templates WHERE organization_id = ? AND sectors LIKE ?").get(ctx.organizationId, `%"${row.slug}"%`).n;
  if (used) throw new UserError(`Ce secteur classe ${used} modèle(s) : désactivez-le plutôt que de le supprimer.`);
  ctx.db.prepare("DELETE FROM cms_template_sectors WHERE id = ?").run(row.id);
  return { id: row.id };
}

module.exports = { FORMAT, FILE_KINDS, normalizeMeta, saveFromPage, updateTemplate, deleteTemplate, exportTemplate, upgradeDocument, importFile, addSector, updateSector, deleteSector, widgetTypesOf, MIGRATIONS };
