// Suivi de positionnement. Aucune position n'est inventée ni « scrappée » : les mesures viennent de trois sources réelles et étiquetées —
//   · « manuel »     : saisie par une personne (avec la date de la mesure) ;
//   · « import GSC » : export CSV « Requêtes » de Google Search Console ;
//   · « API GSC »    : instantané des requêtes renvoyées par l'API Search Console du site, SI elle est connectée (voir integrations).
// La position de Search Console est une moyenne pondérée par les impressions sur la période exportée, pas un rang exact à un instant donné.
// Chaque mesure appartient à un site (site_id) ou à l'équipe centrale (NULL) ; le périmètre vient de l'appelant, jamais d'un formulaire.
const { db, logChange } = require("./store");

db.exec(`
  CREATE TABLE IF NOT EXISTS seo_rank_entries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    site_id INTEGER,
    keyword TEXT NOT NULL,
    page_url TEXT NOT NULL DEFAULT '',
    position REAL NOT NULL,
    clicks INTEGER,
    impressions INTEGER,
    source TEXT NOT NULL,
    measured_on TEXT NOT NULL,
    created_by INTEGER,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE INDEX IF NOT EXISTS idx_seo_rank_scope ON seo_rank_entries(site_id, keyword, measured_on);
`);

const SOURCES = { manuel: "Saisie manuelle", "import-gsc": "Import Search Console", "api-gsc": "API Search Console" };
const MAX_ROWS = 20000;
const MAX_PER_IMPORT = 2000;
const today = () => new Date().toISOString().slice(0, 10);
const scopeSql = (siteId) => (Number.isInteger(siteId) ? { sql: "site_id = ?", args: [siteId] } : { sql: "site_id IS NULL", args: [] });
const cleanKeyword = (k) => String(k || "").replace(/\s+/g, " ").trim().toLowerCase().slice(0, 120);

function validateEntry({ keyword, url, position, date, clicks, impressions }) {
  const errors = [];
  const kw = cleanKeyword(keyword);
  if (!kw) errors.push("Mot-clé obligatoire.");
  const pos = Number(String(position).replace(",", "."));
  if (!Number.isFinite(pos) || pos < 1 || pos > 1000) errors.push("Position : un nombre de 1 à 1000.");
  const day = date ? String(date).slice(0, 10) : today();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day) || Number.isNaN(Date.parse(day))) errors.push("Date invalide (AAAA-MM-JJ).");
  else if (day > today()) errors.push("La date de mesure ne peut pas être dans le futur.");
  const pageUrl = String(url || "").trim().slice(0, 500);
  if (pageUrl && !/^(\/(?!\/)|https:\/\/)[^\s"'<>]*$/i.test(pageUrl)) errors.push("Page : un chemin du site (/page) ou une adresse https.");
  const int = (v) => (v === undefined || v === null || v === "" ? null : Number.isInteger(Number(v)) && Number(v) >= 0 ? Number(v) : NaN);
  const c = int(clicks), im = int(impressions);
  if (Number.isNaN(c) || Number.isNaN(im)) errors.push("Clics et impressions : des entiers positifs.");
  return { errors, value: { keyword: kw, page_url: pageUrl, position: Math.round(pos * 100) / 100, measured_on: day, clicks: c, impressions: im } };
}

function insert(siteId, value, source, userId) {
  // Une seule mesure par mot-clé, page, source et jour : la dernière remplace la précédente
  const sc = scopeSql(siteId);
  db.prepare(`DELETE FROM seo_rank_entries WHERE ${sc.sql} AND keyword = ? AND page_url = ? AND source = ? AND measured_on = ?`).run(...sc.args, value.keyword, value.page_url, source, value.measured_on);
  db.prepare("INSERT INTO seo_rank_entries (site_id, keyword, page_url, position, clicks, impressions, source, measured_on, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)")
    .run(Number.isInteger(siteId) ? siteId : null, value.keyword, value.page_url, value.position, value.clicks, value.impressions, source, value.measured_on, userId ?? null);
}
const count = (siteId) => { const sc = scopeSql(siteId); return db.prepare(`SELECT COUNT(*) n FROM seo_rank_entries WHERE ${sc.sql}`).get(...sc.args).n; };

function add(siteId, input, userId) {
  const { errors, value } = validateEntry(input);
  if (errors.length) return { ok: false, errors };
  if (count(siteId) >= MAX_ROWS) return { ok: false, errors: [`${MAX_ROWS} mesures au plus : supprimez les plus anciennes.`] };
  insert(siteId, value, "manuel", userId);
  logChange({ entityType: "ranking", entityKey: value.keyword, field: "position", before: null, after: `${value.position} (${value.measured_on})`, userId, siteId: Number.isInteger(siteId) ? siteId : null });
  return { ok: true };
}

// Export « Requêtes » de Search Console : colonnes Requêtes les plus fréquentes / Top queries, Clics, Impressions, CTR, Position
function parseGscCsv(text) {
  const lines = String(text || "").replace(/^﻿/, "").split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return { error: "Fichier vide : l'export « Requêtes » de Search Console est attendu." };
  const sep = lines[0].includes("\t") ? "\t" : lines[0].includes(";") && !lines[0].includes(",") ? ";" : ",";
  const cells = (line) => { const out = []; let cur = ""; let q = false; for (let i = 0; i < line.length; i++) { const ch = line[i]; if (ch === '"') { if (q && line[i + 1] === '"') { cur += '"'; i++; } else q = !q; } else if (ch === sep && !q) { out.push(cur); cur = ""; } else cur += ch; } out.push(cur); return out.map((c) => c.trim()); };
  const head = cells(lines[0]).map((h) => h.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, ""));
  const find = (...names) => head.findIndex((h) => names.some((n) => h.startsWith(n)));
  const iq = find("requete", "top quer", "quer");
  const ic = find("clic", "click");
  const ii = find("impression");
  const ip = find("position");
  if (iq < 0 || ip < 0) return { error: "Colonnes introuvables : « Requêtes » (ou « Top queries ») et « Position » sont nécessaires." };
  const num = (v) => { const t = String(v ?? "").replace(/\s/g, "").replace(",", "."); return t === "" ? null : Number(t); };
  return { rows: lines.slice(1).map((l) => { const c = cells(l); return { keyword: c[iq], position: num(c[ip]), clicks: ic >= 0 ? num(c[ic]) : null, impressions: ii >= 0 ? num(c[ii]) : null }; }) };
}
function importGsc(siteId, text, { date, userId } = {}) {
  const p = parseGscCsv(text);
  if (p.error) return { ok: false, errors: [p.error] };
  if (p.rows.length > MAX_PER_IMPORT) return { ok: false, errors: [`${MAX_PER_IMPORT} lignes au plus par import.`] };
  const report = { ok: true, imported: 0, errors: [] };
  if (count(siteId) + p.rows.length > MAX_ROWS) return { ok: false, errors: [`${MAX_ROWS} mesures au plus : supprimez les plus anciennes.`] };
  p.rows.forEach((r, i) => {
    const { errors, value } = validateEntry({ ...r, date });
    if (errors.length) { if (report.errors.length < 10) report.errors.push(`Ligne ${i + 2} : ${errors.join(" ")}`); return; }
    insert(siteId, value, "import-gsc", userId);
    report.imported++;
  });
  return report;
}

// Instantané des requêtes de l'API Search Console du site (si elle est connectée) — la position est celle renvoyée par Google
async function snapshotFromSearchConsole(siteId, userId, integrations = require("./integrations")) {
  const report = await integrations.searchConsoleReport(28, { refresh: true, siteId: Number.isInteger(siteId) ? siteId : null });
  let n = 0;
  for (const q of report.topQueries || []) {
    const { errors, value } = validateEntry({ keyword: q.query, position: q.position, clicks: Math.round(q.clicks), impressions: Math.round(q.impressions) });
    if (!errors.length) { insert(siteId, value, "api-gsc", userId); n++; }
  }
  return { ok: true, imported: n };
}

// Tableau de suivi : par mot-clé, dernière mesure, mesure précédente, écart (négatif = amélioration) et historique
function summary(siteId, { q = "", limit = 200 } = {}) {
  const sc = scopeSql(siteId);
  const like = `%${String(q).trim().toLowerCase().replace(/[\\%_]/g, (c) => `\\${c}`)}%`;
  const rows = db.prepare(`SELECT id, keyword, page_url, position, clicks, impressions, source, measured_on FROM seo_rank_entries WHERE ${sc.sql} AND keyword LIKE ? ESCAPE '\\' ORDER BY keyword, measured_on DESC, id DESC LIMIT 20000`).all(...sc.args, like);
  const byKw = new Map();
  for (const r of rows) { if (!byKw.has(r.keyword)) byKw.set(r.keyword, []); byKw.get(r.keyword).push(r); }
  const list = [...byKw.entries()].map(([keyword, h]) => {
    const latest = h[0];
    const prev = h.find((x) => x.measured_on < latest.measured_on) || null;
    return { keyword, latest, previous: prev, delta: prev ? Math.round((latest.position - prev.position) * 100) / 100 : null, history: h.slice(0, 12).reverse(), measures: h.length };
  }).sort((a, b) => a.latest.position - b.latest.position).slice(0, limit);
  return { keywords: list, total: byKw.size, entries: rows.length };
}
function remove(siteId, id, userId) {
  const sc = scopeSql(siteId);
  const row = db.prepare(`SELECT id, keyword, position, measured_on FROM seo_rank_entries WHERE id = ? AND ${sc.sql}`).get(id, ...sc.args);
  if (!row) return false;
  db.prepare("DELETE FROM seo_rank_entries WHERE id = ?").run(id);
  logChange({ entityType: "ranking", entityKey: row.keyword, field: "position", before: `${row.position} (${row.measured_on})`, after: null, userId, siteId: Number.isInteger(siteId) ? siteId : null });
  return true;
}
const purgeKeyword = (siteId, keyword) => { const sc = scopeSql(siteId); return db.prepare(`DELETE FROM seo_rank_entries WHERE ${sc.sql} AND keyword = ?`).run(...sc.args, cleanKeyword(keyword)).changes; };

module.exports = { SOURCES, add, importGsc, parseGscCsv, snapshotFromSearchConsole, summary, remove, purgeKeyword, validateEntry, count };
