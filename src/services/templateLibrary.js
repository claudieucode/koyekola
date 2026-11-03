// KOLAKISA CMS → Apparence → Templates : IMPORTATION RÉELLE d'un modèle de la bibliothèque dans UN site (le catalogue, la recherche et l'analyse sont dans templateCatalog.js).
// Cinq types de ressources, aucun second format : site complet (pack), page, section, composant, modèle du Theme Builder. Importer CRÉE des objets natifs du site :
//   pack / page / modèle de thème → pages en BROUILLON (rien n'est publié) ; pack → en plus un menu (nouveau nom) et un BROUILLON de styles (jamais publié) si la personne le demande ;
//   section → sections ajoutées au BROUILLON d'une page choisie (révision vérifiée, jamais d'écrasement) ; composant → nouveau composant du site (jamais branché sur le site public).
// Règles communes : aucun contenu existant n'est remplacé ni supprimé (un nom déjà pris reçoit un numéro) ; analyse AVANT toute écriture (éléments inconnus, droits, formulaires et composants d'un autre
// site : refus nommant la cause ; ressources externes, médias d'un autre site : confirmation explicite) ; UNE transaction (échec = rien d'écrit) ; jeton d'idempotence (rejouer = même résultat) ;
// annulation possible tant que rien n'a été modifié (pages mises à la corbeille, jamais supprimées). Le site est toujours celui que le serveur a vérifié (siteId : entier | null = principal).
const db = require("../config/database");
const { sameScope } = require("./siteScope");
const palettes = require("./stylePalettes");
const { PACKS } = require("../marketing/pages/sitePacks");
const catalog = require("./templateCatalog");
const { UserError } = require("../utils/errors");
const { transaction } = require("../marketing/db/tx");

const pagesLib = () => require("../marketing/pages");
const navigation = () => require("./navigation");
const customizer = () => require("./customizer");
const patternLibrary = () => require("./patternLibrary");
const themeTemplates = () => require("../marketing/pages/themeTemplates");
const KEY_RE = /^[A-Za-z0-9_-]{8,64}$/;

// Erreur détaillée : message lisible + détails structurés pour l'écran (analyse, opérations)
class ImportRefused extends UserError { constructor(message, details = {}, status = 422) { super(message, status); this.name = "ImportRefused"; this.details = details; } }

const parseRef = catalog.parseRef;

// ---------- Packs de site (utilisés aussi par l'assistant de création de site) ----------
// Même forme que l'ancienne liste : { ref, key, name, description, category, pages: [{ key, name, sections, elements }], pageCount, elements, menuItems, style, … }, dans l'ordre du catalogue officiel
function packs(ctx) {
  const order = new Map(PACKS.map((p, i) => [p.key, i]));
  // perPage est plafonné à 48 par le catalogue : on parcourt toutes les pages (la bibliothèque compte 100 packs)
  const items = [];
  for (let page = 1; ; page += 1) { const d = catalog.query(ctx, null, { source: "pack", perPage: 48, page }); items.push(...d.items); if (page >= d.pages || !d.items.length) break; }
  return items.sort((a, b) => order.get(a.key) - order.get(b.key));
}

// ---------- Aperçu : sections d'UNE page du modèle ----------
function sectionsOf(ctx, siteId, ref, pageKey = null) {
  const { kind, id } = parseRef(ref);
  if (kind === "pack") { const first = PACKS.find((x) => x.key === id); const st = catalog.structureOf(ctx, siteId, ref, pageKey || (first && first.pages[0].key)); return { label: st.label, sections: st.pages[0].sections }; }
  const st = catalog.structureOf(ctx, siteId, ref);
  return { label: st.label, sections: st.pages[0].sections };
}

// ---------- Journal ----------
function history(siteId, limit = 12) {
  return db.prepare(`SELECT i.id, i.template_key, i.result, i.created_at, i.undone_at, u.username AS by FROM cms_template_imports i LEFT JOIN users u ON u.id = i.created_by WHERE ${sameScope("i.site_id")} ORDER BY i.id DESC LIMIT ?`).all(siteId, limit)
    .map((r) => { let res = {}; try { res = JSON.parse(r.result); } catch { res = {}; } return { id: r.id, ref: r.template_key, kind: res.kind || "page", at: r.created_at, by: r.by, pages: (res.pages || []).length, menu: Boolean(res.menu), styles: Boolean(res.styles), component: res.component ? res.component.name : null, inserted: res.inserted ? { pageName: res.inserted.pageName, added: res.inserted.added } : null, theme: res.theme ? res.theme.label : null, undone: Boolean(r.undone_at), label: res.label || r.template_key }; });
}
// « Déjà importé » : date du dernier import (non annulé) du même modèle dans CE site
const lastImport = (siteId, ref) => (db.prepare(`SELECT created_at FROM cms_template_imports WHERE ${sameScope("site_id")} AND template_key = ? AND undone_at IS NULL ORDER BY id DESC LIMIT 1`).get(siteId, ref) || {}).created_at || null;

// ---------- Noms libres (jamais de remplacement : un numéro est ajouté) ----------
const freeName = (ctx, base, taken) => {
  const root = String(base).slice(0, 110);
  for (let n = 1; n < 500; n += 1) {
    const name = n === 1 ? root : `${root} (${n})`;
    if (!taken.has(name.toLowerCase()) && !ctx.db.prepare("SELECT 1 FROM mk_landing_pages WHERE organization_id = ? AND name = ? COLLATE NOCASE").get(ctx.organizationId, name)) { taken.add(name.toLowerCase()); return name; }
  }
  throw new UserError("Impossible de trouver un nom libre pour une page.");
};
const freeComponentName = (ctx, base) => {
  const root = String(base).slice(0, 70);
  for (let n = 1; n < 500; n += 1) { const name = n === 1 ? root : `${root} (${n})`; if (!ctx.db.prepare("SELECT 1 FROM mk_web_components WHERE organization_id = ? AND name = ? COLLATE NOCASE").get(ctx.organizationId, name)) return name; }
  throw new UserError("Impossible de trouver un nom libre pour un composant.");
};
const freeMenuName = (siteId, base) => {
  for (let n = 1; n < 100; n += 1) { const name = (n === 1 ? base : `${base} (${n})`).slice(0, 80); if (!db.prepare(`SELECT 1 FROM nav_menus WHERE ${sameScope("site_id")} AND name = ? COLLATE NOCASE`).get(siteId, name)) return name; }
  throw new UserError("Impossible de trouver un nom libre pour le menu.");
};
function replay(siteId, importKey, ref) {
  const row = db.prepare(`SELECT template_key, result FROM cms_template_imports WHERE ${sameScope("site_id")} AND import_key = ?`).get(siteId, importKey);
  if (!row) return null;
  if (row.template_key !== ref) throw new UserError("Ce jeton d'importation a déjà servi pour un autre modèle : rechargez la page.");
  return { ...JSON.parse(row.result), replay: true };
}

// ---------- Options valables pour chaque type ----------
function checkOptions(kind, resource, o, can) {
  if ((o.menu || o.styles) && kind !== "pack") throw new UserError("Le menu et les styles ne font partie que des packs de site.");
  if (o.assign && resource !== "part") throw new UserError("L'affectation à une famille de pages ne concerne que les modèles du Theme Builder.");
  if (o.menu && !can("navigation.write")) throw new UserError("Vous n'avez pas le droit de créer un menu (navigation.write) : décochez cette option.");
  if (o.styles && !can("appearance.styles")) throw new UserError("Vous n'avez pas le droit de modifier les styles (appearance.styles) : décochez cette option.");
  if (o.assign && !can("appearance.templates")) throw new UserError("Vous n'avez pas le droit d'affecter un modèle de thème (appearance.templates) : décochez cette option.");
  if (resource === "section") {
    if (!Number.isInteger(o.pageId) || o.pageId < 1) throw new UserError("Choisissez la page où insérer cette section.");
    if (!["start", "end", "after"].includes(o.position || "end")) throw new UserError("Position inconnue.");
  }
}
const pageIdOf = (v) => (v === null || v === undefined || v === "" ? null : Number(v));

// ---------- Plan : ce que l'importation ferait (aucune écriture) ----------
function plan(ctx, siteId, { ref, name = "", menu = false, styles = false, assign = false, pageId = null, position = "end", after = null, can = () => true }) {
  const { kind, id, resource } = parseRef(ref);
  if (siteId !== null) pagesLib().requireSite(ctx, siteId, { active: true });
  checkOptions(kind, resource, { menu, styles, assign, pageId: pageIdOf(pageId), position }, can);
  const analysis = catalog.analyzeRef(ctx, siteId, ref, { can });
  const st = analysis.structure, operations = [], conflicts = [], taken = new Set();
  const pageOp = (requested) => { const resolved = freeName(ctx, requested, taken); if (resolved !== requested) conflicts.push({ type: "page", requested, resolved }); return resolved; };
  if (kind === "pack") {
    for (const p of st.pages) operations.push({ op: "create_page", name: pageOp(p.name), sections: p.sections.length });
    const pack = PACKS.find((x) => x.key === id);
    if (menu) { const mn = freeMenuName(siteId, `${pack.name} — menu`); operations.push({ op: "create_menu", name: mn }); if (!navigation().assignments({ siteId }).header) operations.push({ op: "assign_menu", name: mn, location: "header" }); }
    if (styles) operations.push({ op: "draft_styles", palette: palettes.PALETTES.find((x) => x.key === pack.palette).label, fonts: pack.fonts });
  } else if (resource === "page" || resource === "part") {
    const requested = String(name || "").trim() || st.label;
    operations.push({ op: "create_page", name: pageOp(requested), sections: st.pages[0].sections.length });
    if (assign) {
      const type = st.themeType;
      const dup = themeTemplates().list(ctx).find((t) => t.type === type && !t.category && !t.tag && !t.postId && !t.audience);
      if (dup) throw new ImportRefused(`Un modèle de thème « ${dup.typeLabel} » existe déjà (page « ${dup.pageName} ») : retirez-le d'abord, ou importez sans l'affecter.`, { code: "theme_conflict" });
      operations.push({ op: "assign_theme", type, scope: "organisation" });
    }
  } else if (resource === "section") {
    const page = pagesLib().getPage(ctx, pageIdOf(pageId));
    if (!page || page.archived_at || page.kind === "step" || (page.site_id ?? null) !== (siteId ?? null)) throw new UserError("Page introuvable pour ce site.");
    operations.push({ op: "insert_sections", pageId: page.id, pageName: page.name, count: st.pages[0].sections.length, position: position === "after" ? `après la section ${Number(after) + 1}` : position === "start" ? "au début" : "à la fin" });
  } else {
    const requested = String(name || "").trim() || st.label;
    const resolved = freeComponentName(ctx, requested);
    if (resolved !== requested) conflicts.push({ type: "component", requested, resolved });
    operations.push({ op: "create_component", name: resolved });
  }
  const impact = [...(menu ? ["menu"] : []), ...(styles ? ["styles"] : []), ...(assign ? ["theme"] : [])];
  const { structure: _s, ...a } = analysis;
  // Opération à fort impact : une affectation de modèle de thème vaut pour TOUTE l'organisation (limite D2 du Theme Builder) → confirmation explicite
  if (assign) a.warnings = [...a.warnings, { code: "theme_scope", message: "Affecter ce modèle de thème s'applique à toute l'organisation (pas seulement à ce site) dès que la page est publiée." }];
  return { ref, kind, resource, label: st.label, operations, conflicts, impact, analysis: a, needsConfirm: a.warnings.length > 0, canImport: a.blockers.length === 0 };
}

// ---------- Importation ----------
// options : { menu, styles, assign } (booléens demandés) ; can(perm) : droits réels de la personne ; les options sans droit sont REFUSÉES avec un message (jamais ignorées en silence)
function importTemplate(ctx, siteId, { ref, importKey, name = "", menu = false, styles = false, assign = false, pageId = null, position = "end", after = null, confirm = false, can = () => true, userId = null }) {
  if (!KEY_RE.test(String(importKey || ""))) throw new UserError("Jeton d'importation manquant ou invalide : rechargez la page.");
  const { kind, id, resource } = parseRef(ref);
  if (siteId !== null) pagesLib().requireSite(ctx, siteId, { active: true });
  const again = replay(siteId, importKey, ref); if (again) return again;
  // Le modèle doit exister, être disponible pour CE site et compatible AVANT toute écriture
  const planned = plan(ctx, siteId, { ref, name, menu, styles, assign, pageId, position, after, can });
  if (!planned.canImport) throw new ImportRefused(`Importation impossible : ${planned.analysis.blockers.map((b) => b.message).join(" ")}`, { analysis: planned.analysis, code: "blocked" });
  if (planned.needsConfirm && confirm !== true) throw new ImportRefused("Cette importation demande votre confirmation : lisez les avertissements puis confirmez.", { analysis: planned.analysis, operations: planned.operations, code: "confirm_required" }, 409);
  const st = catalog.structureOf(ctx, siteId, ref);

  return transaction(db, () => {
    const taken = new Set(), created = [];
    const result = { kind: resource, label: st.label, pages: created, menu: null, styles: false, component: null, inserted: null, theme: null };
    const makePage = (pageName, spec) => {
      const page = pagesLib().createPage(ctx, { name: freeName(ctx, pageName, taken), siteId, kind: "page", ...spec });
      const row = ctx.db.prepare("SELECT revision FROM mk_landing_pages WHERE id = ?").get(page.id);
      return { id: page.id, name: page.name, revision: row.revision };
    };
    if (kind === "pack") {
      const pack = PACKS.find((x) => x.key === id);
      for (const p of pack.pages) { const pg = makePage(p.name, { template: p.template }); created.push({ key: p.key, id: pg.id, name: pg.name, revision: pg.revision }); }
      result.label = pack.name;
      if (menu) {
        const nav = navigation(), m = nav.create({ name: freeMenuName(siteId, `${pack.name} — menu`), siteId, userId });
        for (const k of pack.menu) { const pg = created.find((x) => x.key === k); if (pg) nav.add(m.id, { type: "page", object_id: pg.id }); }
        result.menu = { id: m.id, name: m.name };
        // Affectation EXPLICITE et persistante : le menu du pack devient celui de l'en-tête du site s'il n'en a pas encore (jamais en remplaçant un menu déjà affecté). Il reste en brouillon tant que ses pages ne sont pas publiées :
        // l'emplacement n'affiche rien avant la publication du menu (Apparence → Menus).
        if (!nav.assignments({ siteId }).header) { nav.assign("header", m.id, { siteId }); result.menu.assigned = ["header"]; }
      }
      if (styles) {
        const c = customizer(), draft = c.state(ctx, siteId, { can: () => true }).changes;
        const changes = { ...draft, ...palettes.changesFor(pack.palette, siteId), "tokens.fonts.heading": pack.fonts.heading, "tokens.fonts.body": pack.fonts.body };
        c.saveDraft(ctx, siteId, changes, userId, { can });
        result.styles = true;
      }
    } else if (resource === "page") {
      const pg = makePage(String(name || "").trim() || st.label, { template: kind === "mine" ? `mine:${id}` : id }); created.push({ key: "page", id: pg.id, name: pg.name, revision: pg.revision });
    } else if (resource === "part") {
      const pg = makePage(String(name || "").trim() || st.label, { sections: st.pages[0].sections }); created.push({ key: "page", id: pg.id, name: pg.name, revision: pg.revision });
      if (assign) { const entry = themeTemplates().add(ctx, { type: st.themeType, pageId: pg.id }); result.theme = { id: entry.id, type: st.themeType, label: themeTemplates().list(ctx).find((t) => t.id === entry.id)?.typeLabel || st.themeType }; }
    } else if (resource === "section") {
      const out = patternLibrary().insert(ctx, siteId, { ref: kind === "section" ? `builtin:${id}` : `mine:${id}`, pageId: pageIdOf(pageId), position, after });
      const page = pagesLib().getPage(ctx, out.pageId);
      result.inserted = { pageId: out.pageId, pageName: out.pageName, added: out.added, at: out.at, revision: out.revision, ids: page.working.sections.slice(out.at, out.at + out.added).map((s) => s.id) };
    } else {
      const comp = pagesLib().createComponent(ctx, { name: freeComponentName(ctx, String(name || "").trim() || st.label), section: st.pages[0].sections[0], siteId, kind: "standard" });
      result.component = { id: comp.id, name: comp.name };
    }
    db.prepare("INSERT INTO cms_template_imports (site_id, template_key, import_key, result, created_by) VALUES (?, ?, ?, ?, ?)").run(siteId, ref, importKey, JSON.stringify(result), userId);
    return result;
  });
}

// ---------- Annulation ----------
// Retire ce que l'import a créé, à CONDITION que rien n'ait été modifié depuis (tout ou rien) : pages non modifiées ni publiées → corbeille (restaurables), sections insérées → retirées si la page n'a pas
// changé depuis, composant → supprimé s'il n'est utilisé nulle part, menu → supprimé. Le brouillon de styles d'un pack n'est PAS revenu en arrière (à abandonner dans Styles).
function undoImport(ctx, siteId, { id, can = () => true, userId = null }) {
  if (siteId !== null) pagesLib().requireSite(ctx, siteId, { active: true });
  const row = Number.isInteger(id) ? db.prepare(`SELECT * FROM cms_template_imports WHERE id = ? AND ${sameScope("site_id")}`).get(id, siteId) : null;
  if (!row) throw new UserError("Importation introuvable pour ce site.");
  if (row.undone_at) throw new UserError("Cette importation a déjà été annulée.");
  let res = {}; try { res = JSON.parse(row.result); } catch { res = {}; }
  if (res.menu && !can("navigation.delete")) throw new UserError("Annuler un import qui a créé un menu demande le droit de supprimer un menu (navigation.delete).");
  const problems = [];
  for (const p of res.pages || []) {
    const page = pagesLib().getPage(ctx, p.id);
    if (!page || page.archived_at) { problems.push(`la page « ${p.name} » n'existe plus ou est déjà à la corbeille`); continue; }
    if (page.status !== "draft" || page.published_at || page.scheduled_at) problems.push(`la page « ${page.name} » a été publiée ou programmée`);
    else if (Number.isInteger(p.revision) && page.revision !== p.revision) problems.push(`la page « ${page.name} » a été modifiée depuis l'import`);
  }
  if (res.inserted) {
    const page = pagesLib().getPage(ctx, res.inserted.pageId);
    if (!page || page.archived_at) problems.push(`la page « ${res.inserted.pageName} » n'est plus disponible`);
    else if (page.revision !== res.inserted.revision) problems.push(`la page « ${page.name} » a été modifiée depuis l'insertion`);
  }
  if (res.theme) problems.push("le modèle est affecté à une famille de pages du site : retirez d'abord cette affectation (Apparence → Modèles de thème)");
  if (problems.length) throw new ImportRefused(`Annulation impossible, rien n'a été changé : ${problems.join(" ; ")}.`, { problems, code: "undo_refused" }, 409);
  return transaction(db, () => {
    for (const p of res.pages || []) pagesLib().archivePage(ctx, p.id);
    if (res.inserted) {
      const page = pagesLib().getPage(ctx, res.inserted.pageId), ids = new Set(res.inserted.ids || []);
      pagesLib().saveDraft(ctx, page.id, { sections: page.working.sections.filter((s) => !ids.has(s.id)), theme: page.working.theme, title: page.working.title, description: page.working.description, seo: page.working.seo }, { revision: page.revision });
    }
    if (res.component) pagesLib().deleteComponent(ctx, res.component.id);
    if (res.menu) navigation().remove(res.menu.id);
    db.prepare("UPDATE cms_template_imports SET undone_at = datetime('now'), undone_by = ? WHERE id = ?").run(userId, row.id);
    return { id: row.id, label: res.label, pages: (res.pages || []).length, menu: Boolean(res.menu), sections: res.inserted ? res.inserted.added : 0, component: Boolean(res.component), stylesKept: Boolean(res.styles) };
  });
}

module.exports = { KEY_RE, ImportRefused, packs, history, lastImport, sectionsOf, plan, importTemplate, undoImport, parseRef };
