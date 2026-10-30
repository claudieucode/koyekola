// KOLAKISA CMS → Apparence → Templates (programme 20.4) : CATALOGUE unifié de la bibliothèque de modèles.
// Aucun second moteur ni second format : tout modèle est une liste de VRAIES sections du Page Builder (pages/sections.js, pages/nodes.js).
// Cinq types de ressources, une seule référence texte « <préfixe>:<clé ou identifiant> » :
//   site       pack:<clé>       packs officiels (pages/sitePacks.js : pages + menu + brouillon de styles)
//   page       page:<clé>       gabarits de page officiels (pages/templates.js)      mine:<id>   « Mes modèles » de pages (mk_page_templates)
//   section    section:<clé>    compositions officielles (pages/patterns.js)         pattern:<id> compositions du site (appearance_patterns)
//   component  component:<clé>  composants officiels (pages/libraryComponents.js)    comp:<id>    composants du site (mk_web_components)
//   part       part:<clé>       modèles du Theme Builder officiels (pages/libraryParts.js)
// Origine : « official » (code livré, jamais modifiable ici), « site » (réservé au site qui l'a créé), « organization » (partagé explicitement avec les sites de l'organisation).
// Le site de la requête (siteId : entier | null = principal) vient TOUJOURS du serveur ; aucune lecture n'est faite hors de ce site (sauf modèles explicitement partagés de l'organisation).
const db = require("../config/database");
const { PACKS } = require("../marketing/pages/sitePacks");
const templatesLib = require("../marketing/pages/templates");
const patternsLib = require("../marketing/pages/patterns");
const componentsLib = require("../marketing/pages/libraryComponents");
const partsLib = require("../marketing/pages/libraryParts");
const meta = require("../marketing/pages/libraryMeta");
const nodes = require("../marketing/pages/nodes");
const sectionsLib = require("../marketing/pages/sections");
const palettes = require("./stylePalettes");
const { listCourses } = require("../marketing/bridge/catalog");
const { UserError } = require("../utils/errors");

const pagesLib = () => require("../marketing/pages");
const appearance = () => require("./appearance");
const patternLibrary = () => require("./patternLibrary");

const FORMAT_VERSION = 1; // version du format de modèle (docs/KOLAKISA_TEMPLATE_COMPATIBILITY.md)
const KINDS = Object.freeze({ site: "Site complet", page: "Page", section: "Section", component: "Composant", part: "Modèle de thème" });
const SOURCES = Object.freeze({ pack: "site", page: "page", section: "section", component: "component", part: "part", mine: null });
const PREFIX_KIND = Object.freeze({ pack: "site", page: "page", mine: "page", section: "section", pattern: "section", component: "component", comp: "component", part: "part" });
const REF_RE = /^(pack|page|mine|section|pattern|component|comp|part):([a-z0-9-]{1,60}|\d{1,12})$/;
const SORTS = Object.freeze(["relevance", "recent", "alpha", "used"]);
const MAX_PER_PAGE = 48, DEFAULT_PER_PAGE = 12;
const LICENSE = "Contenu Kolakisa original (structure et textes de consigne), distribué avec le produit. Aucune image, police ni ressource tierce n'est embarquée : les visuels se choisissent dans la médiathèque du site.";

const norm = (s) => String(s ?? "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, " ").trim();
const parseJson = (t, fallback) => { try { const v = JSON.parse(t); return v ?? fallback; } catch { return fallback; } };
const countNodes = (sections) => { let n = 0; const walk = (x) => { if (Array.isArray(x)) x.forEach(walk); else if (x && typeof x === "object") { if (x.type) n += 1; Object.values(x).forEach(walk); } }; walk(sections); return n; };

function parseRef(ref) {
  const m = REF_RE.exec(String(ref ?? ""));
  if (!m) throw new UserError("Modèle inconnu.");
  return { kind: m[1], id: m[2], resource: PREFIX_KIND[m[1]] };
}

// ---------- Taxonomie des secteurs (cms_template_sectors : officiels + ceux de l'organisation) ----------
function sectorRows(ctx, { all = false } = {}) {
  return ctx.db.prepare(`SELECT id, organization_id, slug, label, family_slug, family_label, position, active FROM cms_template_sectors WHERE (organization_id IS NULL OR organization_id = ?)${all ? "" : " AND active = 1"} ORDER BY family_label COLLATE NOCASE, position, label COLLATE NOCASE`)
    .all(ctx.organizationId).map((r) => ({ id: r.id, slug: r.slug, label: r.label, familySlug: r.family_slug, familyLabel: r.family_label, active: Boolean(r.active), official: r.organization_id === null }));
}
const sectorMap = (ctx) => new Map(sectorRows(ctx, { all: true }).map((s) => [s.slug, s]));
// Familles → secteurs (pour les filtres)
function families(ctx) {
  const out = new Map();
  for (const s of sectorRows(ctx)) { if (!out.has(s.familySlug)) out.set(s.familySlug, { slug: s.familySlug, label: s.familyLabel, sectors: [] }); out.get(s.familySlug).sectors.push(s); }
  return [...out.values()];
}

// ---------- Entrées (résumés légers : aucune section construite ici) ----------
const base = (e) => ({ language: "fr", formatVersion: FORMAT_VERSION, version: 1, usage: 0, ...e });
function officialEntries(ctx) {
  const out = [];
  const add = (prefix, key, e) => {
    const mt = meta.metaOf(`${prefix}:${key}`) || { sectors: [], siteType: "", keywords: [], since: "2026-10-18" };
    out.push(base({ ref: `${prefix}:${key}`, key, kind: PREFIX_KIND[prefix], source: prefix, origin: "official", sectorKeys: mt.sectors, siteType: mt.siteType, keywords: mt.keywords, updatedAt: mt.since, ...e }));
  };
  for (const p of PACKS) add("pack", p.key, { name: p.name, category: p.category, description: p.description });
  for (const t of templatesLib.catalog()) add("page", t.key, { name: t.name, category: t.category, description: t.description });
  const hasCourses = listCourses(ctx).length > 0;
  for (const p of patternsLib.PATTERNS) if (p.requires !== "courses" || hasCourses) add("section", p.key, { name: p.label, category: p.category, description: "" });
  for (const c of componentsLib.catalog()) add("component", c.key, { name: c.name, category: c.category, description: c.description, role: c.role });
  for (const p of partsLib.catalog()) add("part", p.key, { name: p.name, category: p.category, description: p.description, themeType: p.themeType });
  return out;
}
// Les modèles du site : (1) pages (« Mes modèles »), (2) compositions du site, (3) composants du site ou partagés. Jamais ceux d'un autre site.
function mineEntries(ctx, siteId) {
  const out = [];
  for (const t of pagesLib().listPageTemplates(ctx, { siteId })) {
    out.push(base({ ref: `mine:${t.id}`, id: t.id, key: String(t.id), kind: "page", source: "mine", origin: t.shared ? "organization" : "site", name: t.name, category: t.category, description: t.description,
      sectorKeys: t.sectors, siteType: t.siteType, keywords: t.keywords, language: t.language, formatVersion: t.formatVersion, version: t.version, updatedAt: t.updatedAt, siteId: t.siteId, ownSite: (t.siteId ?? null) === (siteId ?? null) }));
  }
  for (const p of appearance().patternRows(siteId)) {
    out.push(base({ ref: `pattern:${p.id}`, id: p.id, key: String(p.id), kind: "section", source: "mine", origin: "site", name: p.name, category: p.category || "Mes compositions", description: p.description || "", sectorKeys: [], siteType: "", keywords: [], updatedAt: String(p.created_at || "").slice(0, 10), siteId, ownSite: true }));
  }
  for (const c of pagesLib().listComponents(ctx, { siteId })) {
    if (!c.section || c.variant_of) continue;
    out.push(base({ ref: `comp:${c.id}`, id: c.id, key: String(c.id), kind: "component", source: "mine", origin: c.site_id === null ? "organization" : "site", name: c.name, category: c.kind === "global" ? "Composants globaux" : "Mes composants", description: "",
      sectorKeys: [], siteType: "", keywords: [], version: c.version || 1, updatedAt: String(c.updated_at || c.created_at || "").slice(0, 10), siteId: c.site_id, ownSite: c.site_id === siteId }));
  }
  return out;
}
// Import(s) par modèle : nombre RÉEL de fois que le modèle a été importé dans les sites de l'organisation (annulations exclues). Aucune valeur inventée.
function usageMap(ctx) {
  const rows = ctx.db.prepare("SELECT template_key AS k, COUNT(*) n FROM cms_template_imports WHERE undone_at IS NULL AND (site_id IS NULL OR site_id IN (SELECT id FROM mk_sites WHERE organization_id = ?)) GROUP BY template_key").all(ctx.organizationId);
  return new Map(rows.map((r) => [r.k, r.n]));
}

// ---------- Structure d'un modèle (sections réelles, copies profondes) ----------
// pack → { pages: [{ key, name, sections }] } ; les autres : une seule « page »
function structureOf(ctx, siteId, ref, pageKey = null) {
  const { kind, id } = parseRef(ref);
  const fresh = (list) => sectionsLib.normalizeSections(ctx, list.map((s) => ({ ...s, id: sectionsLib.newSectionId() })));
  if (kind === "pack") {
    const p = PACKS.find((x) => x.key === id); if (!p) throw new UserError("Modèle inconnu.");
    const pages = p.pages.map((pg) => ({ key: pg.key, name: pg.name, template: pg.template }));
    if (pageKey !== null) {
      const pg = pages.find((x) => x.key === pageKey); if (!pg) throw new UserError("Page du modèle inconnue.");
      return { label: `${p.name} — ${pg.name}`, pages: [{ ...pg, sections: pagesLib().gabaritSections(ctx, pg.template) }] };
    }
    return { label: p.name, pages: pages.map((pg) => ({ ...pg, sections: pagesLib().gabaritSections(ctx, pg.template) || [] })) };
  }
  if (kind === "page") { const t = templatesLib.catalog().find((x) => x.key === id); const s = t ? pagesLib().gabaritSections(ctx, id) : null; if (!s) throw new UserError("Modèle inconnu."); return { label: t.name, pages: [{ key: "page", name: t.name, sections: s }] }; }
  if (kind === "mine") { const t = pagesLib().getPageTemplate(ctx, Number(id), { siteId }); if (!t) throw new UserError("Modèle introuvable pour ce site."); return { label: t.name, pages: [{ key: "page", name: t.name, sections: t.content.sections }], template: t }; }
  if (kind === "section" || kind === "pattern") {
    const { label, sections } = patternLibrary().sectionsOf(ctx, siteId, kind === "section" ? `builtin:${id}` : `mine:${id}`);
    return { label, pages: [{ key: "section", name: label, sections }] };
  }
  if (kind === "component") { const c = componentsLib.COMPONENTS.find((x) => x.key === id); if (!c) throw new UserError("Modèle inconnu."); return { label: c.name, pages: [{ key: "component", name: c.name, sections: fresh([componentsLib.buildComponent(id)]) }] }; }
  if (kind === "comp") {
    const c = pagesLib().getComponent(ctx, Number(id));
    if (!c || !c.section || (c.site_id !== null && c.site_id !== siteId)) throw new UserError("Composant introuvable pour ce site.");
    return { label: c.name, pages: [{ key: "component", name: c.name, sections: [c.section] }], component: c };
  }
  const part = partsLib.PARTS.find((x) => x.key === id); if (!part) throw new UserError("Modèle inconnu.");
  return { label: part.name, themeType: part.themeType, pages: [{ key: "part", name: part.name, sections: fresh(partsLib.buildPart(id)) }] };
}

// Élément de remplacement possible pour un type inconnu : un type du registre dont le nom contient (ou est contenu dans) celui du modèle, sinon à très faible distance d'édition. Rien n'est remplacé automatiquement.
function closestWidget(type) {
  const t = String(type).toLowerCase(), keys = Object.keys(nodes.NODE_TYPES);
  const lev = (a, b) => { const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]); for (let j = 1; j <= b.length; j += 1) d[0][j] = j; for (let i = 1; i <= a.length; i += 1) for (let j = 1; j <= b.length; j += 1) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)); return d[a.length][b.length]; };
  const part = keys.filter((k) => k.length >= 4 && (t.includes(k) || k.includes(t))).sort((a, b) => a.length - b.length)[0];
  const found = part || keys.map((k) => [k, lev(t, k)]).filter(([, d]) => d <= 2).sort((a, b) => a[1] - b[1])[0]?.[0];
  return found ? { type: found, label: nodes.NODE_TYPES[found].label } : null;
}

// ---------- Analyse de compatibilité (aucune écriture) ----------
// blockers : l'importation est refusée ; warnings : l'importation exige une confirmation explicite ; notes : information (rien à confirmer).
const URL_KEYS = /^(src|image|logo|poster|background|embed|iframe|video|audio|thumbnail)/i;
function analyze(ctx, siteId, sections, { can = () => true, originSiteId = siteId, themeType = null } = {}) {
  const widgets = new Map(), blockers = [], warnings = [], notes = [];
  const forms = new Set(), components = new Set(), external = new Set(), uploads = new Set();
  let needsCourses = false, needsBlog = false, needsForm = false, needsShop = false;
  const label = (type) => (nodes.NODE_TYPES[type] && nodes.NODE_TYPES[type].label) || (sectionsLib.TYPES[type] && sectionsLib.TYPES[type].label) || null;
  const scan = (value, key, ownerType) => {
    if (typeof value === "string") {
      if (/^\/uploads\//.test(value) || /\/uploads\/[^\s"']+/.test(value) && URL_KEYS.test(key || "")) uploads.add(value.slice(0, 120));
      const m = /^https:\/\/([^\s/"'<>]+)/i.exec(value);
      if (m && (URL_KEYS.test(key || "") || ["embed", "html", "video", "audio", "map"].includes(ownerType))) external.add(m[1].toLowerCase());
    } else if (Array.isArray(value)) value.forEach((v) => scan(v, key, ownerType));
    else if (value && typeof value === "object") for (const [k, v] of Object.entries(value)) if (k !== "children") scan(v, k, ownerType);
  };
  const visit = (n, top) => {
    if (!n || typeof n !== "object") return;
    const type = String(n.type || "");
    if (type) {
      const lb = label(type);
      if (!lb) {
        const near = closestWidget(type);
        blockers.push({ code: "unknown_widget", widget: type, ...(near ? { replacement: near.type } : {}), message: `Élément « ${type} » inconnu de cette version de Kolakisa (widget retiré ou jamais installé) : le modèle ne peut pas être importé tel quel.${near ? ` Élément proche disponible : « ${near.label} » — remplacez-le dans l'éditeur du site d'origine, puis réenregistrez le modèle.` : " Remplacez-le dans l'éditeur du site d'origine, ou installez l'extension qui le fournit."}` });
      }
      else { const w = widgets.get(type) || { type, label: lb, count: 0, requires: (nodes.WIDGETS[type] && nodes.WIDGETS[type][2]) || null }; w.count += 1; widgets.set(type, w); }
      if (["course", "courselist"].includes(type)) needsCourses = true;
      if (["posts", "postcontent", "querylist", "postmeta", "archiveinfo", "authorbox", "postnav", "postcomments", "catfilter"].includes(type) || (n.props && n.props.loop && n.props.loop.source === "posts")) needsBlog = true;
      if (type === "form" || type === "signupform") { if (n.formId || (n.props && n.props.formId)) forms.add(Number(n.formId || n.props.formId)); else needsForm = true; }
      if (type === "component" && Number.isInteger(n.componentId)) components.add(n.componentId);
      if (type === "course" && Number.isInteger(n.courseId)) needsCourses = true;
      scan({ ...n, children: undefined }, "", type);
    }
    if (Array.isArray(n.children)) n.children.forEach((c) => visit(c, false));
    void top;
  };
  (Array.isArray(sections) ? sections : []).forEach((s) => visit(s, true));

  // Droits sur les widgets réservés (ex. « HTML » : pages.code) — la même règle que l'éditeur
  try { nodes.lockedWidgetChanges([], sections, can); } catch (e) { blockers.push({ code: "forbidden_widget", message: e.message }); }
  // Formulaires et composants cités : doivent exister ET être utilisables dans le site de destination (jamais ceux d'un autre site)
  for (const id of forms) {
    const f = ctx.db.prepare("SELECT site_id FROM mk_forms WHERE id = ? AND organization_id = ?").get(id, ctx.organizationId);
    if (!f || (f.site_id ?? null) !== (siteId ?? null)) blockers.push({ code: "foreign_form", message: `Le formulaire n° ${id} cité par le modèle n'existe pas dans ce site : il ne peut pas être importé (choisissez le formulaire après l'import depuis un modèle sans formulaire fixé).` });
  }
  for (const id of components) {
    const c = ctx.db.prepare("SELECT site_id FROM mk_web_components WHERE id = ? AND organization_id = ?").get(id, ctx.organizationId);
    if (!c || (c.site_id !== null && c.site_id !== (siteId ?? null))) blockers.push({ code: "foreign_component", message: `Le composant n° ${id} cité par le modèle n'est pas disponible dans ce site.` });
  }
  if (uploads.size && (originSiteId ?? null) !== (siteId ?? null)) warnings.push({ code: "foreign_media", message: `Le modèle cite ${uploads.size} fichier(s) de la médiathèque d'un autre site : ils seront affichés tels quels tant que vous ne les remplacez pas (ils ne sont pas copiés).` });
  if (external.size) warnings.push({ code: "external_resources", message: `Le modèle charge des ressources externes depuis : ${[...external].sort().join(", ")}. Vérifiez qu'elles sont autorisées et conformes à votre politique de confidentialité.` });
  if (needsCourses && listCourses(ctx).length === 0) warnings.push({ code: "no_courses", message: "Le modèle affiche des formations, mais aucune formation n'est publiée : la zone restera vide jusqu'à la première publication." });
  // Éléments de boutique (Programme 20.5) : ils lisent la boutique du SITE DE DESTINATION ; sans module « Commerce » ou boutique ouverte, ils n'affichent rien au public
  const shopTypes = [...widgets.keys()].filter((t) => /^shop/.test(t));
  if (shopTypes.length) {
    needsShop = true;
    try {
      const siteId2 = siteId ?? null;
      if (!require("../marketing/siteModules").isEnabled(ctx.db, ctx.organizationId, siteId2, "commerce")) warnings.push({ code: "shop_module", message: "Le module « Commerce » n'est pas activé pour ce site (Modules du site) : les éléments de boutique n'afficheront rien au public tant qu'il ne l'est pas." });
      else if (!(ctx.db.prepare("SELECT enabled FROM mk_shop_settings WHERE organization_id = ? AND site_id IS ?").get(ctx.organizationId, siteId2) || { enabled: 0 }).enabled) warnings.push({ code: "shop_closed", message: "La boutique de ce site est fermée (Boutique → Réglages) : les éléments de boutique n'afficheront rien au public tant qu'elle n'est pas ouverte." });
    } catch { /* tables de boutique absentes : aucun avertissement inventé */ } // lecture seule : jamais getSettings(), qui crée la ligne de réglages
  }
  if (needsForm) notes.push({ code: "form_to_choose", message: "Le modèle contient un formulaire d'inscription : choisissez-en un avant de publier la page." });
  if (themeType) notes.push({ code: "theme_type", message: `Modèle du Theme Builder (${themeType}) : la page est créée en brouillon ; l'affecter au site est une action distincte.` });
  const requires = [...(needsCourses ? ["formations"] : []), ...(needsBlog ? ["blog"] : []), ...(needsShop ? ["boutique"] : []), ...(needsForm || forms.size ? ["formulaire"] : [])];
  const status = blockers.length ? "blocked" : warnings.length ? "warn" : "ok";
  return { status, blockers, warnings, notes, widgets: [...widgets.values()].sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, "fr")), requires, deps: { forms: [...forms], components: [...components], uploads: [...uploads], external: [...external].sort() } };
}
// Analyse d'une référence : charge la structure (une erreur de chargement = bloquant, jamais une exception qui masque la cause)
function analyzeRef(ctx, siteId, ref, opts = {}) {
  let st;
  try { st = structureOf(ctx, siteId, ref); }
  catch (e) {
    // Modèle inconnu ou d'un autre site (UserError) : refus net, sauf pour une liste (opts.soft) où il devient « incompatible » ; contenu que la grammaire actuelle refuse (MarketingError) : toujours « incompatible », cause nommée
    if ((e instanceof UserError && opts.soft) || (e && e.name === "MarketingError")) return { status: "blocked", blockers: [{ code: "incompatible", message: `Contenu incompatible avec cette version : ${e.message}` }], warnings: [], notes: [], widgets: [], requires: [], deps: { forms: [], components: [], uploads: [], external: [] }, structure: { label: String(ref), pages: [{ key: "page", name: String(ref), sections: [] }] } };
    throw e;
  }
  const origin = st.template ? st.template.siteId : st.component ? st.component.site_id : siteId;
  const all = st.pages.flatMap((p) => p.sections);
  return { ...analyze(ctx, siteId, all, { ...opts, originSiteId: origin, themeType: st.themeType || null }), structure: st };
}

// ---------- Enrichissement (pages, éléments, compatibilité) d'une entrée ----------
function enrich(ctx, siteId, e, { can, sectors, usage }) {
  const a = analyzeRef(ctx, siteId, e.ref, { can, soft: true });
  const pages = a.structure.pages.map((p) => ({ key: p.key, name: p.name, sections: p.sections.length, elements: countNodes(p.sections) }));
  const sec = e.sectorKeys.map((k) => sectors.get(k)).filter(Boolean);
  const { structure: _s, ...analysis } = a;
  const pack = e.source === "pack" ? PACKS.find((x) => x.key === e.key) : null;
  const pal = pack ? palettes.PALETTES.find((x) => x.key === pack.palette) : null;
  return { ...e, sectors: sec.map((s) => ({ slug: s.slug, label: s.label, family: s.familyLabel })), pages, pageCount: pages.length, elements: pages.reduce((n, x) => n + x.elements, 0), usage: usage.get(e.ref) || 0,
    compat: { status: analysis.status, blockers: analysis.blockers.length, warnings: analysis.warnings.length, requires: analysis.requires },
    ...(pack ? { menuItems: pack.menu.length, style: { palette: pack.palette, paletteLabel: pal.label, colors: pal.colors, fonts: pack.fonts } } : {}) };
}

// ---------- Requête : recherche, filtres, tri, pagination ----------
function normalizeParams(p = {}) {
  const one = (v, max = 60) => String(Array.isArray(v) ? v[0] : v ?? "").trim().slice(0, max);
  const int = (v, lo, hi, d) => { const n = Number.parseInt(one(v, 8), 10); return Number.isInteger(n) ? Math.min(hi, Math.max(lo, n)) : d; };
  const source = one(p.source, 12);
  return {
    q: one(p.q, 120), source: Object.hasOwn(SOURCES, source) ? source : "", kind: Object.hasOwn(KINDS, one(p.kind, 12)) ? one(p.kind, 12) : "", family: one(p.family).replace(/[^a-z0-9-]/g, ""), sector: one(p.sector).replace(/[^a-z0-9-]/g, ""),
    category: one(p.category, 80), siteType: Object.hasOwn(meta.SITE_TYPES.reduce((a, k) => ({ ...a, [k]: 1 }), {}), one(p.siteType, 12)) ? one(p.siteType, 12) : "", language: one(p.language, 8).replace(/[^a-z-]/gi, ""),
    compat: ["ok", "warn", "blocked"].includes(one(p.compat, 8)) ? one(p.compat, 8) : "", sort: SORTS.includes(one(p.sort, 12)) ? one(p.sort, 12) : "", page: int(p.page, 1, 1000, 1), perPage: int(p.perPage, 1, MAX_PER_PAGE, DEFAULT_PER_PAGE),
  };
}
// Pertinence d'une recherche : nom (le plus fort), mots-clés, catégorie / secteurs, description. Tous les mots doivent être trouvés quelque part.
function score(e, tokens, sectors) {
  if (!tokens.length) return 0;
  const name = norm(e.name), kw = norm(e.keywords.join(" ")), cat = norm(`${e.category} ${KINDS[e.kind]} ${e.sectorKeys.map((k) => (sectors.get(k) || {}).label || "").join(" ")} ${e.sectorKeys.map((k) => (sectors.get(k) || {}).familyLabel || "").join(" ")}`), desc = norm(e.description);
  let total = 0;
  for (const t of tokens) {
    const s = name.includes(t) ? 8 : kw.includes(t) ? 5 : cat.includes(t) ? 3 : desc.includes(t) ? 2 : 0;
    if (!s) return -1;
    total += s;
  }
  return total;
}
function query(ctx, siteId, rawParams = {}, { can = () => true } = {}) {
  const p = normalizeParams(rawParams), sectors = sectorMap(ctx), usage = usageMap(ctx);
  const tokens = norm(p.q).split(" ").filter(Boolean);
  let all = [...officialEntries(ctx), ...mineEntries(ctx, siteId)];
  for (const e of all) { e.usage = usage.get(e.ref) || 0; e.sectorKeys = Array.isArray(e.sectorKeys) ? e.sectorKeys : []; e.keywords = Array.isArray(e.keywords) ? e.keywords : String(e.keywords || "").split(",").map((s) => s.trim()).filter(Boolean); }
  const inSource = (e) => (!p.source || e.source === p.source);
  const textual = (e) => (!tokens.length || score(e, tokens, sectors) >= 0);
  const base0 = all.filter((e) => inSource(e) && (!p.kind || e.kind === p.kind) && textual(e));
  // Les facettes comptent sur l'ensemble filtré par type et recherche : les autres filtres s'y ajoutent sans faire disparaître leurs propres options
  const sec = (e) => e.sectorKeys.filter((k) => sectors.has(k) && sectors.get(k).active);
  let list = base0.filter((e) => (!p.family || sec(e).some((k) => sectors.get(k).familySlug === p.family)) && (!p.sector || sec(e).includes(p.sector))
    && (!p.category || e.category === p.category) && (!p.siteType || e.siteType === p.siteType) && (!p.language || e.language === p.language));
  let compatChecked = null;
  if (p.compat) { // exige la construction : seulement quand ce filtre est demandé
    compatChecked = new Map(list.map((e) => [e.ref, analyzeRef(ctx, siteId, e.ref, { can, soft: true }).status]));
    list = list.filter((e) => compatChecked.get(e.ref) === p.compat);
  }
  const sort = p.sort || (tokens.length ? "relevance" : "recent");
  const byName = (a, b) => a.name.localeCompare(b.name, "fr", { sensitivity: "base" });
  const sorters = {
    relevance: (a, b) => score(b, tokens, sectors) - score(a, tokens, sectors) || byName(a, b),
    recent: (a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)) || byName(a, b),
    alpha: byName, used: (a, b) => b.usage - a.usage || byName(a, b),
  };
  list.sort(sorters[sort]);
  const total = list.length, pages = Math.max(1, Math.ceil(total / p.perPage)), page = Math.min(p.page, pages);
  const slice = list.slice((page - 1) * p.perPage, page * p.perPage);
  const items = slice.map((e) => enrich(ctx, siteId, e, { can, sectors, usage }));
  const count = (arr, f) => { const m = new Map(); for (const e of arr) for (const k of [].concat(f(e))) if (k !== "" && k != null) m.set(k, (m.get(k) || 0) + 1); return m; };
  const fam = new Map();
  for (const e of base0) for (const k of sec(e)) { const s = sectors.get(k); if (!fam.has(s.familySlug)) fam.set(s.familySlug, { slug: s.familySlug, label: s.familyLabel, count: new Set(), sectors: new Map() }); const f = fam.get(s.familySlug); f.count.add(e.ref); if (!f.sectors.has(k)) f.sectors.set(k, { slug: k, label: s.label, refs: new Set() }); f.sectors.get(k).refs.add(e.ref); }
  const facets = {
    sources: Object.fromEntries([...count(all.filter((e) => textual(e) && (!p.kind || e.kind === p.kind)), (e) => e.source)]),
    kinds: Object.fromEntries([...count(base0, (e) => e.kind)]),
    families: [...fam.values()].map((f) => ({ slug: f.slug, label: f.label, count: f.count.size, sectors: [...f.sectors.values()].map((s) => ({ slug: s.slug, label: s.label, count: s.refs.size })).sort((a, b) => a.label.localeCompare(b.label, "fr")) })).sort((a, b) => a.label.localeCompare(b.label, "fr")),
    categories: [...count(base0, (e) => e.category)].map(([label, n]) => ({ label, count: n })).sort((a, b) => a.label.localeCompare(b.label, "fr")),
    siteTypes: [...count(base0, (e) => e.siteType)].map(([slug, n]) => ({ slug, label: pagesLib().SITE_TYPES[slug] || slug, count: n })),
    languages: [...count(base0, (e) => e.language)].map(([slug, n]) => ({ slug, count: n })),
    hasUsage: all.some((e) => e.usage > 0),
  };
  return { params: { ...p, sort }, total, page, pages, perPage: p.perPage, items, facets, sorts: SORTS.filter((s) => s !== "used" || facets.hasUsage).filter((s) => s !== "relevance" || tokens.length) };
}

// ---------- Détail d'un modèle (page « Voir les détails ») ----------
const outline = (sections) => sections.map((s, i) => ({ index: i, label: patternLibrary().labelOf(s) }));
function detail(ctx, siteId, ref, { can = () => true } = {}) {
  const { resource } = parseRef(ref);
  const sectors = sectorMap(ctx), usage = usageMap(ctx);
  const entry = [...officialEntries(ctx), ...mineEntries(ctx, siteId)].find((x) => x.ref === ref);
  if (!entry) throw new UserError("Modèle introuvable pour ce site.");
  entry.keywords = Array.isArray(entry.keywords) ? entry.keywords : [];
  const a = analyzeRef(ctx, siteId, ref, { can });
  const base1 = enrich(ctx, siteId, { ...entry, sectorKeys: entry.sectorKeys || [] }, { can, sectors, usage });
  return {
    ...base1, resource, kindLabel: KINDS[entry.kind],
    keywords: entry.keywords, requires: a.requires, widgets: a.widgets, notes: a.notes, warnings: a.warnings, blockers: a.blockers, deps: a.deps,
    structure: a.structure.pages.map((p) => ({ key: p.key, name: p.name, sections: outline(p.sections) })),
    license: entry.origin === "official" ? LICENSE : "Contenu créé par votre équipe dans ce site.",
    provenance: entry.origin === "official" ? "Bibliothèque officielle Kolakisa" : entry.origin === "organization" ? "Modèle partagé avec les sites de l'organisation" : "Modèle réservé à ce site",
  };
}

module.exports = { FORMAT_VERSION, KINDS, SOURCES, SORTS, REF_RE, LICENSE, parseRef, sectorRows, sectorMap, families, officialEntries, mineEntries, usageMap, structureOf, analyze, analyzeRef, query, detail, normalizeParams, countNodes, norm, parseJson };
