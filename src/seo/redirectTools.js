// Outils du module Redirections : groupes, tableau de bord et statistiques, détection des problèmes, simulateur, import avec aperçu (CSV, JSON, .htaccess, Nginx),
// export (CSV, JSON, Apache, Nginx), sauvegarde et restauration, réglages, suggestions de destination pour les 404, propositions de redirection (changements d'adresse).
// Le moteur reste src/seo/redirects.js (une seule écriture des règles) ; ici, tout est calculé à partir des données réelles : aucune valeur inventée.
// PÉRIMÈTRE (scope) : { siteId: <entier> } = règles de CE site seulement ; { siteId: null, visible: [ids] } = espace du site principal (règles communes + sites visibles).
// Le siteId vient de l'appelant (adresse vérifiée par le serveur), jamais d'un champ de formulaire.
const { db, logChange } = require("./store");
const R = require("./redirects");

const own = (scope) => Number.isInteger(scope && scope.siteId) && scope.siteId > 0;
function where(scope, alias = "r") {
  if (own(scope)) return { sql: `${alias}.site_id = ?`, args: [scope.siteId] };
  const ids = (scope && scope.visible) || [];
  return { sql: `(${alias}.site_id IS NULL${ids.length ? ` OR ${alias}.site_id IN (${ids.map(() => "?").join(",")})` : ""})`, args: ids };
}
const scopeKey = (scope) => (own(scope) ? `site_${scope.siteId}` : "main");
const inScope = (scope, siteId) => (own(scope) ? siteId === scope.siteId : siteId === null || siteId === undefined || ((scope && scope.visible) || []).includes(siteId));
const ready = () => R.ensureSchema();

// ----- Réglages (seo_settings : clé / valeur) -----
const DEFAULTS = { autoMode: "auto", retentionDays: 180, allowedHosts: [], deadDays: 90 };
const AUTO_MODES = { auto: "Créer automatiquement (l'ancienne adresse redirige seule)", validate: "Proposer à valider (rien ne redirige tant que vous n'avez pas validé)", off: "Désactivé (l'ancienne adresse n'est plus redirigée)" };
const settingsKey = (scope) => `redirects_settings_${scopeKey(scope)}`;
const memo = new Map();
function getSettings(scope) {
  const k = settingsKey(scope);
  if (memo.has(k)) return memo.get(k);
  let v = {};
  try { const row = db.prepare("SELECT value FROM seo_settings WHERE key = ?").get(k); v = row ? JSON.parse(row.value) : {}; } catch { v = {}; }
  const out = { ...DEFAULTS, ...v, allowedHosts: Array.isArray(v.allowedHosts) ? v.allowedHosts : [] };
  memo.set(k, out);
  return out;
}
const hostOk = (h) => /^(?=.{3,120}$)([a-z0-9-]+\.)+[a-z]{2,}$/i.test(h);
function saveSettings(scope, input, userId) {
  const errors = [];
  const cur = getSettings(scope);
  const next = { ...cur };
  if (input.autoMode !== undefined) { if (AUTO_MODES[input.autoMode]) next.autoMode = input.autoMode; else errors.push("Mode automatique inconnu."); }
  if (input.retentionDays !== undefined) { const n = Number(input.retentionDays); if (Number.isInteger(n) && n >= 30 && n <= 730) next.retentionDays = n; else errors.push("La conservation du journal est de 30 à 730 jours."); }
  if (input.deadDays !== undefined) { const n = Number(input.deadDays); if (Number.isInteger(n) && n >= 30 && n <= 730) next.deadDays = n; else errors.push("Le délai « règle inutilisée » est de 30 à 730 jours."); }
  if (input.allowedHosts !== undefined) {
    const list = String(input.allowedHosts).split(/[\s,;]+/).map((h) => h.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "")).filter(Boolean);
    const bad = list.filter((h) => !hostOk(h));
    if (bad.length) errors.push(`Domaine invalide : ${bad.slice(0, 3).join(", ")}.`); else next.allowedHosts = [...new Set(list)].slice(0, 100);
  }
  if (errors.length) return { ok: false, errors };
  db.prepare("INSERT INTO seo_settings (key, value, updated_by) VALUES (?, ?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = datetime('now'), updated_by = excluded.updated_by").run(settingsKey(scope), JSON.stringify(next), userId ?? null);
  memo.delete(settingsKey(scope));
  logChange({ entityType: "redirect-settings", entityKey: scopeKey(scope), field: "settings", before: JSON.stringify(cur), after: JSON.stringify(next), userId, siteId: own(scope) ? scope.siteId : null });
  return { ok: true, settings: next };
}
const resetMemo = () => memo.clear();
// Mode de création des redirections pour changement d'adresse : lu par le serveur pour le site de la requête (null = site principal)
const autoModeFor = (siteId) => getSettings(Number.isInteger(siteId) && siteId > 0 ? { siteId } : { siteId: null }).autoMode;
// Liste blanche de domaines extérieurs : vide = tous les domaines https:// sont admis (comme avant) pour qui a le droit « redirects.external »
function externalAllowed(siteId, target) {
  let host = "";
  try { host = new URL(String(target)).hostname.toLowerCase(); } catch { return true; }
  const list = getSettings(Number.isInteger(siteId) && siteId > 0 ? { siteId } : { siteId: null }).allowedHosts;
  return !list.length || list.some((h) => host === h || host.endsWith(`.${h}`));
}

// ----- Groupes -----
function listGroups(scope) {
  ready();
  const w = where(scope, "g");
  const rows = db.prepare(`SELECT g.*, (SELECT COUNT(*) FROM seo_redirects r WHERE r.group_id = g.id) AS rules, (SELECT COALESCE(SUM(r.hits), 0) FROM seo_redirects r WHERE r.group_id = g.id) AS hits,
    (SELECT COUNT(*) FROM seo_redirects r WHERE r.group_id = g.id AND r.enabled = 1) AS active FROM seo_redirect_groups g WHERE ${w.sql} ORDER BY g.name COLLATE NOCASE`).all(...w.args);
  return rows;
}
function getGroup(scope, id) { ready(); const g = db.prepare("SELECT * FROM seo_redirect_groups WHERE id = ?").get(Number(id)); return g && inScope(scope, g.site_id) ? g : null; }
function createGroup(scope, { name, description, siteId }, userId) {
  ready();
  const n = String(name || "").trim().slice(0, 80);
  if (n.length < 2) return { ok: false, errors: ["Donnez un nom au groupe (2 caractères au moins)."] };
  const site = own(scope) ? scope.siteId : (Number.isInteger(siteId) && inScope(scope, siteId) ? siteId : null);
  if (db.prepare("SELECT 1 FROM seo_redirect_groups WHERE name = ? COLLATE NOCASE AND COALESCE(site_id, 0) = ?").get(n, site || 0)) return { ok: false, errors: ["Un groupe porte déjà ce nom."] };
  const info = db.prepare("INSERT INTO seo_redirect_groups (site_id, name, description, created_by) VALUES (?, ?, ?, ?)").run(site, n, String(description || "").slice(0, 300), userId ?? null);
  logChange({ entityType: "redirect-group", entityKey: String(info.lastInsertRowid), field: "group", before: null, after: n, userId, siteId: site });
  return { ok: true, id: Number(info.lastInsertRowid) };
}
function updateGroup(scope, id, { name, description, enabled }, userId) {
  const g = getGroup(scope, id);
  if (!g) return { ok: false, errors: ["Groupe introuvable."] };
  const n = name === undefined ? g.name : String(name).trim().slice(0, 80);
  if (n.length < 2) return { ok: false, errors: ["Donnez un nom au groupe (2 caractères au moins)."] };
  const dup = db.prepare("SELECT id FROM seo_redirect_groups WHERE name = ? COLLATE NOCASE AND COALESCE(site_id, 0) = ?").get(n, g.site_id || 0);
  if (dup && dup.id !== g.id) return { ok: false, errors: ["Un groupe porte déjà ce nom."] };
  const en = enabled === undefined ? g.enabled : (enabled === true || enabled === "1" ? 1 : 0);
  db.prepare("UPDATE seo_redirect_groups SET name = ?, description = ?, enabled = ? WHERE id = ?").run(n, description === undefined ? g.description : String(description).slice(0, 300), en, g.id);
  logChange({ entityType: "redirect-group", entityKey: String(g.id), field: "group", before: `${g.name}${g.enabled ? "" : " [désactivé]"}`, after: `${n}${en ? "" : " [désactivé]"}`, userId, siteId: g.site_id });
  R.invalidate();
  return { ok: true };
}
function removeGroup(scope, id, userId) {
  const g = getGroup(scope, id);
  if (!g) return false;
  db.prepare("UPDATE seo_redirects SET group_id = NULL WHERE group_id = ?").run(g.id); // les règles sont conservées, simplement sans groupe
  db.prepare("DELETE FROM seo_redirect_groups WHERE id = ?").run(g.id);
  logChange({ entityType: "redirect-group", entityKey: String(g.id), field: "group", before: g.name, after: null, userId, siteId: g.site_id });
  R.invalidate();
  return true;
}
// Déplacer des règles vers un groupe (ou aucun) : seulement des règles du périmètre et un groupe du même site
function moveToGroup(scope, ids, groupId, userId) {
  ready();
  let moved = 0;
  const g = groupId ? getGroup(scope, groupId) : null;
  if (groupId && !g) return { ok: false, errors: ["Groupe introuvable."], moved: 0 };
  for (const id of ids.map(Number).filter(Number.isInteger).slice(0, 500)) {
    const r = R.get(id);
    if (!r || !inScope(scope, r.site_id) || (g && (g.site_id || 0) !== (r.site_id || 0))) continue;
    db.prepare("UPDATE seo_redirects SET group_id = ?, updated_at = datetime('now') WHERE id = ?").run(g ? g.id : null, id);
    moved++;
  }
  if (moved) { logChange({ entityType: "redirect", entityKey: "groupe", field: "group", before: null, after: `${moved} règle(s) → ${g ? g.name : "sans groupe"}`, userId, siteId: own(scope) ? scope.siteId : null }); R.invalidate(); }
  return { ok: true, moved };
}

// ----- Actions groupées sur des règles -----
function bulk(scope, action, ids, userId, { canDelete = false } = {}) {
  ready();
  const out = { done: 0, skipped: 0, errors: [] };
  const list = ids.map(Number).filter(Number.isInteger).slice(0, 500);
  if (action === "delete") snapshot(scope, "avant une suppression groupée", userId);
  for (const id of list) {
    const r = R.get(id);
    if (!r || !inScope(scope, r.site_id)) { out.skipped++; continue; }
    if (action === "delete") { if (!canDelete) { out.skipped++; continue; } R.remove(id, userId); out.done++; continue; }
    if (action === "enable" || action === "disable") {
      const res = R.update(id, { source: r.source_path, target: r.target, status: r.status, note: r.note, enabled: action === "enable" ? "1" : "0" }, userId);
      if (res.ok) out.done++; else { out.skipped++; out.errors.push(`${r.source_path} : ${res.errors.join(" ")}`); }
    }
  }
  return out;
}

// ----- Tableau de bord -----
const dayAgo = (n) => { const d = new Date(Date.now() - n * 864e5); return d.toLocaleString("sv-SE", { timeZone: "Europe/Paris" }).slice(0, 10); };
function dailySeries(scope, from, to) {
  const w = where(scope, "r");
  return db.prepare(`SELECT d.day, SUM(d.hits) hits FROM seo_redirect_daily d JOIN seo_redirects r ON r.id = d.redirect_id WHERE ${w.sql} AND d.day >= ? AND d.day <= ? GROUP BY d.day ORDER BY d.day`).all(...w.args, from, to);
}
function dashboard(scope, { days = 30 } = {}) {
  ready();
  const n = [7, 30, 90].includes(Number(days)) ? Number(days) : 30;
  const w = where(scope, "r");
  const one = (sql, ...a) => db.prepare(sql).get(...w.args, ...a);
  const total = one(`SELECT COUNT(*) n FROM seo_redirects r WHERE ${w.sql}`).n;
  const active = one(`SELECT COUNT(*) n FROM seo_redirects r WHERE ${w.sql} AND r.enabled = 1`).n;
  const permanent = one(`SELECT COUNT(*) n FROM seo_redirects r WHERE ${w.sql} AND r.status IN (301, 308)`).n;
  const temporary = one(`SELECT COUNT(*) n FROM seo_redirects r WHERE ${w.sql} AND r.status IN (302, 303, 307)`).n;
  const gone = one(`SELECT COUNT(*) n FROM seo_redirects r WHERE ${w.sql} AND r.status IN (410, 451)`).n;
  const hitsAll = one(`SELECT COALESCE(SUM(r.hits), 0) n FROM seo_redirects r WHERE ${w.sql}`).n;
  const to = dayAgo(0), from = dayAgo(n - 1), prevTo = dayAgo(n), prevFrom = dayAgo(2 * n - 1);
  const series = dailySeries(scope, from, to), prev = dailySeries(scope, prevFrom, prevTo);
  const sum = (a) => a.reduce((t, x) => t + x.hits, 0);
  const byDay = new Map(series.map((x) => [x.day, x.hits]));
  const filled = Array.from({ length: n }, (_, i) => { const day = dayAgo(n - 1 - i); return { day, hits: byDay.get(day) || 0 }; });
  const top = db.prepare(`SELECT r.id, r.source_path, r.target, r.status, r.hits, r.last_hit_at, r.match_type FROM seo_redirects r WHERE ${w.sql} AND r.hits > 0 ORDER BY r.hits DESC, r.id LIMIT 8`).all(...w.args);
  const recentCreated = db.prepare(`SELECT r.id, r.source_path, r.target, r.status, r.created_at FROM seo_redirects r WHERE ${w.sql} ORDER BY r.id DESC LIMIT 5`).all(...w.args);
  const recentEdited = db.prepare(`SELECT r.id, r.source_path, r.target, r.status, r.updated_at FROM seo_redirects r WHERE ${w.sql} AND r.updated_at > r.created_at ORDER BY r.updated_at DESC LIMIT 5`).all(...w.args);
  const nf = notFoundCount(scope);
  const problems = analyze(scope);
  const activity = db.prepare(`SELECT c.entity_type, c.old_value, c.new_value, c.source, c.created_at, u.username FROM seo_changes c LEFT JOIN users u ON u.id = c.user_id WHERE c.entity_type IN ('redirect', 'redirect-group', 'redirect-settings')${own(scope) ? " AND c.site_id = ?" : ""} ORDER BY c.id DESC LIMIT 8`).all(...(own(scope) ? [scope.siteId] : []));
  return { days: n, total, active, disabled: total - active, permanent, temporary, gone, hitsAll, hitsPeriod: sum(series), hitsPrevious: sum(prev), series: filled, hasDaily: sum(series) + sum(prev) > 0,
    top, recentCreated, recentEdited, notFound: nf, problems: problems.counts, problemList: problems.items.slice(0, 6), activity };
}
function notFoundCount(scope) {
  try {
    const col = db.prepare("PRAGMA table_info(seo_404)").all().map((c) => c.name);
    const hasState = col.includes("ignored") && col.includes("handled_at");
    const site = col.includes("site_id");
    const w = !site ? { sql: "1 = 1", args: [] } : own(scope) ? { sql: "site_id = ?", args: [scope.siteId] } : { sql: "1 = 1", args: [] };
    const open = db.prepare(`SELECT COUNT(*) n, COALESCE(SUM(hits_human + hits_bot), 0) hits FROM seo_404 WHERE ${w.sql}${hasState ? " AND ignored = 0 AND handled_at IS NULL" : ""}`).get(...w.args);
    return { open: open.n, hits: open.hits };
  } catch { return { open: 0, hits: 0 }; }
}

// ----- Détection des problèmes -----
function analyze(scope) {
  ready();
  const w = where(scope, "r");
  const rows = db.prepare(`SELECT r.*, g.enabled AS group_enabled, g.name AS group_name FROM seo_redirects r LEFT JOIN seo_redirect_groups g ON g.id = r.group_id WHERE ${w.sql} ORDER BY r.id`).all(...w.args);
  const items = [];
  const add = (kind, level, r, text, fix) => items.push({ kind, level, id: r ? r.id : null, source: r ? r.source_path : "", text, fix: fix || null });
  const { deadDays } = getSettings(scope);
  const now = R.parisNow();
  const seen = new Map();
  for (const r of rows) {
    const none = R.NO_DEST.includes(r.status);
    const k = `${r.site_id || 0}|${r.match_type}|${r.source_path.toLowerCase()}`;
    if (seen.has(k)) add("duplicate", "warn", r, `Doublon de la règle n° ${seen.get(k)} (même source).`); else seen.set(k, r.id);
    if (!none && r.match_type === "exact" && r.target === r.source_path) add("self", "error", r, "La destination est identique à la source.");
    if (r.group_id && !r.group_enabled) add("group-off", "info", r, `Le groupe « ${r.group_name} » est désactivé : cette règle ne s'applique pas.`);
    if (r.ends_at && r.ends_at < now) add("expired", "info", r, "La période de validité est terminée : la règle ne s'applique plus.");
    if (r.enabled && r.hits === 0 && (!r.ends_at || r.ends_at >= now) && Date.parse(`${r.created_at.replace(" ", "T")}Z`) < Date.now() - deadDays * 864e5) add("dead", "info", r, `Aucune utilisation depuis plus de ${deadDays} jours (règle probablement devenue inutile).`);
    if (!none && /^\//.test(r.target) && r.match_type !== "regex" && !/\$[1-9]/.test(r.target) && !/^\/(?:$)/.test(r.target)) {
      const t = R.normalizePath(r.target);
      if (t && !targetExists(t, r.site_id)) add("missing-target", "warn", r, `La destination ${t} ne correspond à aucune page connue du site (elle peut exister sous une autre forme : à vérifier avec le diagnostic).`);
    }
  }
  // Chaînes et boucles (moteur)
  for (const c of R.chains(own(scope) ? scope.siteId : null).filter((x) => x.id === null || rows.some((r) => r.id === x.id))) {
    if (c.loop) add("loop", "error", c.id ? { id: c.id, source_path: c.source } : null, `Boucle : ${c.path.join(" → ")}.`);
    else add("chain", "warn", c.id ? { id: c.id, source_path: c.source } : null, `Chaîne : ${c.path.join(" → ")}.`, c.id ? { action: "shorten", id: c.id, label: `Raccourcir en ${c.source} → ${c.final}` } : null);
  }
  const counts = { chains: items.filter((i) => i.kind === "chain").length, loops: items.filter((i) => i.kind === "loop").length, dead: items.filter((i) => i.kind === "dead").length,
    duplicates: items.filter((i) => i.kind === "duplicate").length, missing: items.filter((i) => i.kind === "missing-target").length, total: items.length };
  const order = { error: 0, warn: 1, info: 2 };
  items.sort((a, b) => order[a.level] - order[b.level]);
  return { items, counts };
}
// La destination existe-t-elle ? Pages publiées du site, articles, formations, adresses de la boutique : on ne déclare « absente » que ce qu'aucune source connue ne reconnaît
let existsMemo = { at: 0, set: new Map() };
function knownPaths(siteId) {
  const key = siteId || 0;
  const now = Date.now();
  if (now - existsMemo.at > 30000) existsMemo = { at: now, set: new Map() };
  if (existsMemo.set.has(key)) return existsMemo.set.get(key);
  const set = new Set(["/"]);
  try {
    const urls = require("../services/urls");
    const rows = db.prepare(`SELECT id, slug, site_id FROM mk_landing_pages WHERE archived_at IS NULL AND status = 'published' AND ${siteId ? "site_id = ?" : "(site_id IS NULL)"} LIMIT 5000`).all(...(siteId ? [siteId] : []));
    for (const r of rows) { try { set.add(urls.pageCanonicalPath(r)); } catch { /* page sans adresse */ } }
  } catch { /* module indisponible */ }
  if (!siteId) {
    try { for (const r of db.prepare("SELECT slug FROM posts WHERE published_at IS NOT NULL LIMIT 5000").all()) set.add(`/blog/${r.slug}`); } catch { /* table absente */ }
    try { for (const r of db.prepare("SELECT slug FROM courses LIMIT 5000").all()) set.add(`/cours/${r.slug}`); } catch { /* table absente */ }
  }
  existsMemo.set.set(key, set);
  return set;
}
function targetExists(path, siteId) {
  const p = path.split("?")[0].replace(/(.)\/$/, "$1");
  // On ne déclare « absente » qu'une adresse dont la forme est vérifiable (pages, articles, formations) ; toute autre (boutique, fichiers, routes du site) est considérée présente
  const checkable = siteId ? /^\/[^/]+$/.test(p) : /^\/(p|blog|cours)\/[^/]+$/.test(p);
  return !checkable || knownPaths(siteId).has(p);
}

// ----- Simulateur : suit une adresse à travers les vraies règles actives, sans rien rediriger -----
function simulate(scope, input, { maxSteps = 10 } = {}) {
  ready();
  const siteId = own(scope) ? scope.siteId : null;
  const raw = String(input || "").trim();
  if (!raw) return { ok: false, errors: ["Saisissez une adresse à tester."] };
  let queryText = "";
  const qi = raw.indexOf("?");
  if (qi >= 0) queryText = raw.slice(qi).split("#")[0];
  const start = R.normalizePath(raw);
  if (!start) return { ok: false, errors: ["Adresse invalide : un chemin du site (/ancienne-page) ou une adresse complète."] };
  const steps = [];
  const seen = new Set();
  let cur = start;
  let verdict = "final";
  for (let i = 0; i < maxSteps; i++) {
    if (seen.has(cur)) { verdict = "loop"; break; }
    seen.add(cur);
    let hit = null;
    let target = null;
    if (!isProtectedPath(cur)) {
      const r = R.lookup(siteId, cur);
      if (r) { hit = r; target = r.target; } else { const m = R.matchRule(siteId, cur); if (m) { hit = m.r; target = m.target; } }
    }
    if (!hit) { verdict = steps.length ? "final" : "none"; break; }
    const full = R.get(hit.id) || hit;
    const group = full.group_id ? (db.prepare("SELECT name FROM seo_redirect_groups WHERE id = ?").get(full.group_id) || {}).name : null;
    const step = { from: cur, status: hit.status, ruleId: hit.id, match: hit.match_type, priority: full.priority ?? 100, group, queryMode: full.query_mode || "keep" };
    if (R.NO_DEST.includes(hit.status)) { steps.push({ ...step, to: null }); verdict = hit.status === 410 ? "gone" : "legal"; break; }
    const keepQ = full.query_mode !== "drop" && queryText && !String(target).includes("?");
    step.to = /^https:\/\//i.test(target) ? target : `${target}${keepQ && i === 0 ? queryText : ""}`;
    steps.push(step);
    if (/^https:\/\//i.test(target)) { verdict = "external"; break; }
    cur = R.normalizePath(target) || target;
  }
  const last = steps[steps.length - 1];
  const finalPath = steps.length ? (last.to || null) : start;
  const issues = [];
  if (steps.length > 1) issues.push(`${steps.length} redirections successives : mieux vaut mener directement à la destination finale.`);
  if (verdict === "loop") issues.push("Boucle de redirection : cette adresse ne mène à aucune page.");
  if (verdict === "final" && finalPath && !/^https:/i.test(finalPath) && !targetExists(String(finalPath).split("?")[0], siteId)) issues.push("La destination finale ne correspond à aucune page connue : vérifiez qu'elle répond.");
  if (verdict === "none") issues.push("Aucune règle ne s'applique à cette adresse : elle suit le site normalement (page, ou erreur 404 si elle n'existe pas).");
  return { ok: true, start, query: queryText, steps, verdict, final: finalPath, hops: steps.length, issues };
}
const isProtectedPath = (p) => { try { return R.validate({ source: p, target: "/x", status: 301 }).errors.some((e) => /espace technique/.test(e)); } catch { return false; } };
function simulateBatch(scope, text, limit = 100) {
  return String(text || "").split(/\r?\n/).map((l) => l.trim()).filter(Boolean).slice(0, limit).map((line) => ({ input: line, ...simulate(scope, line) }));
}
// Testeur d'expression régulière : mêmes garde-fous que le moteur, exemples d'adresses fournis par l'utilisateur
function testRegex(pattern, replacement, samples) {
  const bad = R.checkRegex(pattern);
  if (bad) return { ok: false, errors: [bad] };
  const re = new RegExp(pattern);
  const out = String(samples || "").split(/\r?\n/).map((s) => s.trim()).filter(Boolean).slice(0, 50).map((s) => {
    const path = R.normalizePath(s) || s;
    const m = re.test(path);
    return { input: s, match: m, result: m ? (replacement ? path.replace(re, replacement) : null) : null };
  });
  return { ok: true, results: out };
}

// ----- Import : détection du format, normalisation, aperçu, validation -----
const FORMATS = { csv: "CSV (colonnes reconnues par leur nom)", json: "JSON (Kolakisa, Redirection)", apache: "Fichier .htaccess (Apache)", nginx: "Configuration Nginx" };
const HEADS = {
  source: ["source", "from", "origin", "old", "old_url", "url_from", "source_url", "ancienne", "ancienne_adresse", "url", "source_path"],
  target: ["target", "destination", "to", "new", "new_url", "url_to", "target_url", "nouvelle", "nouvelle_adresse", "action_data", "redirect_to"],
  status: ["status", "type", "code", "http_code", "action_code", "header", "redirect_type", "statut"],
  match: ["match", "match_type", "compare", "comparison", "correspondance", "format"],
  note: ["note", "title", "description", "comment", "commentaire"],
  enabled: ["enabled", "active", "actif"],
  regex: ["regex", "is_regex"],
  group: ["group", "groupe", "category"],
};
function headerMap(cells) {
  const map = {};
  cells.forEach((c, i) => { const k = String(c).trim().toLowerCase().replace(/^﻿/, "").replace(/[\s-]+/g, "_"); for (const [field, names] of Object.entries(HEADS)) if (names.includes(k) && map[field] === undefined) map[field] = i; });
  return map;
}
const truthy = (v) => /^(1|true|oui|yes|on|enabled|active|actif)$/i.test(String(v).trim());
const falsy = (v) => /^(0|false|non|no|off|disabled|inactive|inactif)$/i.test(String(v).trim());
function codeOf(v) {
  const t = String(v ?? "").trim().toLowerCase();
  if (/^\d{3}$/.test(t)) return Number(t);
  return { permanent: 301, permanente: 301, temp: 302, temporary: 302, temporaire: 302, found: 302, "see other": 303, seeother: 303, gone: 410 }[t] || null;
}
function fromCsv(text) {
  const rows = parseCsvLines(text);
  if (!rows.length) return [];
  let map = headerMap(rows[0]);
  let body = rows;
  if (map.source !== undefined && (map.target !== undefined || rows[0].some((c) => /^(statut|status|type|code)$/i.test(c)))) body = rows.slice(1);
  else map = { source: 0, target: 1, status: 2, note: 3, match: 4 };
  const stateCol = rows[0].findIndex((h, i) => /^status$/i.test(String(h).trim()) && i !== map.status); // fichier de Redirection : « status » = enabled / disabled, « code » = 301…
  return body.map((c) => {
    const row = { source: c[map.source] || "", target: c[map.target] || "", status: codeOf(c[map.status]) || 301, note: c[map.note] || "", match: "exact", enabled: true, group: map.group === undefined ? "" : c[map.group] || "" };
    const m = map.match === undefined ? "" : c[map.match];
    row.match = R.matchOf(m) || (map.regex !== undefined && truthy(c[map.regex]) ? "regex" : /^(regex|regexp)$/i.test(String(m)) || String(m).toLowerCase() === "regex" ? "regex" : "exact");
    if (map.enabled !== undefined) { if (falsy(c[map.enabled])) row.enabled = false; }
    else if (stateCol >= 0 && /^(disabled|inactive)$/i.test(String(c[stateCol]))) row.enabled = false;
    else if (map.status !== undefined && /^(disabled|inactive)$/i.test(String(c[map.status]))) row.enabled = false;
    return row;
  });
}
function parseCsvLines(text) {
  const out = [];
  for (const line of String(text || "").replace(/^﻿/, "").split(/\r?\n/)) {
    if (!line.trim()) continue;
    const sep = line.includes(";") && !line.includes(",") ? ";" : line.includes("\t") && !line.includes(",") ? "\t" : ",";
    const cells = [];
    let cur = "", q = false;
    for (let i = 0; i < line.length; i++) { const ch = line[i]; if (ch === '"') { if (q && line[i + 1] === '"') { cur += '"'; i++; } else q = !q; } else if (ch === sep && !q) { cells.push(cur.trim()); cur = ""; } else cur += ch; }
    cells.push(cur.trim());
    out.push(cells);
  }
  return out;
}
function fromJson(text) {
  let data;
  try { data = JSON.parse(String(text || "")); } catch { return { error: "Fichier JSON illisible." }; }
  const list = Array.isArray(data) ? data : data.rules || data.redirects || data.items || data.data || [];
  if (!Array.isArray(list)) return { error: "Aucune liste de règles trouvée dans ce JSON." };
  const groups = Array.isArray(data.groups) ? data.groups : [];
  const gname = (id) => { const g = groups.find((x) => String(x.id) === String(id)); return g ? g.name : ""; };
  return list.map((x) => {
    const target = x.target ?? x.destination ?? x.to ?? (x.action_data && (x.action_data.url || x.action_data)) ?? x.url_to ?? "";
    const code = codeOf(x.status ?? x.action_code ?? x.code ?? x.type ?? x.header);
    const regex = x.regex === true || x.regex === 1 || x.regex === "1" || x.match === "regex" || x.match_type === "regex" || x.comparison === "regex";
    return { source: String(x.source ?? x.source_path ?? x.url ?? x.from ?? x.origin ?? ""), target: String(typeof target === "string" ? target : ""), status: code || 301,
      note: String(x.note ?? x.title ?? x.comment ?? ""), match: R.matchOf(x.match) || R.matchOf(x.match_type) || (regex ? "regex" : "exact"), enabled: !(x.enabled === false || x.enabled === 0 || x.status === "disabled" || x.active === false),
      group: String(x.group ?? (x.group_id ? gname(x.group_id) : "")), priority: x.priority, startsAt: x.starts_at, endsAt: x.ends_at, queryMode: x.query_mode };
  });
}
function fromApache(text) {
  const rows = [];
  for (const raw of String(text || "").split(/\r?\n/)) {
    const line = raw.trim();
    let m;
    if ((m = /^Redirect(?:Permanent)?\s+(?:(\d{3}|permanent|temp|seeother|gone)\s+)?(\S+)(?:\s+(\S+))?\s*$/i.exec(line)) && !/^RedirectMatch/i.test(line)) {
      const code = /^redirectpermanent/i.test(line) ? 301 : codeOf(m[1]) || 302;
      rows.push({ source: m[2], target: m[3] || "", status: code, match: "exact", note: "Import .htaccess", enabled: true });
    } else if ((m = /^RedirectMatch\s+(?:(\d{3}|permanent|temp|gone)\s+)?(\S+)(?:\s+(\S+))?\s*$/i.exec(line))) {
      rows.push({ source: m[2], target: m[3] || "", status: codeOf(m[1]) || 302, match: "regex", note: "Import .htaccess", enabled: true });
    } else if ((m = /^RewriteRule\s+(\S+)\s+(\S+)\s+\[([^\]]*)\]/i.exec(line)) && /R(=\d{3})?/i.test(m[3])) {
      const c = /R=(\d{3})/i.exec(m[3]);
      const src = m[1].startsWith("^/") ? m[1] : m[1].replace(/^\^/, "^/");
      rows.push({ source: src, target: m[2], status: c ? Number(c[1]) : 302, match: "regex", note: "Import .htaccess", enabled: true });
    }
  }
  return rows;
}
function fromNginx(text) {
  const rows = [];
  const s = String(text || "");
  for (const m of s.matchAll(/location\s*(=|\^~)?\s*(\/[^\s{]*)\s*\{\s*return\s+(\d{3})\s*([^;]*);/g)) rows.push({ source: m[2], target: m[4].trim(), status: Number(m[3]), match: m[1] === "^~" ? "prefix" : "exact", note: "Import Nginx", enabled: true });
  for (const m of s.matchAll(/^\s*rewrite\s+(\S+)\s+(\S+)\s+(permanent|redirect)\s*;/gm)) rows.push({ source: m[1], target: m[2], status: m[3] === "permanent" ? 301 : 302, match: "regex", note: "Import Nginx", enabled: true });
  return rows;
}
function detectFormat(text, hint) {
  if (FORMATS[hint]) return hint;
  const t = String(text || "").trim();
  if (/^[[{]/.test(t)) return "json";
  if (/(^|\n)\s*(Redirect|RedirectMatch|RedirectPermanent|RewriteRule)\s/i.test(t)) return "apache";
  if (/(^|\n)\s*(location\s|rewrite\s)/.test(t) && /;/.test(t)) return "nginx";
  return "csv";
}
function parseImport(text, hint) {
  const input = String(text || "").slice(0, 2_000_000);
  if (!input.trim()) return { ok: false, errors: ["Le fichier est vide."] };
  const format = detectFormat(input, hint);
  const rows = format === "json" ? fromJson(input) : format === "apache" ? fromApache(input) : format === "nginx" ? fromNginx(input) : fromCsv(input);
  if (rows && rows.error) return { ok: false, errors: [rows.error] };
  if (!rows.length) return { ok: false, errors: ["Aucune règle reconnue dans ce fichier."], format };
  return { ok: true, format, rows: rows.slice(0, 2000), truncated: rows.length > 2000 };
}
// Aperçu : chaque ligne est validée comme une vraie création, sans rien écrire
function previewImport(scope, parsed, { allowExternal = false } = {}) {
  ready();
  const siteId = own(scope) ? scope.siteId : null;
  const seen = new Set();
  const items = parsed.rows.map((row, i) => {
    const input = { source: row.source, target: row.target, status: row.status, matchType: row.match, siteId, priority: row.priority, startsAt: row.startsAt, endsAt: row.endsAt, queryMode: row.queryMode, origin: "import" };
    const v = R.validate(input);
    const errors = [...v.errors];
    const warnings = [];
    if (R.isExternal(row.target) && !allowExternal) errors.push("Destination extérieure : il faut la permission « rediriger vers un site extérieur ».");
    else if (R.isExternal(row.target) && !externalAllowed(siteId, row.target)) errors.push("Ce domaine n'est pas dans la liste des domaines extérieurs autorisés (Paramètres).");
    const key = `${row.match}|${String(row.source).toLowerCase()}`;
    let state = errors.length ? "error" : "ok";
    if (!errors.length) {
      if (seen.has(key)) { state = "duplicate"; warnings.push("Doublon dans le fichier : la première ligne est gardée."); }
      seen.add(key);
    } else if (errors.some((e) => /existe déjà/.test(e))) state = "exists";
    if (state === "ok" && row.status !== 410 && row.status !== 451 && R.normalizePath(row.target) === R.normalizePath(row.source)) { state = "error"; errors.push("La source et la destination sont identiques."); }
    return { index: i, row, state, errors, warnings };
  });
  const summary = { total: items.length, ok: items.filter((x) => x.state === "ok").length, errors: items.filter((x) => x.state === "error").length, exists: items.filter((x) => x.state === "exists").length, duplicates: items.filter((x) => x.state === "duplicate").length };
  return { format: parsed.format, items, summary, truncated: Boolean(parsed.truncated) };
}
// Application : seulement les lignes cochées ET valides ; la confirmation est exigée par l'appelant
function applyImport(scope, parsed, selected, userId, { allowExternal = false, createGroups = true } = {}) {
  ready();
  const pre = previewImport(scope, parsed, { allowExternal });
  const pick = new Set((selected || []).map(Number));
  const report = { created: 0, skipped: 0, errors: [] };
  snapshot(scope, "avant un import", userId);
  const siteId = own(scope) ? scope.siteId : null;
  const groupId = (name) => {
    const n = String(name || "").trim();
    if (!n || !createGroups) return null;
    const w = db.prepare("SELECT id FROM seo_redirect_groups WHERE name = ? COLLATE NOCASE AND COALESCE(site_id, 0) = ?").get(n, siteId || 0);
    if (w) return w.id;
    const c = createGroup(scope, { name: n, siteId }, userId);
    return c.ok ? c.id : null;
  };
  for (const it of pre.items) {
    if (!pick.has(it.index)) continue;
    if (it.state !== "ok") { report.skipped++; report.errors.push(`Ligne ${it.index + 1} (${it.row.source}) : ${it.errors[0] || "ignorée"}`); continue; }
    const r = R.create({ source: it.row.source, target: it.row.target, status: it.row.status, note: it.row.note || "Import", matchType: it.row.match, siteId, groupId: groupId(it.row.group), priority: it.row.priority, startsAt: it.row.startsAt, endsAt: it.row.endsAt, queryMode: it.row.queryMode, origin: "import" }, userId, { source: "import" });
    if (!r.ok) { report.skipped++; report.errors.push(`Ligne ${it.index + 1} (${it.row.source}) : ${r.errors.join(" ")}`); continue; }
    if (!it.row.enabled) R.update(r.id, { source: it.row.source, target: it.row.target, status: it.row.status, enabled: "0" }, userId);
    report.created++;
  }
  return report;
}

// ----- Export -----
const fileDate = () => new Date().toISOString().slice(0, 10);
function exportRules(scope, { format = "csv", groupId = "", state = "", ids = null } = {}) {
  ready();
  const w = where(scope, "r");
  const extra = [];
  const args = [...w.args];
  if (/^\d+$/.test(String(groupId))) { extra.push("r.group_id = ?"); args.push(Number(groupId)); }
  if (state === "active") extra.push("r.enabled = 1"); else if (state === "inactive") extra.push("r.enabled = 0");
  if (Array.isArray(ids) && ids.length) { const list = ids.map(Number).filter(Number.isInteger).slice(0, 5000); extra.push(`r.id IN (${list.map(() => "?").join(",") || "NULL"})`); args.push(...list); }
  const rows = db.prepare(`SELECT r.*, g.name AS group_name FROM seo_redirects r LEFT JOIN seo_redirect_groups g ON g.id = r.group_id WHERE ${[w.sql, ...extra].join(" AND ")} ORDER BY r.priority, r.id`).all(...args);
  const stamp = fileDate();
  if (format === "json") return { filename: `redirections-${stamp}.json`, mime: "application/json; charset=utf-8", body: JSON.stringify(backupObject(scope, rows), null, 2), count: rows.length };
  if (format === "apache") return { filename: `redirections-${stamp}.htaccess`, mime: "text/plain; charset=utf-8", body: toApache(rows), count: rows.length };
  if (format === "nginx") return { filename: `redirections-${stamp}.conf`, mime: "text/plain; charset=utf-8", body: toNginx(rows), count: rows.length };
  const head = "source,destination,type,note,active,utilisations,derniere_utilisation,correspondance,groupe,priorite,debut,fin,parametres";
  return { filename: `redirections-${stamp}.csv`, mime: "text/csv; charset=utf-8", count: rows.length,
    body: `﻿${[head, ...rows.map((r) => [r.source_path, r.target, r.status, r.note, r.enabled ? "oui" : "non", r.hits, r.last_hit_at || "", r.match_type, r.group_name || "", r.priority, r.starts_at || "", r.ends_at || "", r.query_mode].map(R.csvCell).join(","))].join("\n")}\n` };
}
const reEsc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const cmt = (s) => String(s || "").replace(/[\r\n]+/g, " ").slice(0, 100);
function toApache(rows) {
  const out = ["# Redirections exportées depuis KOLAKISA — à placer dans le .htaccess du site (Apache)", ""];
  for (const r of rows.filter((x) => x.enabled)) {
    const code = r.status === 410 ? "gone" : r.status === 451 ? "451" : r.status;
    const t = r.target;
    if (r.note) out.push(`# ${cmt(r.note)}`);
    if (r.match_type === "exact") out.push(r.status === 410 ? `Redirect gone ${r.source_path}` : `Redirect ${code} ${r.source_path} ${t}`);
    else if (r.match_type === "prefix") out.push(`RedirectMatch ${code} ^${reEsc(r.source_path)}(/.*)?$ ${r.status === 410 ? "" : `${t.replace(/\/+$/, "")}$1`}`.trim());
    else if (r.match_type === "contains") out.push(`RedirectMatch ${code} (?i)${reEsc(r.source_path)} ${t}`.trim());
    else if (r.match_type === "endswith") out.push(`RedirectMatch ${code} (?i)${reEsc(r.source_path)}$ ${t}`.trim());
    else out.push(`RedirectMatch ${code} ${r.source_path} ${t}`.trim());
  }
  return `${out.join("\n")}\n`;
}
function toNginx(rows) {
  const out = ["# Redirections exportées depuis KOLAKISA — à placer dans le bloc « server { } » (Nginx)", ""];
  for (const r of rows.filter((x) => x.enabled)) {
    const code = r.status;
    const t = r.target;
    if (r.note) out.push(`# ${cmt(r.note)}`);
    const act = R.NO_DEST.includes(code) ? `return ${code};` : `return ${code} ${t};`;
    if (r.match_type === "exact") out.push(`location = ${r.source_path} { ${act} }`);
    else if (r.match_type === "prefix") out.push(R.NO_DEST.includes(code) ? `location ^~ ${r.source_path} { return ${code}; }` : `rewrite ^${reEsc(r.source_path)}(/.*)?$ ${t.replace(/\/+$/, "")}$1 ${code === 301 || code === 308 ? "permanent" : "redirect"};`);
    else if (r.match_type === "contains") out.push(`location ~* ${reEsc(r.source_path)} { ${act} }`);
    else if (r.match_type === "endswith") out.push(`location ~* ${reEsc(r.source_path)}$ { ${act} }`);
    else out.push(R.NO_DEST.includes(code) ? `location ~ ${r.source_path} { return ${code}; }` : `rewrite ${r.source_path} ${t} ${code === 301 || code === 308 ? "permanent" : "redirect"};`);
  }
  return `${out.join("\n")}\n`;
}
function export404(scope) {
  let rows = [];
  try {
    const hasSite = db.prepare("PRAGMA table_info(seo_404)").all().some((c) => c.name === "site_id");
    rows = db.prepare(`SELECT path, hits_human, hits_bot, first_seen, last_seen, last_referrer FROM seo_404${hasSite && own(scope) ? " WHERE site_id = ?" : ""} ORDER BY (hits_human + hits_bot) DESC`).all(...(hasSite && own(scope) ? [scope.siteId] : []));
  } catch { rows = []; }
  return { filename: `erreurs-404-${fileDate()}.csv`, mime: "text/csv; charset=utf-8", count: rows.length,
    body: `﻿${["adresse,visites_humaines,visites_robots,premiere_vue,derniere_vue,dernier_referent", ...rows.map((r) => [r.path, r.hits_human, r.hits_bot, r.first_seen, r.last_seen, r.last_referrer || ""].map(R.csvCell).join(","))].join("\n")}\n` };
}

// ----- Sauvegarde et restauration -----
function backupObject(scope, rows) {
  ready();
  const w = where(scope, "g");
  const groups = db.prepare(`SELECT g.id, g.name, g.description, g.enabled FROM seo_redirect_groups g WHERE ${w.sql}`).all(...w.args);
  return { format: "kolakisa-redirects", version: 1, exportedAt: new Date().toISOString(), groups,
    rules: rows.map((r) => ({ source: r.source_path, target: r.target, status: r.status, match: r.match_type, note: r.note, enabled: Boolean(r.enabled), group: r.group_name || "", priority: r.priority, starts_at: r.starts_at, ends_at: r.ends_at, query_mode: r.query_mode })) };
}
function currentRows(scope) {
  const w = where(scope, "r");
  return db.prepare(`SELECT r.*, g.name AS group_name FROM seo_redirects r LEFT JOIN seo_redirect_groups g ON g.id = r.group_id WHERE ${w.sql} ORDER BY r.id`).all(...w.args);
}
const snapKey = (scope) => `redirects_snapshot_${scopeKey(scope)}`;
// Copie de sécurité automatique (une seule, la dernière) : permet d'annuler une restauration, un import ou une suppression groupée
function snapshot(scope, reason, userId) {
  const rows = currentRows(scope);
  if (!rows.length) return null;
  const obj = { ...backupObject(scope, rows), reason, at: new Date().toISOString() };
  db.prepare("INSERT INTO seo_settings (key, value, updated_by) VALUES (?, ?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = datetime('now'), updated_by = excluded.updated_by").run(snapKey(scope), JSON.stringify(obj), userId ?? null);
  return obj;
}
function lastSnapshot(scope) { try { const row = db.prepare("SELECT value FROM seo_settings WHERE key = ?").get(snapKey(scope)); return row ? JSON.parse(row.value) : null; } catch { return null; } }
function backupDownload(scope) {
  const obj = backupObject(scope, currentRows(scope));
  return { filename: `sauvegarde-redirections-${fileDate()}.json`, mime: "application/json; charset=utf-8", body: JSON.stringify(obj, null, 2), count: obj.rules.length };
}
// Restauration : « replace » remplace TOUTES les règles du périmètre (une copie est gardée avant) ; « merge » ajoute celles qui n'existent pas
function restore(scope, text, mode, userId, { allowExternal = false } = {}) {
  ready();
  let data;
  try { data = JSON.parse(String(text || "")); } catch { return { ok: false, errors: ["Fichier de sauvegarde illisible."] }; }
  if (!data || data.format !== "kolakisa-redirects" || !Array.isArray(data.rules)) return { ok: false, errors: ["Ce fichier n'est pas une sauvegarde de redirections KOLAKISA."] };
  const parsed = { ok: true, format: "json", rows: fromJson(JSON.stringify({ groups: data.groups, rules: data.rules })) };
  if (parsed.rows.error) return { ok: false, errors: [parsed.rows.error] };
  const siteId = own(scope) ? scope.siteId : null;
  snapshot(scope, mode === "replace" ? "avant une restauration complète" : "avant une fusion de sauvegarde", userId);
  let removed = 0;
  if (mode === "replace") {
    const w = own(scope) ? { sql: "site_id = ?", args: [scope.siteId] } : { sql: "site_id IS NULL", args: [] }; // le site principal ne remplace jamais les règles des autres sites
    const del = db.prepare(`SELECT id FROM seo_redirects WHERE ${w.sql}`).all(...w.args);
    for (const d of del) { R.remove(d.id, userId); removed++; }
  }
  const pre = previewImport({ siteId }, parsed, { allowExternal });
  const report = applyImport({ siteId }, parsed, pre.items.filter((x) => x.state === "ok").map((x) => x.index), userId, { allowExternal });
  return { ok: true, removed, ...report };
}
function undoLast(scope, userId, opts) {
  const snap = lastSnapshot(scope);
  if (!snap) return { ok: false, errors: ["Aucune copie de sécurité à restaurer."] };
  const prev = { ...snap };
  const res = restore(scope, JSON.stringify(prev), "replace", userId, opts);
  return res;
}

// ----- Suggestions de destination pour une adresse introuvable (jamais appliquées seules) -----
const words = (s) => String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").split(/[^a-z0-9]+/).filter((w) => w.length > 1);
const STOP = new Set(["le", "la", "les", "un", "une", "des", "du", "de", "et", "en", "pour", "sur", "the", "and", "of", "html", "php", "htm", "www"]);
const sig = (s) => words(s).filter((w) => !STOP.has(w));
function lev(a, b) {
  if (a === b) return 0;
  const m = a.length, n = b.length;
  if (!m || !n) return Math.max(m, n);
  let prev = Array.from({ length: n + 1 }, (_, i) => i);
  for (let i = 1; i <= m; i++) { const cur = [i]; for (let j = 1; j <= n; j++) cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)); prev = cur; }
  return prev[n];
}
function candidatesFor(siteId) {
  const out = [];
  const urls = require("../services/urls");
  const rows = db.prepare(`SELECT id, slug, site_id, name, title FROM mk_landing_pages WHERE archived_at IS NULL AND status = 'published' AND ${siteId ? "site_id = ?" : "site_id IS NULL"} LIMIT 3000`).all(...(siteId ? [siteId] : []));
  for (const r of rows) { try { out.push({ path: urls.pageCanonicalPath(r), label: r.title || r.name || r.slug, kind: "page" }); } catch { /* sans adresse */ } }
  if (!siteId) {
    try { for (const r of db.prepare("SELECT slug, title FROM posts WHERE published_at IS NOT NULL LIMIT 3000").all()) out.push({ path: `/blog/${r.slug}`, label: r.title, kind: "article" }); } catch { /* table absente */ }
    try { for (const r of db.prepare("SELECT slug, title FROM courses LIMIT 3000").all()) out.push({ path: `/cours/${r.slug}`, label: r.title, kind: "formation" }); } catch { /* table absente */ }
  }
  return out.filter((c) => c.path && c.path !== "/");
}
function suggestFor(scope, path, limit = 3) {
  const siteId = own(scope) ? scope.siteId : null;
  const wanted = sig(String(path).replace(/\.[a-z0-9]{2,5}$/i, ""));
  if (!wanted.length) return [];
  const last = String(path).split("/").filter(Boolean).pop() || "";
  const lastSlug = words(last.replace(/\.[a-z0-9]{2,5}$/i, "")).join("-");
  const scored = [];
  for (const c of candidatesFor(siteId)) {
    const have = new Set([...sig(c.path), ...sig(c.label)]);
    const common = wanted.filter((w) => have.has(w) || [...have].some((h) => h.length > 4 && w.length > 4 && (h.startsWith(w) || w.startsWith(h))));
    const jac = common.length / new Set([...wanted, ...have]).size;
    const cl = words(String(c.path).split("/").filter(Boolean).pop()).join("-");
    const sim = lastSlug && cl ? 1 - lev(lastSlug, cl) / Math.max(lastSlug.length, cl.length) : 0;
    const score = Math.max(jac * 1.4, sim * 0.9);
    if (score >= 0.34 && common.length >= 1) scored.push({ path: c.path, label: c.label, kind: c.kind, score: Math.round(score * 100) / 100, why: common.length ? `mots communs : ${common.slice(0, 4).join(", ")}` : "adresse très proche" });
  }
  return scored.sort((a, b) => b.score - a.score).slice(0, limit);
}

// ----- Journal des 404 : séries par jour -----
function notFoundDaily(scope, days = 30) {
  ready();
  const from = dayAgo(days - 1);
  const rows = db.prepare(`SELECT day, SUM(hits) hits FROM seo_404_daily WHERE day >= ?${own(scope) ? " AND site_id = ?" : ""} GROUP BY day ORDER BY day`).all(from, ...(own(scope) ? [scope.siteId] : []));
  const by = new Map(rows.map((r) => [r.day, r.hits]));
  return Array.from({ length: days }, (_, i) => { const day = dayAgo(days - 1 - i); return { day, hits: by.get(day) || 0 }; });
}

// ----- Propositions de redirection (changements d'adresse de pages et de termes) -----
// Les anciennes adresses sont mémorisées par le serveur (cms_url_history). En mode « à valider », rien ne redirige tant que la proposition n'est pas acceptée : elle devient alors une vraie règle.
function proposals(scope) {
  ready();
  const urls = require("../services/urls");
  const out = [];
  let rows = [];
  try { rows = db.prepare("SELECT h.id, h.resource_type, h.resource_id, h.site_id, h.old_slug, h.reason, h.created_at FROM cms_url_history h ORDER BY h.id DESC LIMIT 500").all(); } catch { return out; }
  for (const h of rows) {
    if (own(scope) ? h.site_id !== scope.siteId : (h.site_id && !((scope && scope.visible) || []).includes(h.site_id))) continue;
    let from = null, to = null;
    try {
      if (h.resource_type === "page") {
        const row = db.prepare("SELECT id, slug, site_id FROM mk_landing_pages WHERE id = ?").get(h.resource_id);
        if (row) { to = urls.pageCanonicalPath(row); from = urls.pageCanonicalPath({ ...row, slug: h.old_slug }); }
      } else { const tx = require("../services/taxonomy"); const t = tx.get(h.resource_id); if (t) { to = tx.urlOf(t); from = `${tx.baseOf(h.resource_type)}/${h.old_slug}`; } }
    } catch { /* ressource disparue */ }
    if (!from || !to || from === to) continue;
    const exists = db.prepare(`SELECT id FROM seo_redirects WHERE source_path = ? AND ${require("../services/siteScope").sameScope("site_id")}`).get(from, h.site_id || null);
    out.push({ id: h.id, from, to, reason: h.reason, at: h.created_at, siteId: h.site_id || null, converted: Boolean(exists) });
  }
  return out;
}
function acceptProposal(scope, id, userId) {
  const p = proposals(scope).find((x) => x.id === Number(id));
  if (!p) return { ok: false, errors: ["Proposition introuvable."] };
  if (p.converted) return { ok: false, errors: ["Cette redirection existe déjà."] };
  return R.create({ source: p.from, target: p.to, status: 301, note: "Changement d'adresse validé", siteId: p.siteId, origin: "auto-slug" }, userId, { source: "permaliens" });
}

module.exports = { where, own, inScope, getSettings, saveSettings, resetMemo, autoModeFor, externalAllowed, AUTO_MODES, DEFAULTS,
  listGroups, getGroup, createGroup, updateGroup, removeGroup, moveToGroup, bulk, dashboard, analyze, simulate, simulateBatch, testRegex,
  FORMATS, parseImport, previewImport, applyImport, exportRules, export404, backupDownload, restore, snapshot, lastSnapshot, undoLast, suggestFor, notFoundDaily, proposals, acceptProposal };
