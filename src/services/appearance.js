// KOLAKISA CMS → moteur d'apparence (palier 8) : la configuration visuelle du site public (styles globaux, en-tête, pied de page),
// avec brouillon / aperçu / publication, historique des versions publiées, et rendu réel sur le site.
//
// SOURCE DE VÉRITÉ : les jetons de design (couleurs, polices, tailles, rayons, ombres, boutons, liens, conteneurs) suivent le schéma
// UNIQUE du design system du Page Builder (src/marketing/pages/tokens.js : même validation, mêmes noms --kw-…). Pour le site public
// principal ils vivent ici (appearance_configs) ; pour chaque site du Page Builder ils vivent dans mk_sites.tokens (inchangé).
// Cascade (le plus local gagne) : jetons globaux → styles du thème (:where, faible spécificité) → style du modèle → style de
// l'élément (classe posée dans l'inspecteur du Page Builder) → CSS personnalisé du site.
// Sans configuration publiée, le site s'affiche EXACTEMENT comme avant : seules les valeurs modifiées produisent du CSS.
const db = require("../config/database");
const { sameScope } = require("./siteScope"); // R9-2 : égalité de portée « principal ou site » (siteScope)
const tokensLib = require("../marketing/pages/tokens");
const navigation = require("./navigation");
const { UserError } = require("../utils/errors");
const { transaction } = require("../marketing/db/tx");

const MAX_REVISIONS = 30;
const DEFAULT_TOKENS = tokensLib.normalizeTokens({});

// ---------- Défauts : reproduisent à l'identique l'en-tête et le pied de page d'origine du site ----------
const DEFAULT_HEADER = Object.freeze({
  logo: { mode: "text", text: "KOLAKISA", mediaId: null, alt: "" },
  search: true, cart: true, account: true,
  announcement: { enabled: false, text: "", url: "" },
  cta: { enabled: false, label: "", url: "", style: "primary" },
  mobile: { showCta: true },
});
const DEFAULT_FOOTER = Object.freeze({
  brand: { mode: "text", text: "KOLAKISA", mediaId: null, alt: "" },
  tagline: "Mes formations en ligne : apprenez à votre rythme, où que vous soyez.",
  copyright: "KOLAKISA © {année} — projet pédagogique, aucun paiement réel n'est traité.",
  cookies: true,
});
const CTA_STYLES = ["primary", "secondary", "outline"];

const line = (v, max) => String(v ?? "").replace(/[\u0000-\u001F\u007F]/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
const bool = (v, fallback) => (v === undefined ? fallback : v === true || v === "1" || v === "on" || v === 1 || v === "true");
function cleanLink(url, what) {
  const u = String(url ?? "").trim();
  if (!u) return "";
  try { return navigation.cleanUrl(u); } catch (e) { throw new UserError(`${what} : ${e.message}`); }
}
function mediaExists(id) {
  return Number.isInteger(id) && id > 0 && db.prepare("SELECT 1 FROM mk_media WHERE id = ? AND type = 'image' AND deleted_at IS NULL").get(id);
}
function normalizeBrand(src, base, { allowHeader = false } = {}) {
  const modes = allowHeader ? ["text", "image", "header"] : ["text", "image"];
  const mode = modes.includes(src.mode) ? src.mode : base.mode;
  let mediaId = src.mediaId === undefined ? base.mediaId : (src.mediaId === null || src.mediaId === "" ? null : Number(src.mediaId));
  if (mode === "image") {
    if (!mediaExists(mediaId)) throw new UserError("Choisissez une image de la médiathèque pour le logo.");
  } else if (mediaId !== null && !mediaExists(mediaId)) mediaId = null;
  return { mode, text: line(src.text === undefined ? base.text : src.text, 40) || base.text, mediaId: mode === "image" ? mediaId : (mediaId || null), alt: line(src.alt === undefined ? base.alt : src.alt, 120) };
}
function normalizeHeader(input = {}, base = DEFAULT_HEADER) {
  const s = input && typeof input === "object" ? input : {};
  const ann = { ...base.announcement, ...(s.announcement || {}) }, cta = { ...base.cta, ...(s.cta || {}) };
  const out = {
    logo: normalizeBrand({ ...base.logo, ...(s.logo || {}) }, base.logo),
    search: bool(s.search, base.search), cart: bool(s.cart, base.cart), account: bool(s.account, base.account),
    announcement: { enabled: bool(ann.enabled, false), text: line(ann.text, 160), url: cleanLink(ann.url, "Adresse de l'annonce") },
    cta: { enabled: bool(cta.enabled, false), label: line(cta.label, 30), url: cleanLink(cta.url, "Adresse du bouton"), style: CTA_STYLES.includes(cta.style) ? cta.style : "primary" },
    mobile: { showCta: bool((s.mobile || {}).showCta, base.mobile.showCta) },
  };
  if (out.announcement.enabled && !out.announcement.text) throw new UserError("Écrivez le texte de l'annonce, ou désactivez-la.");
  if (out.cta.enabled && (!out.cta.label || !out.cta.url)) throw new UserError("Le bouton de l'en-tête a besoin d'un texte et d'une adresse, ou désactivez-le.");
  return out;
}
function normalizeFooter(input = {}, base = DEFAULT_FOOTER) {
  const s = input && typeof input === "object" ? input : {};
  return {
    brand: normalizeBrand({ ...base.brand, ...(s.brand || {}) }, base.brand, { allowHeader: true }),
    tagline: line(s.tagline === undefined ? base.tagline : s.tagline, 200),
    copyright: line(s.copyright === undefined ? base.copyright : s.copyright, 200),
    cookies: bool(s.cookies, base.cookies),
  };
}
// Configuration complète et valide ; strict : refuser les valeurs invalides au lieu de les remplacer
function normalizeConfig(input = {}, { strict = true, siteId } = {}) {
  const s = input && typeof input === "object" ? input : {};
  return {
    tokens: tokensLib.normalizeTokens(s.tokens || {}, { strict, fontScope: siteId === undefined ? undefined : { siteId } }),
    header: normalizeHeader(s.header || {}),
    footer: normalizeFooter(s.footer || {}),
    singlePost: (() => { try { return require("./singlePost").compact(s.singlePost, { strict }); } catch (e) { if (strict && e && e.isSinglePost) throw new UserError(e.message); return null; } })(),
  };
}
const DEFAULT_CONFIG = Object.freeze({ tokens: DEFAULT_TOKENS, header: DEFAULT_HEADER, footer: DEFAULT_FOOTER, singlePost: null });

// ---------- Lecture / écriture ----------
const row = (siteId = null) => db.prepare(`SELECT * FROM appearance_configs WHERE ${sameScope("site_id")}`).get(siteId);
const parse = (text) => { try { return text ? JSON.parse(text) : null; } catch { return null; } };
function repair(cfg) { try { return normalizeConfig(cfg, { strict: false }); } catch { return normalizeConfig({}, { strict: false }); } }
// État d'un site : configuration publiée (ou d'origine), brouillon éventuel, différences
function state(siteId = null) {
  const r = row(siteId);
  const published = r && r.published ? repair(parse(r.published)) : null;
  const draft = r && r.draft ? repair(parse(r.draft)) : null;
  const effective = draft || published || DEFAULT_CONFIG;
  return {
    hasPublished: Boolean(published), hasDraft: Boolean(draft) && JSON.stringify(draft) !== JSON.stringify(published || DEFAULT_CONFIG),
    published: published || DEFAULT_CONFIG, draft: effective, revision: r ? r.revision : 0,
    publishedAt: r ? r.published_at : null, draftAt: r ? r.draft_at : null, draftRev: r ? r.draft_rev : 0,
  };
}
// Enregistre une partie du brouillon (« tokens » | « header » | « footer ») ; le reste du brouillon est conservé
// baseRev : version du brouillon que la personne a sous les yeux ; si quelqu'un l'a modifié entre-temps, rien n'est écrasé (conflit)
function assertFresh(st, baseRev) {
  if (baseRev === undefined || baseRev === null || baseRev === "") return;
  if (Number(baseRev) !== st.draftRev) throw new UserError("Le brouillon de l'apparence a été modifié depuis que vous l'avez ouvert (par vous dans un autre onglet, ou par une autre personne). Rechargez la page pour voir la version la plus récente avant d'enregistrer.");
}
function saveDraft(siteId, section, data, userId = null, { baseRev } = {}) {
  if (!["tokens", "header", "footer"].includes(section)) throw new UserError("Section inconnue.");
  const st = state(siteId);
  assertFresh(st, baseRev);
  const next = { ...st.draft };
  if (section === "tokens") {
    next.tokens = tokensLib.normalizeTokens(mergeTokens(st.draft.tokens, data), { strict: true, fontScope: { siteId } });
    assertAccepted(data, next.tokens, []);
  }
  else if (section === "header") next.header = normalizeHeader(data, st.draft.header);
  else next.footer = normalizeFooter(data, st.draft.footer);
  const normalized = normalizeConfig(next, { siteId });
  writeDraft(siteId, normalized, userId);
  if (siteId === null) require("./revisions").hooks.appearanceDraft(normalized, userId);
  return state(siteId);
}
function writeDraft(siteId, config, userId) {
  db.prepare(`INSERT INTO appearance_configs (site_id, draft, draft_by, draft_at, draft_rev) VALUES (?, ?, ?, datetime('now'), 1)
    ON CONFLICT (COALESCE(site_id, 0)) DO UPDATE SET draft = excluded.draft, draft_by = excluded.draft_by, draft_at = excluded.draft_at, draft_rev = appearance_configs.draft_rev + 1, updated_at = datetime('now')`).run(siteId, JSON.stringify(config), userId);
}
// Remplace tout le brouillon (restauration d'une ancienne version) : revalidé comme une saisie
function setDraft(siteId, config, userId = null) {
  writeDraft(siteId, normalizeConfig(config, { strict: false }), userId);
  return state(siteId);
}
// Fusion profonde (les champs envoyés remplacent, les autres restent)
function mergeTokens(base, patch) {
  const out = JSON.parse(JSON.stringify(base));
  const walk = (dst, src) => { for (const [k, v] of Object.entries(src || {})) { if (v && typeof v === "object" && !Array.isArray(v) && dst[k] && typeof dst[k] === "object" && !Array.isArray(dst[k])) walk(dst[k], v); else dst[k] = v; } };
  walk(out, patch);
  return out;
}
// Une valeur envoyée que la validation a remplacée par une autre (hors limites, inconnue) est REFUSÉE, jamais corrigée en silence
function assertAccepted(patch, normalized, path) {
  for (const [k, v] of Object.entries(patch || {})) {
    const there = normalized == null ? undefined : normalized[k];
    if (v && typeof v === "object" && !Array.isArray(v)) { assertAccepted(v, there, [...path, k]); continue; }
    if (v === "" || v === null || v === undefined || there === undefined) continue;
    const same = typeof v === "number" ? Number(there) === v : String(there).toLowerCase() === String(v).toLowerCase();
    if (!same) throw new UserError(`Valeur refusée pour « ${[...path, k].join(" › ")} » (${String(v).slice(0, 30)}) : hors des limites autorisées.`);
  }
}
function discardDraft(siteId = null) {
  db.prepare(`UPDATE appearance_configs SET draft = NULL, draft_by = NULL, draft_at = NULL, updated_at = datetime('now') WHERE ${sameScope("site_id")}`).run(siteId);
  return state(siteId);
}
// Publier : le brouillon devient la version en ligne ; la feuille de style est compilée une fois ; la version est archivée
function publish(siteId, userId = null, note = "", { baseRev } = {}) {
  const st = state(siteId);
  assertFresh(st, baseRev);
  if (!st.hasDraft) throw new UserError("Rien à publier : le brouillon est identique à la version en ligne.");
  const cfg = normalizeConfig(st.draft, { siteId });
  const css = buildCss(cfg);
  transaction(db, () => {
    db.prepare(`INSERT INTO appearance_configs (site_id, published, published_css, revision, published_by, published_at, draft, draft_by, draft_at)
      VALUES (?, ?, ?, 1, ?, datetime('now'), NULL, NULL, NULL)
      ON CONFLICT (COALESCE(site_id, 0)) DO UPDATE SET published = excluded.published, published_css = excluded.published_css, revision = appearance_configs.revision + 1,
        published_by = excluded.published_by, published_at = excluded.published_at, draft = NULL, draft_by = NULL, draft_at = NULL, updated_at = datetime('now')`).run(siteId, JSON.stringify(cfg), css, userId);
    db.prepare("INSERT INTO appearance_revisions (site_id, config, note, created_by) VALUES (?, ?, ?, ?)").run(siteId, JSON.stringify(cfg), line(note, 120), userId);
    db.prepare(`DELETE FROM appearance_revisions WHERE ${sameScope("site_id")} AND id NOT IN (SELECT id FROM appearance_revisions WHERE ${sameScope("site_id")} ORDER BY id DESC LIMIT ?)`).run(siteId, siteId, MAX_REVISIONS);
  });
  version += 1;
  return state(siteId);
}
// Retour à l'apparence d'origine : le site reprend son affichage historique (la version publiée est retirée, l'historique reste)
function unpublish(siteId = null) {
  db.prepare(`UPDATE appearance_configs SET published = NULL, published_css = '', revision = revision + 1, published_at = NULL, updated_at = datetime('now') WHERE ${sameScope("site_id")}`).run(siteId);
  version += 1;
  return state(siteId);
}
const history = (siteId = null, limit = 10) => db.prepare(`SELECT r.id, r.note, r.created_at, u.username AS by FROM appearance_revisions r LEFT JOIN users u ON u.id = r.created_by WHERE ${sameScope("r.site_id")} ORDER BY r.id DESC LIMIT ?`).all(siteId, limit);
// Une ancienne version revient dans le BROUILLON (rien n'est publié tant qu'on ne publie pas)
function restore(siteId, revisionId, userId = null) {
  const r = db.prepare(`SELECT id FROM appearance_revisions WHERE id = ? AND ${sameScope("site_id")}`).get(Number(revisionId), siteId);
  if (!r) throw new UserError("Version introuvable.");
  // Historique commun (palier 10) : le brouillon actuel est d'abord conservé, la restauration est tracée
  require("./revisions").adapter("appearance").restore({ userId }, 0, `p:${r.id}`);
  return state(siteId);
}

// ---------- Jetons publiés (utilisés aussi par les modèles de thème rendus par le Page Builder) ----------
let version = 0; // incrémenté à chaque publication : invalide les mémos de processus
let memo = { v: -1, parts: null };
function publishedTokens() {
  const r = row(null);
  return r && r.published ? repair(parse(r.published)).tokens : null;
}

// ---------- CSS du site public : traduction des jetons en variables et règles du site (seules les valeurs modifiées) ----------
const hex = (c) => { const n = parseInt(c.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
const toHex = (rgb) => `#${rgb.map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0")).join("")}`;
const darken = (c, f) => toHex(hex(c).map((v) => v * (1 - f)));
const tint = (c, f) => toHex(hex(c).map((v) => v + (255 - v) * f));
const rgba = (c, a) => `rgba(${hex(c).join(", ")}, ${a})`;
function buildCss(cfg) {
  const t = cfg.tokens, D = DEFAULT_TOKENS;
  const root = [], rules = [];
  const v = (name, value) => root.push(`${name}:${value}`);
  const rule = (sel, decls) => { const d = decls.filter(Boolean).join(";"); if (d) rules.push(`${sel}{${d}}`); };
  const col = (key) => t.colors[key] !== D.colors[key];
  // Couleurs : « principale » = couleur d'action du site (boutons, liens), « secondaire » = bleu nuit (titres, pied de page)
  if (col("primary")) { const p = t.colors.primary; v("--accent", p); v("--accent-dark", darken(p, 0.12)); v("--accent-light", tint(p, 0.88)); v("--ring", `0 0 0 4px ${rgba(p, 0.16)}`); }
  if (col("secondary")) { const s = t.colors.secondary; v("--primary", s); v("--primary-dark", darken(s, 0.4)); }
  if (col("background")) v("--bg", t.colors.background);
  if (col("surface")) { v("--surface", t.colors.surface); v("--card", t.colors.surface); }
  if (col("text")) v("--text", t.colors.text);
  if (col("muted")) v("--muted", t.colors.muted);
  if (col("success")) v("--success", t.colors.success);
  if (col("error")) v("--danger", t.colors.error);
  if (t.border.color !== D.border.color) v("--border", t.border.color);
  // Typographie
  if (t.fonts.body !== D.fonts.body) v("--font-body", tokensLib.fontStackOf(t.fonts.body));
  if (t.fonts.heading !== D.fonts.heading) v("--font-display", tokensLib.fontStackOf(t.fonts.heading));
  // Rayons, ombres
  if (t.radius.md !== D.radius.md) v("--radius", `${t.radius.md}px`);
  if (t.radius.lg !== D.radius.lg) v("--radius-lg", `${t.radius.lg}px`);
  if (t.shadow.card !== D.shadow.card) v("--shadow-md", tokensLib.SHADOWS[t.shadow.card]);
  // Les jetons eux-mêmes (pour le Page Builder et tout composant qui lit --kw-…)
  const kw = tokensLib.tokensToCss(t);
  // Titres et texte : faible spécificité (:where), donc toute règle de composant l'emporte (cascade documentée en tête de fichier)
  for (const k of ["h1", "h2", "h3"]) {
    const a = t.type[k], d = D.type[k];
    if (a.size !== d.size || a.weight !== d.weight || a.lineHeight !== d.lineHeight) rule(`:where(main ${k}, .article-body ${k})`, [a.size !== d.size ? `font-size:${a.size}px` : "", a.weight !== d.weight ? `font-weight:${a.weight}` : "", a.lineHeight !== d.lineHeight ? `line-height:${a.lineHeight}` : ""]);
  }
  if (t.type.body.size !== D.type.body.size || t.type.body.lineHeight !== D.type.body.lineHeight) rule("body", [t.type.body.size !== D.type.body.size ? `font-size:${t.type.body.size}px` : "", t.type.body.lineHeight !== D.type.body.lineHeight ? `line-height:${t.type.body.lineHeight}` : ""]);
  // Conteneurs
  if (t.sizes.content !== D.sizes.content) rule(".container-wide", [`max-width:${t.sizes.content + 40}px`]);
  if (t.sizes.narrow !== D.sizes.narrow) rule(".container", [`max-width:${t.sizes.narrow + 40}px`]);
  // Boutons
  const b = t.buttons, db_ = D.buttons;
  if (t.radius.button !== D.radius.button) rule(".btn", [`border-radius:${t.radius.button}px`]);
  if (b.paddingY !== null || b.paddingX !== null) rule(".btn:not(.btn-sm)", [b.paddingY !== null ? `padding-block:${b.paddingY}px` : "", b.paddingX !== null ? `padding-inline:${b.paddingX}px` : ""]);
  const colorOf = (c) => (!c ? "" : c.startsWith("token:") ? `var(--kw-${c.slice(6)})` : c);
  rule(".btn-primary", [b.normal.bg ? `background:${colorOf(b.normal.bg)}` : "", b.normal.color ? `color:${colorOf(b.normal.color)}` : "", b.normal.border ? `border-color:${colorOf(b.normal.border)}` : ""]);
  rule(".btn-primary:hover", [b.hover.bg ? `background:${colorOf(b.hover.bg)}` : "", b.hover.color ? `color:${colorOf(b.hover.color)}` : "", b.hover.border ? `border-color:${colorOf(b.hover.border)}` : ""]);
  rule(".btn:focus-visible", [b.focus.color ? `outline:${b.focus.width || 2}px solid ${colorOf(b.focus.color)}` : "", b.focus.offset !== null ? `outline-offset:${b.focus.offset}px` : ""]);
  void db_;
  // Liens du contenu
  const l = t.link;
  rule(":where(main) a:where(:not([class]))", [l.color ? `color:${colorOf(l.color)}` : "", l.underline === "always" ? "text-decoration:underline" : l.underline === "none" ? "text-decoration:none" : ""]);
  rule(":where(main) a:where(:not([class])):hover", [l.hoverColor ? `color:${colorOf(l.hoverColor)}` : "", l.underline === "hover" ? "text-decoration:underline" : ""]);
  const decl = root.length ? `:root{${root.join(";")}}` : "";
  const hasAny = decl || rules.length;
  // Polices de la bibliothèque choisies pour le site : leurs règles @font-face sont livrées avec la feuille
  // (les polices TÉLÉVERSÉES ne sont pas figées ici : leurs règles sont ajoutées à chaque rendu par parts(), pour suivre les variantes ajoutées ou retirées)
  const faces = hasAny ? require("../utils/fontLibrary").faceCssFor(`${decl}:root{${kw}}`) : "";
  return hasAny ? `${faces}${decl}:root{${kw}}${rules.join("")}` : "";
}

// ---------- Rendu public : une requête = au plus une lecture, mémorisée jusqu'à la prochaine publication ----------
function logoPath(mediaId) {
  if (!mediaId) return null;
  const r = db.prepare("SELECT path, width, height FROM mk_media WHERE id = ? AND type = 'image' AND deleted_at IS NULL").get(mediaId);
  return r ? { src: r.path, width: r.width || null, height: r.height || null } : null;
}
function year() { return String(new Date().getFullYear()); }
// parts(preview) : { css, header, footer, preview } — la version publiée (mémorisée) ou, en aperçu, le brouillon
// override : configuration complète fournie par l'appelant (aperçu des styles : rien n'est lu en base ni mémorisé)
function parts({ preview = false, override = null } = {}) {
  let base;
  if (override) {
    base = { css: buildCss(override), cfg: override };
  } else if (preview) {
    const st = state(null);
    base = { css: buildCss(normalizeConfig(st.draft, { strict: false })), cfg: st.draft };
  } else {
    if (memo.v !== version || !memo.parts) {
      const r = row(null);
      const cfg = r && r.published ? repair(parse(r.published)) : null;
      memo = { v: version, parts: { css: cfg ? r.published_css || buildCss(cfg) : "", cfg: cfg || DEFAULT_CONFIG, rev: r ? r.revision : 0 } };
    }
    base = memo.parts;
  }
  const cfg = base.cfg;
  const hl = logoPath(cfg.header.logo.mediaId), fb = cfg.footer.brand.mode === "header" ? cfg.header.logo : cfg.footer.brand, fl = logoPath(fb.mediaId);
  return {
    preview, css: [require("../utils/fontLibrary").customFaceCssFor(base.css, null), String(base.css || "")].filter(Boolean).join("\n").replace(/[<>]/g, ""),
    header: { ...cfg.header, logoImage: cfg.header.logo.mode === "image" ? hl : null },
    footer: { ...cfg.footer, brandResolved: { mode: fb.mode === "image" && fl ? "image" : "text", text: fb.text, alt: fb.alt, image: fb.mode === "image" ? fl : null }, copyrightText: cfg.footer.copyright.replace(/\{ann[ée]e\}/gi, year()) },
  };
}
// Mémo invalidé par toute écriture de l'apparence (publication, retrait) — voir `version`
const bump = () => { version += 1; };

// ---------- Patterns enregistrés (sections du Page Builder réutilisables) ----------
const PATTERN_CATEGORY = "Mes patterns";
function patternRows(siteId = null) {
  return db.prepare(`SELECT id, name, category, description, mode, sections, source_page_id, created_at FROM appearance_patterns WHERE ${sameScope("site_id")} AND deleted_at IS NULL ORDER BY name COLLATE NOCASE`).all(siteId);
}
// Patterns pour le sélecteur « Ajouter » du Page Builder (même forme que le catalogue intégré : key, category, label, sections)
function patternBlocks(siteId = null) {
  // Les patterns « globaux » (sans site) sont proposés dans tous les éditeurs ; ceux d'un site seulement dans les pages de ce site
  const rows = db.prepare("SELECT id, name, category, sections FROM appearance_patterns WHERE (site_id IS NULL OR site_id = ?) AND deleted_at IS NULL ORDER BY name COLLATE NOCASE").all(siteId ?? 0);
  return rows.map((p) => ({ key: `user-${p.id}`, category: p.category || PATTERN_CATEGORY, label: p.name, sections: parse(p.sections) || [], user: true }));
}
function createPattern({ name, description = "", sections, siteId = null, sourcePageId = null, userId = null }) {
  const nm = line(name, 60);
  if (!nm) throw new UserError("Donnez un nom au pattern.");
  if (!Array.isArray(sections) || !sections.length) throw new UserError("Le pattern ne contient aucune section.");
  if (db.prepare(`SELECT 1 FROM appearance_patterns WHERE ${sameScope("site_id")} AND name = ? COLLATE NOCASE AND deleted_at IS NULL`).get(siteId, nm)) throw new UserError(`Un pattern « ${nm} » existe déjà.`);
  if (db.prepare("SELECT COUNT(*) n FROM appearance_patterns").get().n >= 200) throw new UserError("200 patterns au plus.");
  const id = Number(db.prepare("INSERT INTO appearance_patterns (site_id, name, description, sections, source_page_id, created_by) VALUES (?, ?, ?, ?, ?, ?)")
    .run(siteId, nm, line(description, 200), JSON.stringify(sections), sourcePageId, userId).lastInsertRowid);
  require("./revisions").hooks.pattern(id, siteId, "create", "Création du pattern", db.prepare("SELECT * FROM appearance_patterns WHERE id = ?").get(id), userId);
  return id;
}
function renamePattern(id, { name, description }, userId = null) {
  const p = db.prepare("SELECT * FROM appearance_patterns WHERE id = ? AND deleted_at IS NULL").get(id);
  if (!p) throw new UserError("Pattern introuvable.");
  const nm = line(name ?? p.name, 60);
  if (!nm) throw new UserError("Donnez un nom au pattern.");
  if (db.prepare(`SELECT 1 FROM appearance_patterns WHERE ${sameScope("site_id")} AND name = ? COLLATE NOCASE AND id <> ? AND deleted_at IS NULL`).get(p.site_id, nm, id)) throw new UserError(`Un pattern « ${nm} » existe déjà.`);
  db.prepare("UPDATE appearance_patterns SET name = ?, description = ?, updated_at = datetime('now') WHERE id = ?").run(nm, line(description ?? p.description, 200), id);
  require("./revisions").hooks.pattern(id, p.site_id, "rename", "Modification des informations du pattern", db.prepare("SELECT * FROM appearance_patterns WHERE id = ?").get(id), userId);
}
// Corbeille (palier 10) : un pattern supprimé est mis de côté, restaurable ; la suppression définitive est un acte distinct
function deletePattern(id, userId = null) {
  const p = db.prepare("SELECT * FROM appearance_patterns WHERE id = ? AND deleted_at IS NULL").get(id);
  if (!p) throw new UserError("Pattern introuvable.");
  db.prepare("UPDATE appearance_patterns SET deleted_at = datetime('now'), deleted_by = ? WHERE id = ?").run(userId, id);
  require("./revisions").hooks.pattern(id, p.site_id, "trash", "Mis à la corbeille", p, userId);
  return p;
}
function restorePattern(id, userId = null) {
  const p = db.prepare("SELECT * FROM appearance_patterns WHERE id = ? AND deleted_at IS NOT NULL").get(id);
  if (!p) throw new UserError("Ce pattern n'est pas dans la corbeille.");
  if (db.prepare(`SELECT 1 FROM appearance_patterns WHERE ${sameScope("site_id")} AND name = ? COLLATE NOCASE AND id <> ? AND deleted_at IS NULL`).get(p.site_id, p.name, id)) throw new UserError(`Un pattern « ${p.name} » existe déjà : renommez l'un des deux avant de restaurer.`);
  db.prepare("UPDATE appearance_patterns SET deleted_at = NULL, deleted_by = NULL WHERE id = ?").run(id);
  require("./revisions").hooks.pattern(id, p.site_id, "restore_trash", "Restauré depuis la corbeille", p, userId);
  return p;
}
function purgePattern(id) {
  const p = db.prepare("SELECT name FROM appearance_patterns WHERE id = ? AND deleted_at IS NOT NULL").get(id);
  if (!p) throw new UserError("Mettez d'abord le pattern à la corbeille : il ne se supprime définitivement que depuis la corbeille.");
  transaction(db, () => { db.prepare("DELETE FROM cms_revisions WHERE content_type = 'pattern' AND content_id = ?").run(id); db.prepare("DELETE FROM appearance_patterns WHERE id = ?").run(id); });
  return p;
}

module.exports = {
  DEFAULT_CONFIG, DEFAULT_HEADER, DEFAULT_FOOTER, CTA_STYLES, MAX_REVISIONS, PATTERN_CATEGORY,
  normalizeConfig, normalizeHeader, normalizeFooter, state, saveDraft, setDraft, discardDraft, publish, unpublish, history, restore, publishedTokens, buildCss, parts, bump,
  patternRows, patternBlocks, createPattern, renamePattern, deletePattern, restorePattern, purgePattern,
};
