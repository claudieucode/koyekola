// Tests A/B des pages (phase 12). A = la page en ligne ; B = une copie composée dans le même éditeur, figée au
// démarrage. Chaque visiteur voit toujours la même version dans la journée : la version se déduit de son empreinte
// quotidienne anonyme (celle des statistiques des pages : adresse IP + navigateur + jour, hachées, jamais conservées),
// sans cookie. Une vue et au plus une conversion par empreinte et par test.
// Verdict : JAMAIS de gagnant avec des données insuffisantes — au moins MIN_VIEWS visiteurs par version, MIN_CONVERSIONS
// conversions au total, et une différence significative (test de comparaison de deux proportions, risque 5 %).
const crypto = require("crypto");
const { MarketingError } = require("../errors");
const { checkCtx, audit } = require("../audience/shared");
const { transaction } = require("../db/tx");
const { line, bad } = require("./sections");

const MIN_VIEWS = 100;
const MIN_CONVERSIONS = 20;
const ALPHA = 0.05;
const GOALS = { signup: "Inscription (formulaire de la page)", click: "Clic sur un bouton ou un lien de la page" };
const STATUS = { draft: "Brouillon", running: "En cours", stopped: "En pause", completed: "Terminé" };
const json = (t, f) => { try { return t ? JSON.parse(t) : f; } catch { return f; } };

const shape = (row) => (row ? { ...row, variantB: json(row.variant_b, null) } : null);
function getTest(ctx, id) {
  checkCtx(ctx);
  return shape(Number.isInteger(id) ? ctx.db.prepare("SELECT * FROM mk_page_tests WHERE id = ? AND organization_id = ?").get(id, ctx.organizationId) : null);
}
function requireTest(ctx, id) {
  const t = getTest(ctx, Number(id));
  if (!t) throw new MarketingError("not_found", "Test introuvable.");
  return t;
}
function listTests(ctx, { pageId } = {}) {
  checkCtx(ctx);
  const where = pageId ? " AND t.page_id = ?" : "";
  return ctx.db.prepare(`SELECT t.*, p.name AS page_name, p.slug AS page_slug,
      (SELECT COUNT(*) FROM mk_page_test_events e WHERE e.test_id = t.id AND e.type = 'view') AS views,
      (SELECT COUNT(*) FROM mk_page_test_events e WHERE e.test_id = t.id AND e.type = 'conversion') AS conversions
    FROM mk_page_tests t JOIN mk_landing_pages p ON p.id = t.page_id WHERE t.organization_id = ?${where} ORDER BY t.id DESC`)
    .all(ctx.organizationId, ...(pageId ? [pageId] : [])).map(shape);
}
const openTestOf = (ctx, pageId) => ctx.db.prepare("SELECT id, name, status FROM mk_page_tests WHERE page_id = ? AND organization_id = ? AND status IN ('draft', 'running', 'stopped')").get(pageId, ctx.organizationId);

// Création : la version B part d'une copie du contenu actuel de la page (modifiable dans l'éditeur)
function createTest(ctx, pageId, { name, goal = "signup", trafficB = 50 } = {}) {
  checkCtx(ctx);
  const pages = require("./index");
  const page = pages.requirePage(ctx, Number(pageId));
  if (page.archived_at) throw bad("Cette page est archivée.");
  if (ctx.db.prepare("SELECT 1 FROM mk_page_tests WHERE variant_page_id = ?").get(page.id)) throw bad("Cette page est la version B d'un test : créez le test depuis la page d'origine.");
  const open = openTestOf(ctx, page.id);
  if (open) throw new MarketingError("in_use", `Un test est déjà en préparation ou en cours sur cette page (« ${open.name} »).`);
  if (!Object.hasOwn(GOALS, goal)) throw bad("Objectif inconnu.");
  const traffic = Number(trafficB);
  if (!Number.isInteger(traffic) || traffic < 10 || traffic > 90) throw bad("Part de visiteurs pour la version B : entre 10 et 90 %.");
  const n = line(name, 100) || `Test du ${new Date().toLocaleDateString("fr-FR")}`;
  return transaction(ctx.db, () => {
    const copy = pages.duplicatePage(ctx, page.id, { siteId: page.site_id });
    let label = `${page.name} — version B`.slice(0, 100), k = 2;
    while (ctx.db.prepare("SELECT 1 FROM mk_landing_pages WHERE organization_id = ? AND name = ? COLLATE NOCASE AND id != ?").get(ctx.organizationId, label, copy.id)) label = `${page.name.slice(0, 80)} — version B (${k++})`;
    ctx.db.prepare("UPDATE mk_landing_pages SET name = ?, form_id = ?, indexable = 0 WHERE id = ?").run(label, page.form_id, copy.id);
    const id = Number(ctx.db.prepare("INSERT INTO mk_page_tests (organization_id, page_id, variant_page_id, name, goal, traffic_b, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)")
      .run(ctx.organizationId, page.id, copy.id, n, goal, traffic, ctx.userId ?? null).lastInsertRowid);
    audit(ctx, "page_test.created", "landing", page.id, { test: id });
    return getTest(ctx, id);
  });
}
function updateTest(ctx, id, { name, goal, trafficB } = {}) {
  const t = requireTest(ctx, id);
  if (t.status === "completed") throw bad("Test terminé : il ne se modifie plus.");
  if (t.status === "running" && (goal !== undefined && goal !== t.goal)) throw bad("Mettez le test en pause pour changer son objectif.");
  const g = goal === undefined ? t.goal : goal;
  if (!Object.hasOwn(GOALS, g)) throw bad("Objectif inconnu.");
  const traffic = trafficB === undefined ? t.traffic_b : Number(trafficB);
  if (!Number.isInteger(traffic) || traffic < 10 || traffic > 90) throw bad("Part de visiteurs pour la version B : entre 10 et 90 %.");
  ctx.db.prepare("UPDATE mk_page_tests SET name = ?, goal = ?, traffic_b = ?, updated_at = datetime('now') WHERE id = ?").run(line(name, 100) || t.name, g, traffic, t.id);
  return getTest(ctx, t.id);
}

// Démarrer (ou reprendre) : A doit être en ligne ; B est validé comme une publication, puis figé
function startTest(ctx, id) {
  const pages = require("./index");
  const landing = require("../landing");
  const t = requireTest(ctx, id);
  if (t.status === "running") return t;
  if (t.status === "completed") throw bad("Test terminé : créez-en un nouveau.");
  const page = pages.requirePage(ctx, t.page_id);
  if (page.status !== "published" || page.archived_at) throw bad("La page doit être en ligne : la version A est la version publiée.");
  const running = ctx.db.prepare("SELECT 1 FROM mk_page_tests WHERE page_id = ? AND status = 'running' AND id != ?").get(t.page_id, t.id);
  if (running) throw bad("Un autre test est déjà en cours sur cette page.");
  let content = t.variantB;
  if (t.status === "draft") {
    const variant = t.variant_page_id ? pages.getPage(ctx, t.variant_page_id) : null;
    if (!variant) throw bad("La version B a été supprimée : créez un nouveau test.");
    content = pages.normalizeContent(ctx, page, variant.working);
    const check = landing.preflight(ctx, { ...page, sections: pages.resolveSections(ctx, content.sections) });
    if (!check.ready) throw new MarketingError("preflight_failed", `Version B : ${check.errors.join(" ")}`);
    // Comparaison du contenu, sans les identifiants (la copie reçoit de nouveaux identifiants de sections et d'éléments)
    const noIds = (v) => JSON.stringify(v, (k, x) => (k === "id" ? undefined : x));
    if (noIds(content.sections) === noIds(page.published.sections) && content.title === page.published.title) throw bad("La version B est identique à la version A : modifiez-la d'abord dans l'éditeur.");
  }
  ctx.db.prepare("UPDATE mk_page_tests SET status = 'running', variant_b = ?, started_at = COALESCE(started_at, datetime('now')), stopped_at = NULL, updated_at = datetime('now') WHERE id = ?")
    .run(JSON.stringify(content), t.id);
  audit(ctx, "page_test.started", "landing", t.page_id, { test: t.id });
  return getTest(ctx, t.id);
}
function stopTest(ctx, id) {
  const t = requireTest(ctx, id);
  if (t.status !== "running") throw bad("Le test n'est pas en cours.");
  ctx.db.prepare("UPDATE mk_page_tests SET status = 'stopped', stopped_at = datetime('now'), updated_at = datetime('now') WHERE id = ?").run(t.id);
  return getTest(ctx, t.id);
}
// Terminer en gardant A, ou en appliquant B (copié dans le BROUILLON de la page : « Publier » le met en ligne)
function decideTest(ctx, id, winner) {
  const pages = require("./index");
  const t = requireTest(ctx, id);
  if (!["a", "b"].includes(winner)) throw bad("Version inconnue.");
  if (!["running", "stopped"].includes(t.status) || !t.variantB) throw bad("Seul un test démarré peut être terminé.");
  return transaction(ctx.db, () => {
    ctx.db.prepare("UPDATE mk_page_tests SET status = 'completed', winner = ?, decided_by = 'manual', stopped_at = COALESCE(stopped_at, datetime('now')), updated_at = datetime('now') WHERE id = ?").run(winner, t.id);
    if (winner === "b") {
      const page = pages.requirePage(ctx, t.page_id);
      pages.saveDraft(ctx, page.id, { ...page.working, ...t.variantB, seo: page.working.seo, theme: page.working.theme }, { revision: page.revision });
    }
    audit(ctx, "page_test.completed", "landing", t.page_id, { test: t.id, winner });
    return getTest(ctx, t.id);
  });
}
// Supprimer : test en brouillon ou terminé (la page « version B » est supprimée avec lui)
function deleteTest(ctx, id) {
  const t = requireTest(ctx, id);
  if (["running", "stopped"].includes(t.status)) throw bad("Terminez d'abord le test.");
  transaction(ctx.db, () => {
    ctx.db.prepare("DELETE FROM mk_page_tests WHERE id = ?").run(t.id);
    if (t.variant_page_id) ctx.db.prepare("DELETE FROM mk_landing_pages WHERE id = ? AND organization_id = ? AND status != 'published'").run(t.variant_page_id, ctx.organizationId);
  });
  audit(ctx, "page_test.deleted", "landing", t.page_id, { test: t.id });
}

// ---------- Côté public ----------
const runningTestFor = (db, pageId) => shape(db.prepare("SELECT * FROM mk_page_tests WHERE page_id = ? AND status = 'running'").get(pageId));
// Version d'un visiteur (stable pour la journée) : répartition selon traffic_b
function variantFor(test, visitor) {
  const n = crypto.createHash("sha256").update(`${test.id}:${visitor}`).digest().readUInt32BE(0) % 100;
  return n < test.traffic_b ? "b" : "a";
}
function recordView(db, test, visitor, now = Date.now()) {
  db.prepare("INSERT OR IGNORE INTO mk_page_test_events (test_id, variant, visitor, type, occurred_at) VALUES (?, ?, ?, 'view', ?)").run(test.id, variantFor(test, visitor), visitor, now);
}
// Conversion : seulement pour un visiteur qui a vu la page pendant le test (même version, même journée)
function recordConversion(db, test, visitor, kind, now = Date.now()) {
  if (kind !== test.goal) return false;
  const view = db.prepare("SELECT variant FROM mk_page_test_events WHERE test_id = ? AND visitor = ? AND type = 'view'").get(test.id, visitor);
  if (!view) return false;
  return db.prepare("INSERT OR IGNORE INTO mk_page_test_events (test_id, variant, visitor, type, occurred_at) VALUES (?, ?, ?, 'conversion', ?)").run(test.id, view.variant, visitor, now).changes > 0;
}

// ---------- Résultats ----------
// Fonction de répartition de la loi normale (approximation d'Abramowitz et Stegun, erreur < 1,5e-7)
function normalCdf(z) {
  const t = 1 / (1 + 0.3275911 * Math.abs(z) / Math.SQRT2);
  const y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-(z * z) / 2);
  return z >= 0 ? (1 + y) / 2 : (1 - y) / 2;
}
// Comparaison de deux proportions (test bilatéral, variance commune)
function compare(a, b) {
  const pa = a.views ? a.conversions / a.views : 0, pb = b.views ? b.conversions / b.views : 0;
  const pooled = (a.conversions + b.conversions) / ((a.views + b.views) || 1);
  const se = Math.sqrt(pooled * (1 - pooled) * (1 / (a.views || 1) + 1 / (b.views || 1)));
  const z = se ? (pb - pa) / se : 0;
  const p = se ? 2 * (1 - normalCdf(Math.abs(z))) : 1;
  return { z, p };
}
const pct = (part, whole) => (whole ? Math.round((part / whole) * 1000) / 10 : null);
function results(ctx, test, { now = Date.now() } = {}) {
  checkCtx(ctx);
  const count = ctx.db.prepare("SELECT variant, type, COUNT(*) n FROM mk_page_test_events WHERE test_id = ? GROUP BY variant, type").all(test.id);
  const v = { a: { views: 0, conversions: 0 }, b: { views: 0, conversions: 0 } };
  for (const r of count) v[r.variant][r.type === "view" ? "views" : "conversions"] = r.n;
  for (const k of ["a", "b"]) v[k].rate = pct(v[k].conversions, v[k].views);
  const { p } = compare(v.a, v.b);
  const enough = v.a.views >= MIN_VIEWS && v.b.views >= MIN_VIEWS && v.a.conversions + v.b.conversions >= MIN_CONVERSIONS;
  let verdict;
  if (!enough) verdict = { kind: "insufficient", needViews: Math.max(0, MIN_VIEWS - Math.min(v.a.views, v.b.views)), needConversions: Math.max(0, MIN_CONVERSIONS - v.a.conversions - v.b.conversions) };
  else if (p >= ALPHA) verdict = { kind: "no_difference", confidence: Math.floor((1 - p) * 1000) / 10 };
  else {
    const winner = (v.b.rate || 0) > (v.a.rate || 0) ? "b" : "a";
    const loser = winner === "a" ? "b" : "a";
    // Écart relatif calculé sur les taux exacts (pas sur les taux arrondis affichés)
    const exact = (k) => v[k].conversions / v[k].views;
    verdict = { kind: "winner", winner, confidence: Math.min(99.9, Math.floor((1 - p) * 1000) / 10), uplift: exact(loser) ? Math.round(((exact(winner) - exact(loser)) / exact(loser)) * 1000) / 10 : null };
  }
  // Évolution : taux par jour et par version (14 derniers jours du test)
  const since = now - 14 * 86400000;
  const days = ctx.db.prepare(`SELECT CAST(occurred_at / 86400000 AS INTEGER) d, variant, SUM(type = 'view') views, SUM(type = 'conversion') conversions
    FROM mk_page_test_events WHERE test_id = ? AND occurred_at >= ? GROUP BY d, variant ORDER BY d`).all(test.id, since);
  const evolution = [];
  for (const r of days) {
    let row = evolution.find((e) => e.day === r.d);
    if (!row) { row = { day: r.d, date: new Date(r.d * 86400000).toISOString().slice(0, 10), a: null, b: null }; evolution.push(row); }
    row[r.variant] = { views: r.views, conversions: r.conversions, rate: pct(r.conversions, r.views) };
  }
  return { variants: v, p, verdict, evolution, minViews: MIN_VIEWS, minConversions: MIN_CONVERSIONS };
}

module.exports = {
  GOALS, STATUS, MIN_VIEWS, MIN_CONVERSIONS, getTest, requireTest, listTests, createTest, updateTest, startTest, stopTest, decideTest, deleteTest,
  runningTestFor, variantFor, recordView, recordConversion, results, compare, normalCdf,
};
