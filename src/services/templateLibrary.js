// KOLAKISA CMS → Apparence → Templates : bibliothèque de modèles d'UN site et importation RÉELLE.
// Trois sources, aucun second format : packs de site (pages/sitePacks.js), gabarits de pages intégrés (pages/templates.js) et « Mes modèles » du site (mk_page_templates, privés au site).
// Importer CRÉE des objets natifs du site : pages (sections du Page Builder, brouillon : rien n'est publié), menu (nouveau nom) et BROUILLON de styles (jamais publié). Aucun contenu existant n'est
// remplacé ni supprimé : un nom déjà pris reçoit un numéro. Tout se fait en UNE transaction (échec = rien d'écrit) et avec un jeton d'idempotence : rejouer la même demande retourne le résultat
// obtenu au lieu de créer les pages une seconde fois. Le site est toujours celui que le serveur a vérifié (siteId : entier | null = principal).
const db = require("../config/database");
const { sameScope } = require("./siteScope");
const palettes = require("./stylePalettes");
const { PACKS } = require("../marketing/pages/sitePacks");
const templatesLib = require("../marketing/pages/templates");
const { UserError } = require("../utils/errors");
const { transaction } = require("../marketing/db/tx");

const pagesLib = () => require("../marketing/pages");
const navigation = () => require("./navigation");
const customizer = () => require("./customizer");
const tokensLib = require("../marketing/pages/tokens");
const KEY_RE = /^[A-Za-z0-9_-]{8,64}$/;
const countNodes = (sections) => { let n = 0; const walk = (x) => { if (Array.isArray(x)) x.forEach(walk); else if (x && typeof x === "object") { if (x.type) n += 1; Object.values(x).forEach(walk); } }; walk(sections); return n; };

// ---------- Catalogue ----------
function sectionsOfTemplateKey(ctx, key) { return pagesLib().gabaritSections(ctx, key); }
function packs(ctx) {
  return PACKS.map((p) => {
    const pal = palettes.PALETTES.find((x) => x.key === p.palette);
    const pages = p.pages.map((pg) => { const s = sectionsOfTemplateKey(ctx, pg.template) || []; return { key: pg.key, name: pg.name, sections: s.length, elements: countNodes(s) }; });
    return { ref: `pack:${p.key}`, key: p.key, source: "pack", category: p.category, name: p.name, description: p.description, pages, pageCount: pages.length, elements: pages.reduce((n, x) => n + x.elements, 0), menuItems: p.menu.length,
      style: { palette: p.palette, paletteLabel: pal.label, colors: pal.colors, fonts: p.fonts } };
  });
}
function pageTemplates(ctx) {
  return templatesLib.catalog().map((t) => { const s = sectionsOfTemplateKey(ctx, t.key) || []; return { ref: `page:${t.key}`, key: t.key, source: "page", category: t.category, name: t.name, description: t.description, pages: [{ key: "page", name: t.name, sections: s.length, elements: countNodes(s) }], pageCount: 1, elements: countNodes(s) }; });
}
function mine(ctx, siteId) {
  // listPageTemplates ne retourne que les modèles PRIVÉS de ce site et les anciens modèles communs (hérités d'avant l'isolation, visibles partout comme dans le Page Builder)
  return pagesLib().listPageTemplates(ctx, { siteId }).map((t) => { const sections = t.content && Array.isArray(t.content.sections) ? t.content.sections : []; return { ref: `mine:${t.id}`, id: t.id, source: "mine", shared: Boolean(t.shared), category: t.category || "Mes modèles", name: t.name, description: t.description || "", pages: [{ key: "page", name: t.name, sections: sections.length, elements: countNodes(sections) }], pageCount: 1, elements: countNodes(sections) }; });
}
function history(siteId, limit = 12) {
  return db.prepare(`SELECT i.id, i.template_key, i.result, i.created_at, u.username AS by FROM cms_template_imports i LEFT JOIN users u ON u.id = i.created_by WHERE ${sameScope("i.site_id")} ORDER BY i.id DESC LIMIT ?`).all(siteId, limit)
    .map((r) => { let res = {}; try { res = JSON.parse(r.result); } catch { res = {}; } return { id: r.id, ref: r.template_key, at: r.created_at, by: r.by, pages: (res.pages || []).length, menu: Boolean(res.menu), styles: Boolean(res.styles), label: res.label || r.template_key }; });
}
// « Déjà importé » : date du dernier import du même modèle dans CE site
const lastImport = (siteId, ref) => (db.prepare(`SELECT created_at FROM cms_template_imports WHERE ${sameScope("site_id")} AND template_key = ? ORDER BY id DESC LIMIT 1`).get(siteId, ref) || {}).created_at || null;

// ---------- Sections d'un modèle (aperçu) ----------
function parseRef(ref) {
  const m = /^(pack|page|mine):([a-z0-9-]{1,60}|\d{1,12})$/.exec(String(ref || ""));
  if (!m) throw new UserError("Modèle inconnu.");
  return { kind: m[1], id: m[2] };
}
// Aperçu / contenu d'UNE page du modèle : { label, sections }
function sectionsOf(ctx, siteId, ref, pageKey = null) {
  const { kind, id } = parseRef(ref);
  if (kind === "pack") {
    const p = PACKS.find((x) => x.key === id); if (!p) throw new UserError("Modèle inconnu.");
    const pg = p.pages.find((x) => x.key === (pageKey || p.pages[0].key)); if (!pg) throw new UserError("Page du modèle inconnue.");
    return { label: `${p.name} — ${pg.name}`, sections: sectionsOfTemplateKey(ctx, pg.template) };
  }
  if (kind === "page") { const t = templatesLib.catalog().find((x) => x.key === id); const s = t ? sectionsOfTemplateKey(ctx, id) : null; if (!s) throw new UserError("Modèle inconnu."); return { label: t.name, sections: s }; }
  const t = pagesLib().getPageTemplate(ctx, Number(id), { siteId });
  if (!t) throw new UserError("Modèle introuvable pour ce site.");
  return { label: t.name, sections: t.content.sections };
}

// ---------- Importation ----------
const freeName = (ctx, base, taken) => {
  const root = String(base).slice(0, 110);
  for (let n = 1; n < 500; n += 1) {
    const name = n === 1 ? root : `${root} (${n})`;
    if (!taken.has(name.toLowerCase()) && !ctx.db.prepare("SELECT 1 FROM mk_landing_pages WHERE organization_id = ? AND name = ? COLLATE NOCASE").get(ctx.organizationId, name)) { taken.add(name.toLowerCase()); return name; }
  }
  throw new UserError("Impossible de trouver un nom libre pour une page.");
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
// options : { menu, styles } (booléens demandés) ; can(perm) : droits réels de la personne ; les options sans droit sont REFUSÉES avec un message (jamais ignorées en silence)
function importTemplate(ctx, siteId, { ref, importKey, name = "", menu = false, styles = false, can = () => true, userId = null }) {
  if (!KEY_RE.test(String(importKey || ""))) throw new UserError("Jeton d'importation manquant ou invalide : rechargez la page.");
  const { kind, id } = parseRef(ref);
  if (siteId !== null) pagesLib().requireSite(ctx, siteId, { active: true });
  const again = replay(siteId, importKey, ref); if (again) return again;
  if (menu && !can("navigation.write")) throw new UserError("Vous n'avez pas le droit de créer un menu (navigation.write) : décochez cette option.");
  if (styles && !can("appearance.styles")) throw new UserError("Vous n'avez pas le droit de modifier les styles (appearance.styles) : décochez cette option.");
  if ((menu || styles) && kind !== "pack") throw new UserError("Le menu et les styles ne font partie que des packs de site.");
  const pack = kind === "pack" ? PACKS.find((x) => x.key === id) : null;
  if (kind === "pack" && !pack) throw new UserError("Modèle inconnu.");
  // Le modèle doit exister et être disponible pour CE site AVANT toute écriture
  if (kind === "mine") sectionsOf(ctx, siteId, ref);
  else if (kind === "page" && !templatesLib.catalog().some((x) => x.key === id)) throw new UserError("Modèle inconnu.");

  return transaction(db, () => {
    const taken = new Set(), created = [];
    const specs = pack ? pack.pages.map((p) => ({ key: p.key, name: p.name, template: p.template })) : [{ key: "page", name: String(name || "").trim() || (kind === "page" ? templatesLib.catalog().find((x) => x.key === id).name : sectionsOf(ctx, siteId, ref).label), template: kind === "mine" ? `mine:${id}` : id }];
    for (const s of specs) {
      const pageName = freeName(ctx, s.name, taken);
      const page = pagesLib().createPage(ctx, { name: pageName, siteId, kind: "page", template: s.template });
      created.push({ key: s.key, id: page.id, name: pageName });
    }
    const result = { label: pack ? pack.name : specs[0].name, pages: created, menu: null, styles: false };
    if (pack && menu) {
      const nav = navigation(), m = nav.create({ name: freeMenuName(siteId, `${pack.name} — menu`), siteId, userId });
      for (const k of pack.menu) { const pg = created.find((x) => x.key === k); if (pg) nav.add(m.id, { type: "page", object_id: pg.id }); }
      result.menu = { id: m.id, name: m.name };
    }
    if (pack && styles) {
      const c = customizer(), draft = c.state(ctx, siteId, { can: () => true }).changes;
      const changes = { ...draft, ...palettes.changesFor(pack.palette, siteId), "tokens.fonts.heading": pack.fonts.heading, "tokens.fonts.body": pack.fonts.body };
      c.saveDraft(ctx, siteId, changes, userId, { can });
      result.styles = true;
    }
    db.prepare("INSERT INTO cms_template_imports (site_id, template_key, import_key, result, created_by) VALUES (?, ?, ?, ?, ?)").run(siteId, ref, importKey, JSON.stringify(result), userId);
    return result;
  });
}

module.exports = { KEY_RE, packs, pageTemplates, mine, history, lastImport, sectionsOf, importTemplate, parseRef };
