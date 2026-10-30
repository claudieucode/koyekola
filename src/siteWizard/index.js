// Assistant de création de site (programme 20.6) — ORCHESTRATION. Aucun second moteur : chaque étape appelle le service qui existe déjà
// (pages.createSite / createPage / setHomePage, templateLibrary.importTemplate, tokens du site, siteModules, navigation, siteDomains, pages.publish).
// L'assistant ne garde que sa PROGRESSION (table mk_site_wizard, créée à la demande : les migrations 114/115 sont figées par test) et les réponses qui n'ont pas d'autre domicile.
// Règles : tout est borné par le site de l'adresse (jamais un identifiant du formulaire) ; la création d'un site est réservée à l'équipe ; rien n'est publié sans confirmation explicite ;
// aucune intégration externe n'est activée seule ; aucune affirmation de conformité fiscale ou juridique.
const { MarketingError } = require("../marketing/errors");
const catalog = require("./catalog");
const { transaction } = require("../marketing/db/tx");

const bad = (message) => new MarketingError("invalid_field", message);
const pagesLib = () => require("../marketing/pages");
const landing = () => require("../marketing/landing");
const libTemplates = () => require("../services/templateLibrary");

function ensureSchema(db) {
  db.exec(`CREATE TABLE IF NOT EXISTS mk_site_wizard (
    site_id INTEGER PRIMARY KEY REFERENCES mk_sites(id) ON DELETE CASCADE,
    organization_id INTEGER NOT NULL,
    mode TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT '',
    step TEXT NOT NULL DEFAULT 'infos',
    steps TEXT NOT NULL DEFAULT '{}',
    data TEXT NOT NULL DEFAULT '{}',
    revision INTEGER NOT NULL DEFAULT 0,
    created_by INTEGER,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`);
}
const json = (s, d) => { try { const v = JSON.parse(s); return v && typeof v === "object" ? v : d; } catch { return d; } };
const line = (v, max) => String(v ?? "").replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
// Les noms de pages sont uniques dans toute l'organisation : une page proposée prend le premier nom libre (« Accueil », « Accueil (2) »…), comme la Template Library
function freeName(ctx, base) {
  const root = line(base, 110);
  for (let n = 1; n < 500; n += 1) {
    const name = n === 1 ? root : `${root} (${n})`;
    if (!ctx.db.prepare("SELECT 1 FROM mk_landing_pages WHERE organization_id = ? AND name = ? COLLATE NOCASE").get(ctx.organizationId, name)) return name;
  }
  throw bad("Impossible de trouver un nom libre pour une page.");
}
// Listes envoyées par un formulaire : valeurs répétées ou séparées par des virgules
const list = (v) => [].concat(v === undefined || v === null ? [] : v).flatMap((x) => String(x).split(",")).map((x) => x.trim()).filter(Boolean);
const isTeam = (ctx) => ctx.siteScope === undefined || ctx.siteScope === null;

// ── accès ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
// Le site est vérifié contre l'organisation ET contre la portée de la personne (accès limité à un site → le sien seulement). Un autre site répond « introuvable » : aucune fuite d'existence.
function access(ctx, siteId) {
  ensureSchema(ctx.db);
  if (!Number.isInteger(siteId) || siteId < 1) throw new MarketingError("not_found", "Site introuvable.");
  if (!isTeam(ctx) && ctx.siteScope !== siteId) throw new MarketingError("not_found", "Site introuvable.");
  const site = pagesLib().getSite(ctx, siteId);
  if (!site || site.deleted_at) throw new MarketingError("not_found", "Site introuvable.");
  const row = ctx.db.prepare("SELECT * FROM mk_site_wizard WHERE site_id = ? AND organization_id = ?").get(siteId, ctx.organizationId);
  return { site, row };
}
function load(ctx, siteId) {
  const { site, row } = access(ctx, siteId);
  if (!row) throw new MarketingError("not_found", "Aucune création guidée n'est en cours pour ce site.");
  return { site, row, steps: json(row.steps, {}), data: json(row.data, {}) };
}
function persist(ctx, w, patch = {}) {
  const steps = patch.steps || w.steps, data = patch.data || w.data, step = patch.step || w.row.step, category = patch.category ?? w.row.category;
  ctx.db.prepare("UPDATE mk_site_wizard SET step = ?, steps = ?, data = ?, category = ?, revision = revision + 1, updated_at = datetime('now') WHERE site_id = ?")
    .run(step, JSON.stringify(steps), JSON.stringify(data), category, w.row.site_id);
  return ctx.db.prepare("SELECT revision FROM mk_site_wizard WHERE site_id = ?").get(w.row.site_id).revision;
}
const mark = (w, key, status) => { w.steps = { ...w.steps, [key]: status }; };
const checkRevision = (w, revision) => {
  if (revision !== undefined && revision !== null && Number(revision) !== w.row.revision) throw new MarketingError("conflict", "Cette création a été modifiée ailleurs (autre onglet ou autre personne) : rechargez la page, vos modifications n'ont pas été enregistrées.");
};
function writable(w) { if (w.site.status !== "active") throw bad("Ce site est archivé : restaurez-le avant de continuer."); }

// ── régional ─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
function validZone(tz) { try { new Intl.DateTimeFormat("en", { timeZone: tz }); return true; } catch { return false; } }
// Formats d'exemple pour le pays/langue/devise choisis (moteur Intl : aucune règle américaine codée en dur)
function formats({ country, lang, currency, timezone } = {}) {
  const c = catalog.COUNTRIES[country];
  const locale = c ? c.locale : lang || "fr";
  const now = new Date("2026-03-14T15:30:00Z");
  try {
    return {
      locale,
      date: new Intl.DateTimeFormat(locale, { dateStyle: "long", timeZone: timezone && validZone(timezone) ? timezone : "UTC" }).format(now),
      time: new Intl.DateTimeFormat(locale, { timeStyle: "short", timeZone: timezone && validZone(timezone) ? timezone : "UTC" }).format(now),
      number: new Intl.NumberFormat(locale).format(1234567.89),
      money: currency ? new Intl.NumberFormat(locale, { style: "currency", currency }).format(1234.5) : "",
    };
  } catch { return { locale, date: "", time: "", number: "", money: "" }; }
}
const countryDefaults = (code) => { const c = catalog.COUNTRIES[code]; return c ? { country: code, lang: c.lang, timezone: c.tz, currency: c.currency } : {}; };

const EMAIL = /^[^\s@]{1,64}@[^\s@]{1,190}\.[^\s@]{2,}$/;
function cleanInfos(input, previous = {}) {
  const country = String(input.country ?? previous.country ?? "").toUpperCase();
  if (!catalog.COUNTRIES[country]) throw bad("Choisissez un pays dans la liste.");
  const def = countryDefaults(country);
  const lang = String(input.lang || def.lang);
  if (!catalog.LANGUAGES[lang]) throw bad("Langue inconnue.");
  const timezone = String(input.timezone || def.timezone);
  if (!validZone(timezone)) throw bad("Fuseau horaire inconnu.");
  const currency = String(input.currency || def.currency).toUpperCase();
  if (!catalog.CURRENCIES.includes(currency)) throw bad("Devise non prise en charge par l'assistant.");
  const email = line(input.email, 254), phone = line(input.phone, 30);
  if (email && !EMAIL.test(email)) throw bad("Adresse e-mail de contact invalide.");
  if (phone && !/^[0-9+().\-\s]{5,30}$/.test(phone)) throw bad("Téléphone : chiffres, espaces, +, tirets et parenthèses seulement.");
  return {
    company: line(input.company, 100), sector: line(input.sector, 100), country, lang, timezone, currency, email, phone,
    street: line(input.street, 200), postalCode: line(input.postalCode, 20), city: line(input.city, 100),
  };
}

// ── démarrage ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
// Création d'un site : ÉQUIPE seulement (comme « Mes sites »). Mode : vierge · modèle (pack de la Template Library) · boutique.
function start(ctx, input = {}) {
  ensureSchema(ctx.db);
  // Tout ou rien : un échec (nom déjà pris, import refusé…) ne laisse ni site à demi créé ni progression orpheline
  return transaction(ctx.db, () => startInner(ctx, input));
}
function startInner(ctx, { mode, category, name, pack, can = () => true, userId = null } = {}) {
  if (!isTeam(ctx)) throw new MarketingError("forbidden", "La création d'un site est réservée à l'équipe de l'organisation.");
  if (!Object.hasOwn(catalog.MODES, mode)) throw bad("Choisissez un mode de création.");
  const cat = catalog.category(mode === "shop" ? "boutique" : String(category || "autre"));
  if (!cat) throw bad("Type de site inconnu.");
  const siteName = line(name, 100);
  if (!siteName) throw bad("Le nom du site est obligatoire.");
  let packKey = null;
  if (mode === "template") {
    packKey = String(pack || cat.pack || "");
    if (!libTemplates().packs(ctx).some((p) => p.key === packKey)) throw bad("Choisissez un modèle professionnel dans la liste.");
  }
  const site = pagesLib().createSite(ctx, { name: siteName, siteType: cat.siteType, description: "" });
  ctx.db.prepare("INSERT INTO mk_site_wizard (site_id, organization_id, mode, category, step, steps, data, created_by) VALUES (?, ?, ?, ?, 'infos', '{}', ?, ?)")
    .run(site.id, ctx.organizationId, mode, cat.key, JSON.stringify({ pack: packKey }), userId ?? ctx.userId ?? null);
  const w = load(ctx, site.id);
  mark(w, "mode", "done"); mark(w, "type", "done");
  // Site vierge : structure minimale = une page d'accueil. Modèle : import par la Template Library (une seule transaction, jeton d'idempotence).
  if (mode === "blank") {
    const home = pagesLib().createPage(ctx, { name: freeName(ctx, "Accueil"), siteId: site.id, kind: "page", blank: true });
    pagesLib().setHomePage(ctx, site.id, home.id);
    mark(w, "pages", "pending");
  } else if (mode === "template") {
    const out = libTemplates().importTemplate(ctx, site.id, { ref: `pack:${packKey}`, importKey: `wiz-${site.id}-${packKey}`.slice(0, 60), menu: can("navigation.write"), styles: false, confirm: true, can, userId: userId ?? ctx.userId ?? null }); // site tout neuf, étapes guidées : les avertissements de compatibilité (ex. aucune formation publiée encore) sont connus et non bloquants
    if (out.pages[0]) pagesLib().setHomePage(ctx, site.id, out.pages[0].id);
    w.data = { ...w.data, imported: { label: out.label, pages: out.pages.length, menu: Boolean(out.menu) } };
  }
  persist(ctx, w, { steps: w.steps, data: w.data, step: "infos" });
  return pagesLib().getSite(ctx, site.id);
}

// Liste des créations en cours visibles par la personne (équipe : toutes celles de l'organisation ; accès limité : la sienne)
function listInProgress(ctx) {
  ensureSchema(ctx.db);
  const rows = ctx.db.prepare(`SELECT w.site_id, w.mode, w.category, w.step, w.steps, w.updated_at, s.name FROM mk_site_wizard w JOIN mk_sites s ON s.id = w.site_id
    WHERE w.organization_id = ? AND s.deleted_at IS NULL${isTeam(ctx) ? "" : " AND w.site_id = ?"} ORDER BY w.updated_at DESC, w.site_id DESC LIMIT 50`).all(...(isTeam(ctx) ? [ctx.organizationId] : [ctx.organizationId, ctx.siteScope]));
  return rows.map((r) => ({ siteId: r.site_id, name: r.name, mode: r.mode, category: r.category, step: r.step, updatedAt: r.updated_at, percent: percent(json(r.steps, {})) }));
}

// ── étapes ───────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
function saveInfos(ctx, siteId, input = {}, { revision } = {}) {
  const w = load(ctx, siteId); writable(w); checkRevision(w, revision);
  const name = line(input.name, 100);
  if (!name) throw bad("Le nom du site est obligatoire.");
  const infos = cleanInfos(input, w.data.infos || {});
  const description = line(input.description, 500);
  pagesLib().updateSite(ctx, siteId, { name, description });
  // Le moteur SEO reçoit les coordonnées publiques (SEO local du site) : même réglage que « SEO → Schéma », pas une copie parallèle
  let seo = false;
  try {
    const patch = { org_name: infos.company || name, org_description: description, org_phone: infos.phone, org_email: infos.email, org_street: infos.street, org_postal_code: infos.postalCode, org_city: infos.city, org_country: infos.country };
    require("../seo/settings").saveForSite(siteId, patch, ctx.userId ?? null); seo = true;
  } catch { /* un champ refusé par le moteur SEO ne bloque pas l'assistant : l'état est indiqué */ }
  delete w.data.drafts?.infos;
  w.data = { ...w.data, infos, seoApplied: seo };
  mark(w, "infos", "done");
  const rev = persist(ctx, w, { step: "identite" });
  return { revision: rev, seoApplied: seo, formats: formats({ country: infos.country, lang: infos.lang, currency: infos.currency, timezone: infos.timezone }) };
}

// Identité : une orientation (palette + polices du moteur) puis des retouches de couleurs. Écrit dans les jetons du site (design system), jamais ailleurs.
const HEX = /^#[0-9a-fA-F]{6}$/;
function saveIdentity(ctx, siteId, input = {}, { revision } = {}) {
  const w = load(ctx, siteId); writable(w); checkRevision(w, revision);
  const tokens = require("../marketing/pages/tokens");
  const palettes = require("../services/stylePalettes");
  const site = w.site;
  const style = input.style ? catalog.style(String(input.style)) : null;
  if (input.style && !style) throw bad("Style graphique inconnu.");
  const colors = { ...site.tokens.colors }, fonts = { ...site.tokens.fonts };
  if (style) {
    const pal = palettes.PALETTES.find((p) => p.key === style.palette);
    for (const [k, v] of Object.entries(pal.colors)) if (Object.hasOwn(colors, k)) colors[k] = v;
    fonts.heading = style.heading; fonts.body = style.body;
  }
  for (const k of ["primary", "secondary", "accent", "background", "text"]) {
    if (input[`color_${k}`] === undefined || input[`color_${k}`] === "") continue;
    if (!HEX.test(String(input[`color_${k}`]))) throw bad("Couleur invalide : utilisez le format #RRGGBB.");
    colors[k] = String(input[`color_${k}`]).toLowerCase();
  }
  for (const role of ["heading", "body"]) {
    const v = input[`font_${role}`];
    if (v === undefined || v === "") continue;
    if (!Object.hasOwn(tokens.FONTS, v)) throw bad("Police inconnue : choisissez-en une dans la liste.");
    fonts[role] = v;
  }
  pagesLib().updateSite(ctx, siteId, { tokens: { ...site.tokens, colors, fonts } });
  // Logo : une image de la médiathèque du site (chemin /uploads/…), validée par les réglages du site
  let logo = false;
  if (input.logoUrl !== undefined && String(input.logoUrl).trim() !== "") {
    const fresh = pagesLib().getSite(ctx, siteId);
    pagesLib().saveSiteDesign(ctx, siteId, { settings: { ...fresh.settings, identity: { ...fresh.settings.identity, logoUrl: String(input.logoUrl).trim() } }, revision: fresh.settings_revision });
    logo = true;
  }
  w.data = { ...w.data, identity: { style: style ? style.key : (w.data.identity || {}).style || "", logo: logo || Boolean((w.data.identity || {}).logo) } };
  mark(w, "identite", "done");
  return { revision: persist(ctx, w, { step: "pages" }) };
}

function sitePageRows(ctx, siteId) {
  return pagesLib().sitePages(ctx, siteId).map((p) => ({ id: p.id, name: p.name, slug: p.slug, status: p.status }));
}
function pagesState(ctx, siteId) {
  const { site } = access(ctx, siteId);
  const w = load(ctx, siteId);
  const rows = sitePageRows(ctx, siteId);
  const order = Array.isArray(w.data.order) ? w.data.order.filter((id) => rows.some((r) => r.id === id)) : [];
  const sorted = [...order.map((id) => rows.find((r) => r.id === id)), ...rows.filter((r) => !order.includes(r.id))];
  const nav = Array.isArray(w.data.nav) ? w.data.nav : null;
  const cat = catalog.category(w.row.category);
  const made = (p) => rows.some((r) => r.name.toLowerCase() === p.name.toLowerCase() || r.name.toLowerCase().startsWith(`${p.name.toLowerCase()} (`));
  return {
    pages: sorted.map((r) => ({ ...r, home: site.home_page_id === r.id, inNav: nav ? nav.includes(r.id) : true })),
    homeId: site.home_page_id || null,
    proposals: (cat ? cat.pages : []).filter((p) => !made(p)),
    gaps: cat && cat.gaps ? cat.gaps : [],
  };
}
// Ajouter une page (gabarit réel ou vierge), renommer, mettre à la corbeille (réversible), page d'accueil, ordre, navigation
function pageAction(ctx, siteId, action, input = {}, { revision } = {}) {
  const w = load(ctx, siteId); writable(w); checkRevision(w, revision);
  const inSite = (id) => {
    const n = Number(id);
    const p = Number.isInteger(n) ? ctx.db.prepare("SELECT id, site_id FROM mk_landing_pages WHERE id = ? AND organization_id = ? AND archived_at IS NULL").get(n, ctx.organizationId) : null;
    if (!p || p.site_id !== siteId) throw new MarketingError("not_found", "Page introuvable dans ce site.");
    return p.id;
  };
  let message = "";
  if (action === "add") {
    const tpl = String(input.template || "");
    if (tpl && !require("../marketing/pages/templates").catalog().some((t) => t.key === tpl)) throw bad("Gabarit de page inconnu.");
    const name = line(input.name, 100);
    if (!name) throw bad("Donnez un nom à la page.");
    const page = pagesLib().createPage(ctx, { name, siteId, kind: "page", ...(tpl ? { template: tpl } : { blank: true }) });
    if (!ctx.db.prepare("SELECT home_page_id FROM mk_sites WHERE id = ?").get(siteId).home_page_id) pagesLib().setHomePage(ctx, siteId, page.id);
    message = `Page « ${page.name} » créée en brouillon.`;
  } else if (action === "rename") { landing().renamePage(ctx, inSite(input.pageId), input.name); message = "Page renommée."; }
  else if (action === "remove") {
    const id = inSite(input.pageId);
    if (ctx.db.prepare("SELECT home_page_id FROM mk_sites WHERE id = ?").get(siteId).home_page_id === id) throw bad("C'est la page d'accueil : choisissez-en une autre avant de la retirer.");
    pagesLib().archivePage(ctx, id); message = "Page mise à la corbeille (récupérable depuis la liste des pages).";
  } else if (action === "home") { pagesLib().setHomePage(ctx, siteId, inSite(input.pageId)); message = "Page d'accueil définie."; }
  else if (action === "order") {
    const ids = list(input.ids).map((x) => inSite(x));
    if (new Set(ids).size !== ids.length) throw bad("Ordre invalide.");
    w.data = { ...w.data, order: ids }; message = "Ordre enregistré.";
  } else if (action === "nav") {
    const ids = list(input.nav).map((x) => inSite(x));
    w.data = { ...w.data, nav: ids }; message = "Pages de la navigation enregistrées.";
  } else throw bad("Action inconnue.");
  if (action === "add" || action === "remove") mark(w, "pages", "pending");
  return { revision: persist(ctx, w), message };
}
// Applique l'ordre et le choix de navigation à un MENU du site (service de navigation existant). Réservé à navigation.write.
function applyMenu(ctx, siteId, { can = () => true, userId = null } = {}) {
  const w = load(ctx, siteId); writable(w);
  if (!can("navigation.write")) throw new MarketingError("forbidden", "Vous n'avez pas le droit de modifier les menus (navigation.write).");
  const nav = require("../services/navigation");
  const st = pagesState(ctx, siteId);
  const items = st.pages.filter((p) => p.inNav);
  if (!items.length) throw bad("Choisissez au moins une page pour la navigation.");
  if (w.data.menuId) { try { nav.remove(w.data.menuId); } catch { /* menu déjà supprimé */ } }
  const menu = nav.create({ name: `Menu — ${line(w.site.name, 40)} (assistant)`.slice(0, 80), siteId, userId });
  for (const p of items) nav.add(menu.id, { type: "page", object_id: p.id });
  if (!nav.assignments({ siteId }).header) nav.assign("header", menu.id, { siteId });
  w.data = { ...w.data, menuId: menu.id };
  mark(w, "pages", "done");
  return { revision: persist(ctx, w, { step: "contenus" }), menu: { id: menu.id, name: menu.name } };
}
function completePages(ctx, siteId, { revision } = {}) {
  const w = load(ctx, siteId); writable(w); checkRevision(w, revision);
  const st = pagesState(ctx, siteId);
  if (!st.pages.length) throw bad("Créez au moins une page.");
  if (!st.homeId) throw bad("Choisissez une page d'accueil.");
  mark(w, "pages", "done");
  return { revision: persist(ctx, w, { step: "contenus" }) };
}
// Crée d'un coup les pages proposées cochées (clés du catalogue de la catégorie)
function createProposed(ctx, siteId, keys, { revision } = {}) {
  const w = load(ctx, siteId); writable(w); checkRevision(w, revision);
  const cat = catalog.category(w.row.category);
  const asked = list(keys);
  const wanted = (cat ? cat.pages : []).filter((p) => asked.includes(p.key));
  if (!wanted.length) throw bad("Cochez au moins une page à créer.");
  const rows = sitePageRows(ctx, siteId);
  const made = (p) => rows.some((r) => r.name.toLowerCase() === p.name.toLowerCase() || r.name.toLowerCase().startsWith(`${p.name.toLowerCase()} (`));
  let n = 0, first = null;
  transaction(ctx.db, () => {
    for (const p of wanted) {
      if (made(p)) continue;
      const page = pagesLib().createPage(ctx, { name: freeName(ctx, p.name), siteId, kind: "page", ...(p.template ? { template: p.template } : { blank: true }) });
      n += 1; if (p.home && !first) first = page;
    }
  });
  const home = ctx.db.prepare("SELECT home_page_id FROM mk_sites WHERE id = ?").get(siteId).home_page_id;
  if (!home) { const any = first || sitePageRows(ctx, siteId)[0]; if (any) pagesLib().setHomePage(ctx, siteId, any.id); }
  mark(w, "pages", "pending");
  return { revision: persist(ctx, w), created: n };
}

// ── contenus ─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
const PLACEHOLDER = /\[[^\[\]"]{3,60}\]/g;
function contentOf(ctx, siteId) {
  access(ctx, siteId);
  return sitePageRows(ctx, siteId).map((r) => {
    const p = pagesLib().requirePage(ctx, r.id), wk = p.working;
    const text = JSON.stringify(wk.sections || []);
    const hero = (wk.sections || []).find((s) => s.type === "hero");
    return { id: r.id, name: r.name, title: wk.title || "", description: wk.description || "", placeholders: (text.match(PLACEHOLDER) || []).length, sections: (wk.sections || []).length, status: r.status,
      hero: hero ? { title: hero.title || "", subtitle: hero.subtitle || "", buttonLabel: hero.buttonLabel || "", buttonUrl: hero.buttonUrl || "" } : null };
  });
}
// Modifie le titre, la description et l'accroche (section « hero ») d'UNE page du site, par le brouillon du moteur de pages (révision vérifiée)
function saveContent(ctx, siteId, pageId, input = {}) {
  const w = load(ctx, siteId); writable(w);
  const id = Number(pageId);
  const p = Number.isInteger(id) ? pagesLib().requirePage(ctx, id) : null;
  if (!p || p.site_id !== siteId || p.archived_at) throw new MarketingError("not_found", "Page introuvable dans ce site.");
  const wk = JSON.parse(JSON.stringify(p.working));
  const hero = (wk.sections || []).find((s) => s.type === "hero");
  if (hero) {
    if (input.heroTitle !== undefined) hero.title = line(input.heroTitle, 160);
    if (input.heroSubtitle !== undefined) hero.subtitle = line(input.heroSubtitle, 300);
    if (input.buttonLabel !== undefined) hero.buttonLabel = line(input.buttonLabel, 60);
    if (input.buttonUrl !== undefined) hero.buttonUrl = line(input.buttonUrl, 300);
  }
  pagesLib().saveDraft(ctx, id, { ...wk, title: input.title !== undefined ? line(input.title, 120) : wk.title, description: input.description !== undefined ? line(input.description, 300) : wk.description }, { revision: p.revision });
  if (w.steps.contenus !== "done") { mark(w, "contenus", "done"); persist(ctx, w); }
  return { ok: true };
}

// ── fonctionnalités ──────────────────────────────────────────────────────────────────────────────────────────────────────────────
function featuresState(ctx, siteId) {
  const w = load(ctx, siteId);
  const mods = new Map();
  try { for (const m of require("../marketing/siteModules").listFor(ctx, siteId)) mods.set(m.key, m); } catch { /* aucun module lisible */ }
  const cat = catalog.category(w.row.category);
  const recommended = new Set(cat ? cat.modules : []);
  return Object.entries(catalog.FEATURES).map(([key, f]) => {
    const m = f.module ? mods.get(f.module) : null;
    const available = f.kind === "inclus" || (f.kind === "module" && Boolean(m && m.ready));
    return { key, ...f, recommended: recommended.has(key), enabled: f.kind === "inclus" ? true : Boolean(m && m.enabled), available,
      status: f.kind === "absent" ? "Non disponible" : f.kind === "inclus" ? "Inclus" : !m ? "Indisponible" : !m.ready ? "Pas encore ouvert aux sites" : m.enabled ? "Activé" : "Désactivé" };
  });
}
// Activation d'un module : équipe seulement (règle de siteModules) ; un module qui exige des identifiants s'active SANS les configurer — la configuration reste à la personne
function setFeature(ctx, siteId, key, enabled) {
  const w = load(ctx, siteId); writable(w);
  const f = catalog.FEATURES[key];
  if (!f || f.kind !== "module") throw bad("Cette fonctionnalité ne s'active pas par site.");
  const m = require("../marketing/siteModules").listFor(ctx, siteId).find((x) => x.key === f.module);
  if (!m || !m.ready) throw bad("Ce module n'est pas encore ouvert aux sites.");
  const out = require("../marketing/siteModules").setEnabled(ctx, siteId, f.module, Boolean(enabled));
  return { changed: out.changed, enabled: out.enabled, needs: f.needs || "" };
}
function completeFeatures(ctx, siteId, status = "done") {
  const w = load(ctx, siteId); writable(w);
  mark(w, "fonctions", status);
  return { revision: persist(ctx, w, { step: "apercu" }) };
}

// ── aperçu et publication ────────────────────────────────────────────────────────────────────────────────────────────────────────
// Alertes NON bloquantes sur les contenus réels (mêmes brouillons que l'éditeur)
function previewAlerts(ctx, siteId) {
  access(ctx, siteId);
  const out = [];
  for (const r of sitePageRows(ctx, siteId)) {
    const wk = pagesLib().requirePage(ctx, r.id).working, secs = wk.sections || [], text = JSON.stringify(secs);
    const add = (level, message) => out.push({ pageId: r.id, page: r.name, level, message });
    if (!secs.length) add("warn", "La page est vide.");
    if (!String(wk.description || "").trim()) add("info", "Pas de description pour les moteurs de recherche.");
    const ph = (text.match(PLACEHOLDER) || []).length;
    if (ph) add("warn", `${ph} texte${ph > 1 ? "s" : ""} d'exemple entre crochets à remplacer par vos informations.`);
    if (secs.some((s) => Number(s.columns) >= 4)) add("info", "Une section affiche 4 colonnes ou plus : vérifiez-la sur mobile.");
    if (secs.some((s) => s.image && !s.imageAlt)) add("info", "Une image n'a pas de description (texte alternatif).");
  }
  return out;
}
const DEVICES = Object.freeze({ ordinateur: 1280, tablette: 820, mobile: 390 });

function publicationState(ctx, siteId) {
  const w = load(ctx, siteId);
  const rows = sitePageRows(ctx, siteId), st = pagesState(ctx, siteId), alerts = previewAlerts(ctx, siteId);
  let domains = [], platform = { available: false };
  try { const d = require("../services/siteDomains"); domains = d.listForSite(ctx.db, siteId); platform = d.platformStatus(); } catch { /* registre indisponible */ }
  const placeholders = alerts.filter((a) => /d'exemple/.test(a.message)).length;
  const items = [
    { key: "pages", label: "Pages et page d'accueil", ok: rows.length > 0 && Boolean(st.homeId), detail: rows.length ? `${rows.length} page(s)` : "Aucune page" },
    { key: "contenu", label: "Contenu réel (sans texte d'exemple)", ok: placeholders === 0, detail: placeholders ? `${placeholders} page(s) avec des textes d'exemple` : "Aucun texte d'exemple détecté" },
    { key: "navigation", label: "Navigation", ok: Boolean(w.data.menuId), detail: w.data.menuId ? "Menu créé" : "Aucun menu créé par l'assistant" },
    { key: "responsive", label: "Mobile et tablette", ok: !alerts.some((a) => /mobile/.test(a.message)), detail: "Alertes non bloquantes de l'aperçu" },
    { key: "seo", label: "SEO de base", ok: !alerts.some((a) => /description pour les moteurs/.test(a.message)), detail: "Description de chaque page" },
    { key: "domaine", label: "Domaine", ok: domains.some((d) => d.status === "verified"), detail: domains.length ? domains.map((d) => `${d.host} (${d.status})`).join(", ") : platform.available ? "Aucun domaine : adresse de plateforme activable" : "Aucun domaine configuré (publication possible sans domaine personnalisé)" },
  ];
  return { pages: rows, items, domains, platform };
}
// Publication : jamais implicite. `confirm` doit être vrai ; chaque page passe par le contrôle de publication du moteur (échec isolé page par page).
function publish(ctx, siteId, { confirm, pageIds, can = () => true } = {}) {
  const w = load(ctx, siteId); writable(w);
  if (confirm !== true) throw bad("La publication doit être confirmée explicitement.");
  if (!can("pages.publish")) throw new MarketingError("forbidden", "Vous n'avez pas le droit de publier (pages.publish).");
  const rows = sitePageRows(ctx, siteId);
  const wanted = new Set(list(pageIds).map(Number));
  const targets = rows.filter((r) => wanted.has(r.id));
  if (!targets.length) throw bad("Choisissez au moins une page à publier.");
  const results = targets.map((r) => {
    try { pagesLib().publish(ctx, r.id); return { id: r.id, name: r.name, ok: true }; }
    catch (error) { if (error instanceof MarketingError) return { id: r.id, name: r.name, ok: false, error: error.message }; throw error; }
  });
  if (results.some((x) => x.ok)) { mark(w, "publication", "done"); persist(ctx, w); }
  return { results };
}

// ── progression ──────────────────────────────────────────────────────────────────────────────────────────────────────────────────
function percent(steps) { const done = catalog.STEP_KEYS.filter((k) => steps[k] === "done" || steps[k] === "skipped").length; return Math.round((done / catalog.STEP_KEYS.length) * 100); }
function skip(ctx, siteId, step) {
  const w = load(ctx, siteId); writable(w);
  const def = catalog.STEPS.find((s) => s.key === step);
  if (!def || !def.optional) throw bad("Cette étape est obligatoire.");
  mark(w, step, "skipped");
  const next = catalog.STEP_KEYS[catalog.STEP_KEYS.indexOf(step) + 1] || step;
  return { revision: persist(ctx, w, { step: next }) };
}
function goto(ctx, siteId, step) {
  const w = load(ctx, siteId);
  if (!catalog.STEP_KEYS.includes(step)) throw bad("Étape inconnue.");
  return { revision: persist(ctx, w, { step }) };
}
// Sauvegarde automatique : brouillon de formulaire (champs bornés), sans validation ni effet sur le site. Reprise à l'ouverture de l'étape.
const DRAFT_KEYS = { infos: ["name", "company", "description", "sector", "country", "lang", "timezone", "currency", "email", "phone", "street", "postalCode", "city"], identite: ["style", "color_primary", "color_secondary", "color_accent", "color_background", "color_text", "font_heading", "font_body"] };
function saveFormDraft(ctx, siteId, step, fields = {}, { revision } = {}) {
  const w = load(ctx, siteId); writable(w);
  if (!DRAFT_KEYS[step]) throw bad("Cette étape n'a pas de brouillon.");
  checkRevision(w, revision);
  const draft = {};
  for (const k of DRAFT_KEYS[step]) if (fields[k] !== undefined) draft[k] = line(fields[k], 500);
  w.data = { ...w.data, drafts: { ...(w.data.drafts || {}), [step]: draft } };
  return { revision: persist(ctx, w) };
}

// Vue d'ensemble pour l'affichage
function state(ctx, siteId) {
  const w = load(ctx, siteId);
  const steps = catalog.STEPS.map((s) => {
    let status = w.steps[s.key] === "pending" ? "todo" : w.steps[s.key] || "todo";
    if (s.key === "pages" && status === "done") { const p = pagesState(ctx, siteId); if (!p.pages.length || !p.homeId) status = "issue"; }
    if (s.key === "infos" && status === "done" && !(w.data.infos && w.site.name)) status = "issue";
    return { ...s, status, current: w.row.step === s.key };
  });
  return { site: w.site, mode: w.row.mode, category: catalog.category(w.row.category), step: w.row.step, revision: w.row.revision, steps, percent: percent(w.steps), data: w.data, readOnly: w.site.status !== "active" };
}

module.exports = {
  ensureSchema, access, start, listInProgress, state, saveInfos, saveIdentity, pagesState, pageAction, applyMenu, completePages, createProposed, contentOf, saveContent,
  featuresState, setFeature, completeFeatures, previewAlerts, publicationState, publish, skip, goto, saveFormDraft, formats, countryDefaults, DEVICES, percent,
};
