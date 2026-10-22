// KOLAKISA CMS → Apparence → Polices : bibliothèque de polices PAR SITE (Google Fonts auto-hébergées + polices téléversées).
//
// Un seul moteur typographique existe (utils/fontLibrary.js : manifeste de 1 775 familles Google Fonts hébergées avec l'application, Font Manager).
// Ce service ajoute ce qui manquait : QUELLES polices appartiennent à QUEL site.
//   • « Installer » une famille Google Fonts = la rattacher à UN site avec les variantes retenues. Les fichiers WOFF2 sont déjà copiés sur le serveur
//     (aucun appel à un service tiers, aucune donnée de visiteur transmise à Google) ; leur présence est vérifiée avant l'enregistrement.
//   • « Téléverser » = importer des fichiers WOFF2 / WOFF / TTF / OTF. Le format réel est lu dans les octets (utils/fontFile.js), jamais déduit de l'extension.
//     Chaque fichier est rangé sous un nom aléatoire HORS du dossier public ; il n'appartient qu'à une famille d'un site.
// Portée : site_id NULL = site principal ; chaque lecture et chaque écriture porte sur UN site précis, fourni par l'appelant depuis le contexte vérifié de la
// requête. Les droits (permissions, accès limité à un site) sont contrôlés par les routes.
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const db = require("../config/database");
const paths = require("../config/paths");
const fontLib = require("../utils/fontLibrary");
const fontFile = require("../utils/fontFile");
const { sameScope } = require("./siteScope");
const { transaction } = require("../marketing/db/tx");
const { recordAudit } = require("../marketing/audit");
const { UserError } = require("../utils/errors");

const CATEGORIES = [["sans-serif", "Sans empattement"], ["serif", "Serif"], ["display", "Display"], ["cursive", "Manuscrite"], ["monospace", "Monospace"]];
const CATEGORY_KEYS = CATEGORIES.map((c) => c[0]);
const STORE = path.join(paths.uploadsRoot, "fonts");

// Limites (configurables par variables d'environnement, bornées)
const num = (name, fallback, lo, hi) => { const n = Number(process.env[name]); return Number.isFinite(n) ? Math.min(hi, Math.max(lo, Math.floor(n))) : fallback; };
const limits = () => ({
  fileBytes: Math.min(fontFile.MAX_FILE, num("FONT_MAX_FILE_MB", 5, 1, 5) * 1048576),
  siteBytes: num("FONT_SITE_QUOTA_MB", 60, 1, 1024) * 1048576,
  perBatch: num("FONT_MAX_FILES_PER_UPLOAD", 12, 1, 40),
  perFamily: 24,
  families: num("FONT_MAX_FAMILIES_PER_SITE", 80, 1, 500),
});

const scope = (siteId) => { if (siteId === null || siteId === undefined) return null; if (Number.isInteger(siteId) && siteId > 0) return siteId; throw new TypeError("Site invalide."); };
const pages = () => require("../marketing/pages");
const parse = (t, f) => { try { const v = JSON.parse(t); return v == null ? f : v; } catch { return f; } };
const audit = (ctx, siteId, action, key, metadata = {}) => {
  try { recordAudit(db, { organizationId: ctx.organizationId, userId: ctx.userId ?? null, action, resourceType: "font", resourceId: String(key), siteId, metadata }); } catch { /* la journalisation ne bloque jamais l'opération */ }
};
// Le site visé existe, appartient à l'organisation et accepte les écritures ; null = site principal
function writableSite(ctx, siteId) {
  const id = scope(siteId);
  if (id !== null) return pages().requireSite(ctx, id, { active: true });
  return null;
}

// ---------- Lecture ----------
const rowOf = (siteId, id) => (Number.isInteger(id) && id > 0 ? db.prepare(`SELECT * FROM cms_fonts WHERE id = ? AND ${sameScope("site_id")}`).get(id, scope(siteId)) : undefined);
const rowByKey = (siteId, key) => db.prepare(`SELECT * FROM cms_fonts WHERE ${sameScope("site_id")} AND font_key = ?`).get(scope(siteId), String(key));
const filesOf = (fontId) => db.prepare("SELECT id, font_id, weight, weight_max, style, format, original_name, size, sha256, created_at FROM cms_font_files WHERE font_id = ? ORDER BY style, weight, id").all(fontId);
const stackFor = (r) => (r.source === "upload" ? `'${cssName(r)}', ${fontLib.customFallback(r.category)}` : (fontLib.byId(r.font_key) ? fontLib.stack(fontLib.byId(r.font_key)) : `'${r.family}', ${fontLib.customFallback(r.category)}`));
const safeName = (s) => String(s || "").replace(/['"\\;{}<>`\u0000-\u001f]/g, "").trim().slice(0, 60);
const cssName = (r) => `${safeName(r.family)} (u${r.id})`;

// Entrée affichable : variantes lisibles, nombre de fichiers, usage du site
function present(r, { withUsage = false } = {}) {
  const lib = r.source === "google" ? fontLib.byId(r.font_key) : null;
  const files = r.source === "upload" ? filesOf(r.id) : [];
  const variants = r.source === "upload"
    ? files.map((f) => ({ weight: f.weight, weightMax: f.weight_max, style: f.style, format: f.format, size: f.size, fileId: f.id, name: f.original_name }))
    : parse(r.variants, []).map((v) => ({ weight: v.weight, style: v.style, format: "woff2" }));
  const out = {
    id: r.id, key: r.font_key, source: r.source, family: r.family, category: r.category, status: r.status, installedAt: r.installed_at, updatedAt: r.updated_at,
    stack: stackFor(r), variants, variable: Boolean(lib ? lib.variable : files.some((f) => f.weight_max)), bytes: files.reduce((n, f) => n + f.size, 0),
    license: lib ? lib.license : null, sourceUrl: lib ? lib.sourceUrl : null, missing: r.source === "google" && !lib,
  };
  if (withUsage) { out.usage = usageOf(r.site_id, r.font_key); out.used = out.usage.length > 0; }
  return out;
}

const norm = (s) => String(s || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
const SORTS = { nom: "family COLLATE NOCASE ASC", recent: "installed_at DESC, id DESC", ancien: "installed_at ASC, id ASC" };

// Bibliothèque du site : filtres combinables (recherche sans accent, origine, catégorie, statut), tri, pagination
function list(siteId, { q = "", source = "", category = "", status = "", sort = "nom", page = 1, perPage = 24, usedOnly = false } = {}) {
  let rows = db.prepare(`SELECT * FROM cms_fonts WHERE ${sameScope("site_id")}`).all(scope(siteId));
  const query = norm(q).trim();
  if (query) rows = rows.filter((r) => norm(r.family).includes(query));
  if (source === "google" || source === "upload") rows = rows.filter((r) => r.source === source);
  if (CATEGORY_KEYS.includes(category)) rows = rows.filter((r) => r.category === category);
  if (status === "active" || status === "disabled") rows = rows.filter((r) => r.status === status);
  const used = usedKeys(siteId);
  if (usedOnly) rows = rows.filter((r) => used.has(r.font_key));
  const key = Object.hasOwn(SORTS, sort) ? sort : "nom";
  rows.sort((a, b) => (key === "nom" ? a.family.localeCompare(b.family, "fr", { sensitivity: "base" }) : key === "recent" ? (b.installed_at + String(b.id).padStart(12, "0")).localeCompare(a.installed_at + String(a.id).padStart(12, "0")) : (a.installed_at + String(a.id).padStart(12, "0")).localeCompare(b.installed_at + String(b.id).padStart(12, "0"))));
  const total = rows.length, size = Math.min(100, Math.max(1, Number(perPage) || 24));
  const pageCount = Math.max(1, Math.ceil(total / size)), p = Math.min(pageCount, Math.max(1, Math.floor(Number(page)) || 1));
  return { total, page: p, pageCount, perPage: size, rows: rows.slice((p - 1) * size, p * size).map((r) => ({ ...present(r), used: used.has(r.font_key) })) };
}
const counts = (siteId) => {
  const r = db.prepare(`SELECT COUNT(*) total, SUM(source = 'google') google, SUM(source = 'upload') upload, SUM(status = 'disabled') disabled FROM cms_fonts WHERE ${sameScope("site_id")}`).get(scope(siteId));
  const variants = db.prepare(`SELECT COUNT(*) n FROM cms_font_files f JOIN cms_fonts t ON t.id = f.font_id WHERE ${sameScope("t.site_id")}`).get(scope(siteId)).n
    + db.prepare(`SELECT variants FROM cms_fonts WHERE ${sameScope("site_id")} AND source = 'google'`).all(scope(siteId)).reduce((n, x) => n + parse(x.variants, []).length, 0);
  return { total: r.total || 0, google: r.google || 0, upload: r.upload || 0, disabled: r.disabled || 0, variants };
};
const get = (siteId, id) => { const r = rowOf(siteId, Number(id)); return r ? present(r, { withUsage: true }) : null; };

// ---------- Usage : où le site se sert de cette police ----------
// Une seule lecture des textes du site (réglages typographiques, pages), puis recherche de l'identifiant entre guillemets : la même passe sert une police ou toute la bibliothèque.
function usageIndex(siteId) {
  const sid = scope(siteId), sources = [];
  if (sid === null) {
    const c = db.prepare("SELECT published, draft FROM appearance_configs WHERE site_id IS NULL").get();
    if (c) { sources.push({ text: String(c.published || ""), kind: "reglages", label: "Réglages typographiques du site principal (publiés)" }); sources.push({ text: String(c.draft || ""), kind: "reglages", label: "Réglages typographiques du site principal (brouillon)" }); }
  } else {
    const s = db.prepare("SELECT tokens FROM mk_sites WHERE id = ?").get(sid);
    if (s) sources.push({ text: String(s.tokens || ""), kind: "reglages", label: "Réglages typographiques du site (titres, texte, boutons ou liens)" });
  }
  for (const p of db.prepare(`SELECT id, name, sections, draft, theme FROM mk_landing_pages WHERE ${sameScope("site_id")} AND archived_at IS NULL ORDER BY id`).all(sid)) {
    sources.push({ text: `${p.sections || ""}${p.draft || ""}${p.theme || ""}`, kind: "page", label: `Page « ${p.name} »`, href: `/marketing/pages/${p.id}` });
  }
  return (key) => {
    const k = String(key);
    if (!/^font\.[a-z0-9-]{1,60}$/.test(k)) return [];
    const needle = `"${k}"`;
    return sources.filter((x) => x.text.includes(needle)).slice(0, 20).map(({ kind, label, href }) => ({ kind, label, href }));
  };
}
const usageOf = (siteId, key) => usageIndex(siteId)(key);
// Identifiants de polices utilisés par le site (une seule passe : pour marquer la bibliothèque)
function usedKeys(siteId) {
  const idx = usageIndex(siteId), keys = new Set();
  for (const r of db.prepare(`SELECT font_key FROM cms_fonts WHERE ${sameScope("site_id")}`).all(scope(siteId))) if (idx(r.font_key).length) keys.add(r.font_key);
  return keys;
}

// ---------- Google Fonts : catalogue et installation ----------
const familyView = (f, installed) => ({
  id: f.id, family: f.family, category: f.category, categories: f.categories, variable: Boolean(f.variable), weights: f.weights, styles: f.styles, popularity: f.popularity,
  variantCount: variantList(f).length, stack: fontLib.stack(f), installed: installed ? installed.has(f.id) : false,
});
// Variantes d'une famille : [{ weight, style }] (police variable : les graisses de sa plage, à titre indicatif)
function variantList(f) {
  const out = [];
  for (const style of f.styles && f.styles.length ? f.styles : ["normal"]) {
    const weights = style === "italic" ? (f.italicWeights && f.italicWeights.length ? f.italicWeights : f.weights) : f.weights;
    for (const w of weights || [400]) out.push({ weight: w, style });
  }
  return out;
}
const hasFiles = (f, v) => {
  const files = f.files && f.files[v.style];
  if (!files) return false;
  const name = files.variable && f.axes && f.axes.wght ? files.variable : files[String(v.weight)];
  return Boolean(name) && fs.existsSync(path.join(fontLib.DIR, f.slug, name));
};
const CATALOG_SORTS = { populaire: (a, b) => (a.popularity ?? 9999) - (b.popularity ?? 9999) || a.family.localeCompare(b.family), nom: (a, b) => a.family.localeCompare(b.family, "fr", { sensitivity: "base" }) };
// Catalogue : recherche (sans accent), catégorie, pagination. Les familles déjà installées sur CE site sont signalées.
function catalogPage(siteId, { q = "", category = "", sort = "nom", page = 1, perPage = 20, variable = "" } = {}) {
  const installed = new Set(db.prepare(`SELECT font_key FROM cms_fonts WHERE ${sameScope("site_id")} AND source = 'google'`).all(scope(siteId)).map((r) => r.font_key));
  let all = fontLib.list();
  const query = norm(q).trim();
  if (query) all = all.filter((f) => norm(f.family).includes(query));
  if (category && category !== "all") all = all.filter((f) => (f.categories || [f.category]).includes(category) || f.category === category);
  if (variable === "1") all = all.filter((f) => f.variable);
  all = all.slice().sort(Object.hasOwn(CATALOG_SORTS, sort) ? CATALOG_SORTS[sort] : CATALOG_SORTS.nom);
  const size = Math.min(60, Math.max(1, Number(perPage) || 20)), total = all.length, pageCount = Math.max(1, Math.ceil(total / size));
  const p = Math.min(pageCount, Math.max(1, Math.floor(Number(page)) || 1));
  return { total, page: p, pageCount, perPage: size, rows: all.slice((p - 1) * size, p * size).map((f) => familyView(f, installed)), catalogSize: fontLib.list().length };
}
const catalogFamily = (siteId, id) => {
  const f = fontLib.byId(id);
  if (!f) return null;
  const installed = rowByKey(siteId, f.id);
  return { ...familyView(f, new Set(installed ? [f.id] : [])), variants: variantList(f).map((v) => ({ ...v, available: hasFiles(f, v), chosen: installed ? parse(installed.variants, []).some((x) => x.weight === v.weight && x.style === v.style) : false })), license: f.license, sourceUrl: f.sourceUrl, subset: f.subset, axes: f.axes || null, installedRow: installed ? installed.id : null };
};

// Installe (ou complète) une famille sur un site. Idempotent : réinstaller la même famille fusionne les variantes, sans doublon.
function installGoogle(ctx, siteId, familyId, wanted) {
  writableSite(ctx, siteId);
  const f = fontLib.byId(String(familyId || ""));
  if (!f) throw new UserError("Cette famille n'existe pas dans le catalogue Google Fonts de Kolakisa.");
  const all = variantList(f);
  const normal = all.filter((v) => v.style === "normal");
  const base = normal.find((v) => v.weight === 400) || normal[0] || all[0];
  const bold = normal.find((v) => v.weight === 700);
  const chosen = Array.isArray(wanted) && wanted.length ? wanted : [base, bold].filter(Boolean);
  const picked = [];
  for (const v of chosen) {
    const weight = Number(v.weight), style = v.style === "italic" ? "italic" : "normal";
    const known = all.find((x) => x.weight === weight && x.style === style);
    if (!known) throw new UserError(`La variante ${weight}${style === "italic" ? " italique" : ""} n'existe pas pour « ${f.family} ».`);
    if (!hasFiles(f, known)) throw new UserError(`Le fichier de la variante ${weight}${style === "italic" ? " italique" : ""} de « ${f.family} » est introuvable sur le serveur : installation annulée.`);
    if (!picked.some((x) => x.weight === weight && x.style === style)) picked.push({ weight, style });
  }
  if (!picked.length) throw new UserError("Choisissez au moins une variante à installer.");
  return transaction(db, () => {
    const existing = rowByKey(siteId, f.id);
    if (existing) {
      const have = parse(existing.variants, []);
      const merged = [...have];
      for (const v of picked) if (!merged.some((x) => x.weight === v.weight && x.style === v.style)) merged.push(v);
      const added = merged.length - have.length;
      if (added) { db.prepare("UPDATE cms_fonts SET variants = ?, status = 'active', updated_at = datetime('now') WHERE id = ?").run(JSON.stringify(merged.sort((a, b) => a.style.localeCompare(b.style) || a.weight - b.weight)), existing.id); audit(ctx, siteId, "font.updated", f.id, { added }); }
      return { created: false, added, font: get(siteId, existing.id) };
    }
    if (db.prepare(`SELECT COUNT(*) n FROM cms_fonts WHERE ${sameScope("site_id")}`).get(scope(siteId)).n >= limits().families) throw new UserError(`${limits().families} familles au plus par site : supprimez une police inutilisée avant d'en installer une autre.`);
    const id = Number(db.prepare("INSERT INTO cms_fonts (site_id, source, font_key, family, category, variants, installed_by) VALUES (?, 'google', ?, ?, ?, ?, ?)")
      .run(scope(siteId), f.id, f.family, CATEGORY_KEYS.includes(f.category) ? f.category : "sans-serif", JSON.stringify(picked.sort((a, b) => a.style.localeCompare(b.style) || a.weight - b.weight)), ctx.userId ?? null).lastInsertRowid);
    audit(ctx, siteId, "font.installed", f.id, { source: "google", variants: picked.length });
    return { created: true, added: picked.length, font: get(siteId, id) };
  });
}

// ---------- Téléversement ----------
const sha = (buf) => crypto.createHash("sha256").update(buf).digest("hex");
const siteBytes = (siteId) => db.prepare(`SELECT COALESCE(SUM(f.size), 0) n FROM cms_font_files f JOIN cms_fonts t ON t.id = f.font_id WHERE ${sameScope("t.site_id")}`).get(scope(siteId)).n;
const prettyWeight = (w, max) => (max ? `${w}–${max}` : String(w));

// Importe plusieurs fichiers : chacun est jugé séparément (un refus n'empêche pas les autres). Retourne un compte rendu par fichier.
// entries : [{ name, buffer }] ; options.category : catégorie de repli (la famille ne la déclare pas) ; options.familyName : nom imposé (sinon lu dans le fichier).
function upload(ctx, siteId, entries, { category = "sans-serif", familyName = "" } = {}) {
  writableSite(ctx, siteId);
  const lim = limits();
  if (!Array.isArray(entries) || !entries.length) throw new UserError("Sélectionnez au moins un fichier de police.");
  if (entries.length > lim.perBatch) throw new UserError(`${lim.perBatch} fichiers au plus par envoi.`);
  const cat = CATEGORY_KEYS.includes(category) ? category : "sans-serif";
  const forced = safeName(familyName);
  const results = [];
  for (const entry of entries) {
    const original = String(entry && entry.name || "police").replace(/[\u0000-\u001f\\/]/g, "").slice(0, 120) || "police";
    const res = { name: original, ok: false };
    results.push(res);
    let info, buf;
    try {
      buf = entry.buffer;
      if (!Buffer.isBuffer(buf) || !buf.length) throw new UserError("Fichier vide ou illisible.");
      if (buf.length > lim.fileBytes) throw new UserError(`Fichier trop volumineux (${(buf.length / 1048576).toFixed(1)} Mo ; maximum ${(lim.fileBytes / 1048576).toFixed(0)} Mo).`);
      try { info = fontFile.inspect(buf); } catch (e) { if (e instanceof fontFile.FontError) throw new UserError(e.message); throw e; }
      const family = forced || safeName(info.family);
      if (!family) throw new UserError("Le nom de la famille n'a pu être lu dans le fichier : indiquez-le dans le champ « Nom de la famille ».");
      if (siteBytes(siteId) + buf.length > lim.siteBytes) throw new UserError(`Espace de polices du site épuisé (${Math.round(lim.siteBytes / 1048576)} Mo) : supprimez des polices inutilisées.`);
      const digest = sha(buf);
      const secret = crypto.randomBytes(24).toString("hex");
      const ext = fontFile.EXT[info.format];
      transaction(db, () => {
        let fam = db.prepare(`SELECT * FROM cms_fonts WHERE ${sameScope("site_id")} AND source = 'upload' AND lower(family) = lower(?)`).get(scope(siteId), family);
        if (!fam) {
          if (db.prepare(`SELECT COUNT(*) n FROM cms_fonts WHERE ${sameScope("site_id")}`).get(scope(siteId)).n >= lim.families) throw new UserError(`${lim.families} familles au plus par site : supprimez une police inutilisée.`);
          const id = Number(db.prepare("INSERT INTO cms_fonts (site_id, source, font_key, family, category, variants, installed_by) VALUES (?, 'upload', ?, ?, ?, '[]', ?)")
            .run(scope(siteId), `pending-${secret.slice(0, 12)}`, family, cat, ctx.userId ?? null).lastInsertRowid);
          db.prepare("UPDATE cms_fonts SET font_key = ? WHERE id = ?").run(`font.u${id}`, id);
          fam = db.prepare("SELECT * FROM cms_fonts WHERE id = ?").get(id);
          res.created = true;
        }
        const files = filesOf(fam.id);
        if (files.length >= lim.perFamily) throw new UserError(`${lim.perFamily} variantes au plus par famille.`);
        const same = files.find((x) => x.sha256 === digest);
        if (same) throw new UserError(`Ce fichier est déjà importé dans la famille « ${fam.family} » (variante ${prettyWeight(same.weight, same.weight_max)} ${same.style === "italic" ? "italique" : "normal"}).`);
        const clash = files.find((x) => x.weight === info.weight && x.style === info.style);
        if (clash) throw new UserError(`La famille « ${fam.family} » a déjà une variante ${info.weight} ${info.style === "italic" ? "italique" : "normale"} : supprimez-la d'abord pour la remplacer.`);
        fs.mkdirSync(STORE, { recursive: true });
        const target = path.join(STORE, `${secret}${ext}`);
        fs.writeFileSync(target, buf, { flag: "wx", mode: 0o640 });
        try {
          db.prepare("INSERT INTO cms_font_files (font_id, weight, weight_max, style, format, original_name, secret, size, sha256) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)")
            .run(fam.id, info.weight, info.weightMax, info.style, info.format, original, secret, buf.length, digest);
        } catch (e) { try { fs.unlinkSync(target); } catch { /* déjà absent */ } throw e; }
        db.prepare("UPDATE cms_fonts SET updated_at = datetime('now') WHERE id = ?").run(fam.id);
        res.fontId = fam.id; res.family = fam.family;
      });
      res.ok = true; res.format = info.format; res.weight = info.weight; res.style = info.style; res.variable = info.variable;
      audit(ctx, siteId, "font.uploaded", `font.u${res.fontId}`, { format: info.format, size: buf.length, weight: info.weight, style: info.style });
    } catch (e) {
      if (e instanceof UserError) res.error = e.message;
      else { res.error = "Le fichier n'a pas pu être enregistré. Réessayez ; si le problème persiste, contactez l'équipe technique."; res.internal = true; }
    }
  }
  return results;
}

// ---------- Activer, désactiver, supprimer ----------
function usageError(r, verb) {
  const u = usageOf(r.site_id, r.font_key);
  if (!u.length) return null;
  return new UserError(`« ${r.family} » est utilisée par ce site (${u.slice(0, 3).map((x) => x.label).join(" ; ")}${u.length > 3 ? ` et ${u.length - 3} autre(s)` : ""}). Choisissez d'abord une autre police pour ces éléments, puis ${verb}.`);
}
function setStatus(ctx, siteId, id, status) {
  writableSite(ctx, siteId);
  const r = rowOf(siteId, Number(id));
  if (!r) throw new UserError("Cette police n'existe pas sur ce site.");
  if (status !== "active" && status !== "disabled") throw new UserError("Statut inconnu.");
  if (r.status === status) return present(r);
  if (status === "disabled") { const e = usageError(r, "désactivez-la"); if (e) throw e; }
  db.prepare("UPDATE cms_fonts SET status = ?, updated_at = datetime('now') WHERE id = ?").run(status, r.id);
  audit(ctx, siteId, status === "active" ? "font.enabled" : "font.disabled", r.font_key, {});
  return present(rowOf(siteId, r.id));
}
const unlinkFiles = (secrets) => { for (const f of secrets) for (const ext of Object.values(fontFile.EXT)) { try { fs.unlinkSync(path.join(STORE, `${f}${ext}`)); } catch { /* absent */ } } };
function remove(ctx, siteId, id) {
  writableSite(ctx, siteId);
  const r = rowOf(siteId, Number(id));
  if (!r) throw new UserError("Cette police n'existe pas sur ce site.");
  const e = usageError(r, "supprimez-la"); if (e) throw e;
  const secrets = db.prepare("SELECT secret FROM cms_font_files WHERE font_id = ?").all(r.id).map((x) => x.secret);
  transaction(db, () => { db.prepare("DELETE FROM cms_font_files WHERE font_id = ?").run(r.id); db.prepare("DELETE FROM cms_fonts WHERE id = ?").run(r.id); });
  unlinkFiles(secrets);
  audit(ctx, siteId, "font.removed", r.font_key, { source: r.source, family: r.family });
  return { family: r.family, source: r.source };
}
// Supprime UNE variante téléversée (la famille disparaît avec sa dernière variante, sous les mêmes garde-fous d'usage)
function removeVariant(ctx, siteId, id, fileId) {
  writableSite(ctx, siteId);
  const r = rowOf(siteId, Number(id));
  if (!r || r.source !== "upload") throw new UserError("Cette police n'existe pas sur ce site.");
  const f = db.prepare("SELECT * FROM cms_font_files WHERE id = ? AND font_id = ?").get(Number(fileId), r.id);
  if (!f) throw new UserError("Cette variante n'existe pas.");
  const left = db.prepare("SELECT COUNT(*) n FROM cms_font_files WHERE font_id = ?").get(r.id).n;
  if (left <= 1) { const out = remove(ctx, siteId, id); return { ...out, familyRemoved: true }; }
  db.prepare("DELETE FROM cms_font_files WHERE id = ?").run(f.id);
  db.prepare("UPDATE cms_fonts SET updated_at = datetime('now') WHERE id = ?").run(r.id);
  unlinkFiles([f.secret]);
  audit(ctx, siteId, "font.variant_removed", r.font_key, { weight: f.weight, style: f.style });
  return { family: r.family, familyRemoved: false };
}
function setCategory(ctx, siteId, id, category) {
  writableSite(ctx, siteId);
  const r = rowOf(siteId, Number(id));
  if (!r || r.source !== "upload") throw new UserError("Seules les polices téléversées ont une catégorie modifiable.");
  if (!CATEGORY_KEYS.includes(category)) throw new UserError("Catégorie inconnue.");
  db.prepare("UPDATE cms_fonts SET category = ?, updated_at = datetime('now') WHERE id = ?").run(category, r.id);
  audit(ctx, siteId, "font.updated", r.font_key, { category });
  return present(rowOf(siteId, r.id));
}

// ---------- Intégration : jetons, rendu public, sélecteur des éditeurs ----------
const pad = (id) => Number(String(id).replace(/^font\.u/, ""));
const customRow = (key) => { const n = pad(key); return Number.isInteger(n) && n > 0 ? db.prepare("SELECT * FROM cms_fonts WHERE id = ? AND source = 'upload'").get(n) : undefined; };
// scope = { siteId } : la police doit appartenir à ce site (écriture de jetons) ; sans scope : elle doit seulement exister
function exists(key, scopeArg) {
  const r = customRow(key);
  if (!r) return false;
  if (!scopeArg) return true;
  return (r.site_id ?? 0) === (scopeArg.siteId ?? 0);
}
function stackOf(key) { const r = customRow(key); return r ? stackFor(r) : null; }
// Famille téléversée ACTIVE appartenant au site demandé (sinon null : jamais la police d'un autre site)
function faceRow(id, siteId) {
  const r = db.prepare("SELECT * FROM cms_fonts WHERE id = ? AND source = 'upload' AND status = 'active'").get(Number(id));
  return r && (r.site_id ?? 0) === (siteId ?? 0) ? r : null;
}
// Règles @font-face d'une famille téléversée : une par variante, servies par /polices/site/<secret>.<ext> (adresse non devinable)
function faceCss(r, { base = "" } = {}) {
  const out = [], name = cssName(r);
  for (const f of filesOf(r.id)) {
    const secret = db.prepare("SELECT secret FROM cms_font_files WHERE id = ?").get(f.id).secret;
    const fmt = { woff2: "woff2", woff: "woff", ttf: "truetype", otf: "opentype" }[f.format];
    out.push(`@font-face{font-family:'${name}';font-style:${f.style};font-weight:${f.weight_max ? `${f.weight} ${f.weight_max}` : f.weight};font-display:swap;src:url(${base}/polices/site/${secret}${fontFile.EXT[f.format]}) format("${fmt}")}`);
  }
  return out.join("\n");
}
// Fichier public d'une police ACTIVE (route /polices/site/<secret>.<ext>) ; null sinon
function publicFile(secret, ext) {
  if (!/^[a-f0-9]{48}$/.test(String(secret))) return null;
  const f = db.prepare("SELECT f.format, f.size, t.status FROM cms_font_files f JOIN cms_fonts t ON t.id = f.font_id WHERE f.secret = ?").get(String(secret));
  if (!f || f.status !== "active" || fontFile.EXT[f.format] !== ext) return null;
  const file = path.join(STORE, `${secret}${ext}`);
  return fs.existsSync(file) ? { file, format: f.format, mime: fontFile.MIME[f.format] } : null;
}
// Variantes retenues par le site pour une famille de la bibliothèque (limite les @font-face livrés aux seules graisses installées)
function variantsFor(siteId) {
  const map = new Map(db.prepare(`SELECT font_key, variants FROM cms_fonts WHERE ${sameScope("site_id")} AND source = 'google' AND status = 'active'`).all(scope(siteId)).map((r) => [r.font_key, parse(r.variants, [])]));
  return (fontId) => map.get(fontId);
}
// Polices proposées dans les sélecteurs des réglages du site : téléversées ET actives
function pickerFonts(siteId) {
  return db.prepare(`SELECT * FROM cms_fonts WHERE ${sameScope("site_id")} AND source = 'upload' AND status = 'active' ORDER BY family COLLATE NOCASE`).all(scope(siteId)).map((r) => {
    const files = filesOf(r.id);
    return { id: r.font_key, family: r.family, category: r.category, categories: ["upload"], source: "upload", weights: [...new Set(files.map((f) => f.weight))], styles: [...new Set(files.map((f) => f.style))], variable: files.some((f) => f.weight_max), stack: stackFor(r) };
  });
}
// CSS (@font-face) de toutes les polices téléversées actives du site : aperçus des sélecteurs dans l'administration
function adminFaceCss(siteId) {
  return db.prepare(`SELECT * FROM cms_fonts WHERE ${sameScope("site_id")} AND source = 'upload' AND status = 'active'`).all(scope(siteId)).map((r) => faceCss(r)).join("\n");
}

module.exports = {
  CATEGORIES, CATEGORY_KEYS, STORE, limits, list, counts, get, catalogPage, catalogFamily, installGoogle, upload, setStatus, remove, removeVariant, setCategory, usageOf,
  exists, stackOf, faceRow, faceCss, publicFile, variantsFor, pickerFonts, adminFaceCss, cssName, rowByKey,
};
