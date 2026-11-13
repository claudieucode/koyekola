// Moteur d'A/B testing de KOLAKISA (phase 12, étendu au palier 22). A = la page en ligne ; B = une copie composée dans le même éditeur,
// figée au démarrage. Le moteur possède : expériences, versions, répartition, affectation, exposition, objectif, statut, lecture des résultats
// et décision. L'Analytics central reste propriétaire des événements, sessions et agrégats : la boutique reste propriétaire des commandes
// (le chiffre d'affaires est LU, jamais recalculé ni recopié).
//  - Affectation collante : un visiteur qui a accepté le suivi (cookie kw_vid) garde sa version pendant tout le test (sa première
//    exposition est mémorisée) ; sans accord, seule l'empreinte anonyme du jour (IP + navigateur + jour, hachée, jamais conservée) existe :
//    la version tient pour la journée, sans cookie (limite documentée : cette personne est recomptée le lendemain).
//  - Exposition = la page a réellement été rendue (réponse 200) à un visiteur humain. Une page en erreur, un robot ou un aperçu ne comptent pas.
//  - Verdict : JAMAIS de gagnant sans données suffisantes (voir abstats.js pour la méthode) ; un « gagnant » exige aussi 7 jours d'observation
//    et une répartition conforme à celle réglée.
const crypto = require("crypto");
const { MarketingError } = require("../errors");
const { checkCtx, audit, siteSql } = require("../audience/shared");
const { transaction } = require("../db/tx");
const { line, bad } = require("./sections");
const stats = require("./abstats");

const MIN_VIEWS = 100;
const MIN_CONVERSIONS = 20;
const MIN_DAYS = 7;
const DAY = 86400000;
const GOALS = { signup: "Inscription (formulaire de la page)", click: "Clic sur un bouton ou un lien de la page", purchase: "Achat (commande payée dans la boutique)" };
const STATUS = { draft: "Brouillon", running: "En cours", stopped: "En pause", completed: "Terminé" };
// Transitions permises ; l'archivage est un drapeau (archived_at) qui bloque tout le reste jusqu'à la restauration
const TRANSITIONS = { draft: ["running"], running: ["stopped", "completed"], stopped: ["running", "completed"], completed: [] };
const json = (t, f) => { try { return t ? JSON.parse(t) : f; } catch { return f; } };

const shape = (row) => (row ? { ...row, variantB: json(row.variant_b, null), goalKey: row.goal_key || row.goal, archived: Boolean(row.archived_at), minViewsEff: row.min_views || MIN_VIEWS } : null);
// Un accès limité à un site (ctx.siteScope, imposé par le serveur) ne voit que les expériences de ce site
const inScope = (ctx, row) => !Number.isInteger(ctx.siteScope) || row.site_id === ctx.siteScope;
function getTest(ctx, id) {
  checkCtx(ctx);
  const row = Number.isInteger(id) ? ctx.db.prepare("SELECT * FROM mk_page_tests WHERE id = ? AND organization_id = ?").get(id, ctx.organizationId) : null;
  return row && inScope(ctx, row) ? shape(row) : null;
}
function requireTest(ctx, id) {
  const t = getTest(ctx, Number(id));
  if (!t) throw new MarketingError("not_found", "Test introuvable.");
  return t;
}
const COUNTS = `(SELECT COUNT(*) FROM mk_page_test_events e WHERE e.test_id = t.id AND e.type = 'view') AS views,
      (SELECT COUNT(*) FROM mk_page_test_events e WHERE e.test_id = t.id AND e.type = 'conversion') AS conversions`;
function listTests(ctx, { pageId } = {}) {
  checkCtx(ctx);
  const sc = siteSql(ctx, "t");
  const where = pageId ? " AND t.page_id = ?" : "";
  return ctx.db.prepare(`SELECT t.*, p.name AS page_name, p.slug AS page_slug, ${COUNTS}
    FROM mk_page_tests t JOIN mk_landing_pages p ON p.id = t.page_id WHERE t.organization_id = ? AND ${sc.sql}${where} ORDER BY t.id DESC`)
    .all(ctx.organizationId, ...sc.params, ...(pageId ? [pageId] : [])).map(shape);
}
// Liste filtrée, triée et paginée (écran « Tests A/B ») : statut (all|draft|running|stopped|completed|archived), recherche, tri
const SORTS = { recent: "t.id DESC", name: "t.name COLLATE NOCASE ASC", status: "t.status ASC, t.id DESC", views: "views DESC, t.id DESC" };
function searchTests(ctx, { status = "all", q = "", sort = "recent", page = 1, size = 25 } = {}) {
  checkCtx(ctx);
  const sc = siteSql(ctx, "t");
  const cond = [`t.organization_id = ?`, sc.sql];
  const params = [ctx.organizationId, ...sc.params];
  if (status === "archived") cond.push("t.archived_at IS NOT NULL");
  else { cond.push("t.archived_at IS NULL"); if (Object.hasOwn(STATUS, status)) { cond.push("t.status = ?"); params.push(status); } }
  const needle = String(q || "").trim().slice(0, 100);
  if (needle) { cond.push("(t.name LIKE ? ESCAPE '\\' OR p.name LIKE ? ESCAPE '\\')"); const like = `%${needle.replace(/[\\%_]/g, "\\$&")}%`; params.push(like, like); }
  const from = `FROM mk_page_tests t JOIN mk_landing_pages p ON p.id = t.page_id WHERE ${cond.join(" AND ")}`;
  const total = ctx.db.prepare(`SELECT COUNT(*) n ${from}`).get(...params).n;
  const pageSize = Math.min(100, Math.max(5, Number(size) || 25));
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const current = Math.min(pages, Math.max(1, Number(page) || 1));
  const rows = ctx.db.prepare(`SELECT t.*, p.name AS page_name, p.slug AS page_slug, ${COUNTS} ${from} ORDER BY ${SORTS[sort] || SORTS.recent} LIMIT ? OFFSET ?`)
    .all(...params, pageSize, (current - 1) * pageSize).map(shape);
  const counts = { all: 0, archived: 0 };
  for (const r of ctx.db.prepare(`SELECT t.status, t.archived_at IS NOT NULL AS arch, COUNT(*) n FROM mk_page_tests t WHERE t.organization_id = ? AND ${sc.sql} GROUP BY t.status, arch`).all(ctx.organizationId, ...sc.params)) {
    if (r.arch) counts.archived += r.n; else { counts[r.status] = (counts[r.status] || 0) + r.n; counts.all += r.n; }
  }
  return { rows, total, page: current, pages, size: pageSize, counts };
}
const openTestOf = (ctx, pageId) => ctx.db.prepare("SELECT id, name, status FROM mk_page_tests WHERE page_id = ? AND organization_id = ? AND archived_at IS NULL AND status IN ('draft', 'running', 'stopped')").get(pageId, ctx.organizationId);

function readSettings(input, base = {}) {
  const out = {};
  if (input.goal !== undefined || base.goal === undefined) {
    const goal = input.goal === undefined ? "signup" : String(input.goal);
    if (!Object.hasOwn(GOALS, goal)) throw bad("Objectif inconnu.");
    out.goal = goal;
  }
  if (input.trafficB !== undefined || base.traffic_b === undefined) {
    const traffic = input.trafficB === undefined ? 50 : Number(input.trafficB);
    if (!Number.isInteger(traffic) || traffic < 10 || traffic > 90) throw bad("Part de visiteurs pour la version B : entre 10 et 90 % (A reçoit le reste : le total fait toujours 100 %).");
    out.trafficB = traffic;
  }
  if (input.confidence !== undefined) {
    const c = Number(input.confidence);
    if (!stats.CONFIDENCES.includes(c)) throw bad("Niveau de confiance : 90, 95 ou 99 %.");
    out.confidence = c;
  }
  if (input.attributionDays !== undefined) {
    const d = Number(input.attributionDays);
    if (!Number.isInteger(d) || d < 1 || d > 30) throw bad("Fenêtre d'attribution : entre 1 et 30 jours.");
    out.attributionDays = d;
  }
  if (input.minViews !== undefined) {
    if (input.minViews === "" || input.minViews === null) out.minViews = null;
    else {
      const m = Number(input.minViews);
      if (!Number.isInteger(m) || m < 30 || m > 100000) throw bad("Visiteurs minimum par version : entre 30 et 100 000.");
      out.minViews = m;
    }
  }
  if (input.description !== undefined) out.description = line(input.description, 500);
  return out;
}

// Création : la version B part d'une copie du contenu actuel de la page (modifiable dans l'éditeur)
function createTest(ctx, pageId, { name, goal = "signup", trafficB = 50, description, confidence, attributionDays, minViews } = {}) {
  checkCtx(ctx);
  const pages = require("./index");
  const page = pages.requirePage(ctx, Number(pageId));
  if (Number.isInteger(ctx.siteScope) && page.site_id !== ctx.siteScope) throw new MarketingError("not_found", "Page introuvable.");
  if (page.archived_at) throw bad("Cette page est archivée.");
  if (ctx.db.prepare("SELECT 1 FROM mk_page_tests WHERE variant_page_id = ?").get(page.id)) throw bad("Cette page est la version B d'un test : créez le test depuis la page d'origine.");
  const open = openTestOf(ctx, page.id);
  if (open) throw new MarketingError("in_use", `Un test est déjà en préparation ou en cours sur cette page (« ${open.name} »).`);
  const o = readSettings({ goal, trafficB, description, confidence, attributionDays, minViews });
  const n = line(name, 100) || `Test du ${new Date().toLocaleDateString("fr-FR")}`;
  return transaction(ctx.db, () => {
    const copy = pages.duplicatePage(ctx, page.id, { siteId: page.site_id });
    let label = `${page.name} — version B`.slice(0, 100), k = 2;
    while (ctx.db.prepare("SELECT 1 FROM mk_landing_pages WHERE organization_id = ? AND name = ? COLLATE NOCASE AND id != ?").get(ctx.organizationId, label, copy.id)) label = `${page.name.slice(0, 80)} — version B (${k++})`;
    // La copie n'est jamais publique : hors index, hors ligne tant que le test dure
    ctx.db.prepare("UPDATE mk_landing_pages SET name = ?, form_id = ?, indexable = 0 WHERE id = ?").run(label, page.form_id, copy.id);
    // `goal` (anciennes valeurs permises : signup, click) reste valide ; l'objectif commercial vit dans goal_key
    const legacy = o.goal === "click" ? "click" : "signup";
    const id = Number(ctx.db.prepare(`INSERT INTO mk_page_tests (organization_id, page_id, variant_page_id, name, goal, goal_key, traffic_b, created_by, site_id, description, confidence, attribution_days, min_views)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .run(ctx.organizationId, page.id, copy.id, n, legacy, o.goal === "purchase" ? "purchase" : "", o.trafficB, ctx.userId ?? null, page.site_id ?? null, o.description || "", o.confidence ?? 95, o.attributionDays ?? 7, o.minViews ?? null).lastInsertRowid);
    audit(ctx, "page_test.created", "landing", page.id, { test: id, goal: o.goal });
    return getTest(ctx, id);
  });
}
function updateTest(ctx, id, input = {}) {
  const t = requireTest(ctx, id);
  if (t.archived) throw bad("Test archivé : restaurez-le d'abord.");
  if (t.status === "completed") throw bad("Test terminé : il ne se modifie plus.");
  const o = readSettings(input, t);
  // Pendant un test en cours, les règles du jeu ne bougent pas (sinon les résultats deviendraient incomparables et le seuil pourrait être choisi après coup)
  if (t.status === "running") {
    for (const [k, was, label] of [["goal", t.goalKey, "l'objectif"], ["trafficB", t.traffic_b, "la répartition"], ["confidence", t.confidence, "le niveau de confiance"], ["attributionDays", t.attribution_days, "la fenêtre d'attribution"], ["minViews", t.min_views, "la taille minimale"]]) {
      if (o[k] !== undefined && o[k] !== was) throw bad(`Mettez le test en pause pour changer ${label}.`);
    }
  }
  const goal = o.goal ?? t.goalKey;
  const legacy = goal === "click" ? "click" : "signup";
  ctx.db.prepare(`UPDATE mk_page_tests SET name = ?, goal = ?, goal_key = ?, traffic_b = ?, description = ?, confidence = ?, attribution_days = ?, min_views = ?, updated_at = datetime('now') WHERE id = ?`)
    .run(line(input.name, 100) || t.name, legacy, goal === "purchase" ? "purchase" : "", o.trafficB ?? t.traffic_b, o.description ?? t.description, o.confidence ?? t.confidence, o.attributionDays ?? t.attribution_days, o.minViews === undefined ? t.min_views : o.minViews, t.id);
  audit(ctx, "page_test.updated", "landing", t.page_id, { test: t.id, was: { goal: t.goalKey, traffic_b: t.traffic_b, confidence: t.confidence } });
  return getTest(ctx, t.id);
}
function assertTransition(t, to) {
  if (t.archived) throw bad("Test archivé : restaurez-le d'abord.");
  if (!TRANSITIONS[t.status].includes(to)) throw bad(`Transition impossible : « ${STATUS[t.status]} » vers « ${STATUS[to] || to} ».`);
}

// Contrôles avant démarrage : « blocking » empêche le démarrage ; « warnings » informe
function validateStart(ctx, t) {
  const pages = require("./index");
  const blocking = [], warnings = [];
  const page = pages.getPage(ctx, t.page_id);
  if (!page) return { blocking: ["La page testée n'existe plus."], warnings, page: null, variant: null };
  if (page.status !== "published" || page.archived_at) blocking.push("La page doit être en ligne : la version A est la version publiée.");
  if (t.site_id !== (page.site_id ?? null)) blocking.push("Le site du test ne correspond plus à celui de la page.");
  const other = ctx.db.prepare("SELECT name FROM mk_page_tests WHERE page_id = ? AND status = 'running' AND id != ?").get(t.page_id, t.id);
  if (other) blocking.push(`Un autre test est déjà en cours sur cette page (« ${other.name} »).`);
  let variant = null;
  if (t.status === "draft") {
    variant = t.variant_page_id ? pages.getPage(ctx, t.variant_page_id) : null;
    if (!variant || variant.archived_at) blocking.push("La version B a été supprimée : créez un nouveau test.");
    else if ((variant.site_id ?? null) !== (page.site_id ?? null)) blocking.push("La version B n'est pas dans le même site que la page.");
  } else if (!t.variantB) blocking.push("La version B figée est introuvable : créez un nouveau test.");
  if (t.goalKey === "purchase" && !ctx.db.prepare("SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = 'orders'").get()) blocking.push("L'objectif « achat » demande la boutique, qui n'est pas disponible.");
  if (t.goalKey === "signup" && !(page.published.sections || []).some(hasForm)) warnings.push("Cette page ne semble pas contenir de formulaire d'inscription : aucune inscription ne sera comptée si ce n'est pas le cas.");
  if (t.goalKey === "purchase") warnings.push("Les achats ne sont attribués qu'aux visiteurs qui ont accepté le suivi et sont reliés à un contact.");
  return { blocking, warnings, page, variant };
}
const hasForm = (s) => s && (s.type === "form" || (s.type === "layout" && walkFind(s.children)));
function walkFind(nodes) { return (nodes || []).some((n) => n && (n.type === "signupform" || walkFind(n.children))); }

// Démarrer (ou reprendre) : A doit être en ligne ; B est validé comme une publication, puis figé
function startTest(ctx, id) {
  const pages = require("./index");
  const landing = require("../landing");
  const t = requireTest(ctx, id);
  if (t.status === "running" && !t.archived) return t;
  assertTransition(t, "running");
  const check0 = validateStart(ctx, t);
  if (check0.blocking.length) throw bad(check0.blocking.join(" "));
  const { page, variant } = check0;
  let content = t.variantB;
  if (t.status === "draft") {
    content = pages.normalizeContent(ctx, page, variant.working);
    const check = landing.preflight(ctx, { ...page, sections: pages.resolveSections(ctx, content.sections) });
    if (!check.ready) throw new MarketingError("preflight_failed", `Version B : ${check.errors.join(" ")}`);
    // Comparaison du contenu, sans les identifiants (la copie reçoit de nouveaux identifiants de sections et d'éléments)
    const noIds = (v) => JSON.stringify(v, (k, x) => (k === "id" ? undefined : x));
    if (noIds(content.sections) === noIds(page.published.sections) && content.title === page.published.title) throw bad("La version B est identique à la version A : modifiez-la d'abord dans l'éditeur.");
  }
  ctx.db.prepare("UPDATE mk_page_tests SET status = 'running', variant_b = ?, started_at = COALESCE(started_at, datetime('now')), stopped_at = NULL, updated_at = datetime('now') WHERE id = ?")
    .run(JSON.stringify(content), t.id);
  audit(ctx, t.status === "stopped" ? "page_test.resumed" : "page_test.started", "landing", t.page_id, { test: t.id });
  return getTest(ctx, t.id);
}
// Pause : plus aucune exposition (tous les visiteurs voient A) ; les données restent intactes
function stopTest(ctx, id) {
  const t = requireTest(ctx, id);
  if (t.archived) throw bad("Test archivé : restaurez-le d'abord.");
  if (t.status !== "running") throw bad("Le test n'est pas en cours.");
  ctx.db.prepare("UPDATE mk_page_tests SET status = 'stopped', stopped_at = datetime('now'), updated_at = datetime('now') WHERE id = ?").run(t.id);
  audit(ctx, "page_test.paused", "landing", t.page_id, { test: t.id });
  return getTest(ctx, t.id);
}
// Terminer en gardant A, ou en appliquant B (copié dans le BROUILLON de la page : « Publier » le met en ligne). Les données sont conservées.
function decideTest(ctx, id, winner) {
  const pages = require("./index");
  const t = requireTest(ctx, id);
  if (!["a", "b"].includes(winner)) throw bad("Version inconnue.");
  if (!t.variantB || !["running", "stopped"].includes(t.status)) throw bad("Seul un test démarré peut être terminé.");
  assertTransition(t, "completed");
  return transaction(ctx.db, () => {
    ctx.db.prepare("UPDATE mk_page_tests SET status = 'completed', winner = ?, decided_by = 'manual', ended_reason = ?, stopped_at = COALESCE(stopped_at, datetime('now')), updated_at = datetime('now') WHERE id = ?").run(winner, winner === "b" ? "apply_b" : "keep_a", t.id);
    if (winner === "b") {
      const page = pages.requirePage(ctx, t.page_id);
      pages.saveDraft(ctx, page.id, { ...page.working, ...t.variantB, seo: page.working.seo, theme: page.working.theme }, { revision: page.revision });
    }
    audit(ctx, "page_test.completed", "landing", t.page_id, { test: t.id, winner });
    return getTest(ctx, t.id);
  });
}
// Archiver (suppression douce) : un test brouillon ou terminé quitte les listes ; rien n'est effacé
function archiveTest(ctx, id) {
  const t = requireTest(ctx, id);
  if (t.archived) return t;
  if (["running", "stopped"].includes(t.status)) throw bad("Terminez d'abord le test.");
  ctx.db.prepare("UPDATE mk_page_tests SET archived_at = datetime('now'), updated_at = datetime('now') WHERE id = ?").run(t.id);
  audit(ctx, "page_test.archived", "landing", t.page_id, { test: t.id });
  return getTest(ctx, t.id);
}
function restoreTest(ctx, id) {
  const t = requireTest(ctx, id);
  if (!t.archived) return t;
  if (t.status === "draft" && openTestOf(ctx, t.page_id)) throw bad("Un autre test est déjà en préparation sur cette page.");
  ctx.db.prepare("UPDATE mk_page_tests SET archived_at = NULL, updated_at = datetime('now') WHERE id = ?").run(t.id);
  audit(ctx, "page_test.restored", "landing", t.page_id, { test: t.id });
  return getTest(ctx, t.id);
}
// Supprimer : seulement un brouillon qui n'a produit AUCUNE donnée (sinon : archiver). La copie « version B » part avec lui.
function deleteTest(ctx, id) {
  const t = requireTest(ctx, id);
  if (t.status !== "draft") throw bad("Un test démarré ne se supprime pas : terminez-le puis archivez-le (ses résultats sont conservés).");
  if (ctx.db.prepare("SELECT 1 FROM mk_page_test_events WHERE test_id = ? LIMIT 1").get(t.id)) throw bad("Ce test a déjà produit des données : archivez-le plutôt.");
  transaction(ctx.db, () => {
    ctx.db.prepare("DELETE FROM mk_page_tests WHERE id = ?").run(t.id);
    if (t.variant_page_id) ctx.db.prepare("DELETE FROM mk_landing_pages WHERE id = ? AND organization_id = ? AND status != 'published'").run(t.variant_page_id, ctx.organizationId);
  });
  audit(ctx, "page_test.deleted", "landing", t.page_id, { test: t.id });
}
// Une page testée (version A ou B d'un test non terminé) ne part pas à la corbeille en silence
function guardPageRemoval(ctx, pageId, action = "mise à la corbeille") {
  const t = ctx.db.prepare(`SELECT name FROM mk_page_tests WHERE organization_id = ? AND archived_at IS NULL AND status IN ('draft', 'running', 'stopped') AND (page_id = ? OR variant_page_id = ?)`).get(ctx.organizationId, pageId, pageId);
  if (t) throw new MarketingError("in_use", `Cette page est utilisée par le test A/B « ${t.name} » : terminez-le (ou supprimez-le s'il est en brouillon) avant la ${action}.`);
}

// ---------- Côté public ----------
const runningTestFor = (db, pageId) => shape(db.prepare("SELECT * FROM mk_page_tests WHERE page_id = ? AND status = 'running' AND archived_at IS NULL").get(pageId));
// Version tirée d'un visiteur : répartition selon traffic_b, déterminée par une empreinte (jamais Math.random) — le même visiteur retombe toujours au même endroit
function variantFor(test, visitor) {
  const n = crypto.createHash("sha256").update(`${test.id}:${visitor}`).digest().readUInt32BE(0) % 100;
  return n < test.traffic_b ? "b" : "a";
}
// Affectation : vid = identifiant du cookie d'un visiteur ayant accepté le suivi (sinon null) ; fingerprint = empreinte anonyme du jour.
// Un visiteur déjà exposé garde sa première version même si la répartition a été réglée autrement entre-temps (affectation collante).
function assignment(db, test, { vid = null, fingerprint }) {
  const consent = Boolean(vid);
  const visitor = vid || fingerprint;
  const seen = db.prepare("SELECT variant FROM mk_page_test_events WHERE test_id = ? AND visitor = ? AND type = 'view'").get(test.id, visitor);
  return { visitor, consent, variant: seen ? seen.variant : variantFor(test, visitor) };
}
// Exposition : la page a réellement été rendue à ce visiteur (l'appelant n'enregistre qu'après une réponse réussie)
function recordView(db, test, visitor, now = Date.now(), { consent = false } = {}) {
  const seen = db.prepare("SELECT variant FROM mk_page_test_events WHERE test_id = ? AND visitor = ? AND type = 'view'").get(test.id, visitor);
  db.prepare("INSERT OR IGNORE INTO mk_page_test_events (test_id, variant, visitor, type, occurred_at, consent) VALUES (?, ?, ?, 'view', ?, ?)").run(test.id, seen ? seen.variant : variantFor(test, visitor), visitor, now, consent ? 1 : 0);
}
// Conversion : seulement pour un visiteur exposé pendant le test, dans la fenêtre d'attribution, avec la version qu'il a vue
function recordConversion(db, test, visitor, kind, now = Date.now()) {
  if (kind !== (test.goalKey || test.goal)) return false;
  const view = db.prepare("SELECT variant, occurred_at, consent FROM mk_page_test_events WHERE test_id = ? AND visitor = ? AND type = 'view'").get(test.id, visitor);
  if (!view) return false;
  if (now - view.occurred_at > (test.attribution_days || 7) * DAY) return false;
  return db.prepare("INSERT OR IGNORE INTO mk_page_test_events (test_id, variant, visitor, type, occurred_at, consent) VALUES (?, ?, ?, 'conversion', ?, ?)").run(test.id, view.variant, visitor, now, view.consent).changes > 0;
}

// ---------- Boutique (lecture seule) ----------
// Achats attribués aux versions : un « visiteur » est une personne (le contact s'il est connu, sinon l'identifiant du cookie) ayant accepté le suivi.
// Une commande payée compte pour la version de la PREMIÈRE exposition de cette personne si elle tombe dans la fenêtre d'attribution après cette
// exposition ; une personne vue dans les deux versions (deux appareils) est exclue des deux côtés et comptée à part. Un achat sans visite suivie
// reliée à un contact n'est attribuable à personne : il n'est jamais deviné.
function commerceOf(ctx, test) {
  const db = ctx.db;
  const empty = { a: blank(), b: blank() };
  if (!db.prepare("SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = 'orders'").get()) return { available: false, reason: "La boutique n'est pas disponible.", variants: empty, ambiguous: 0 };
  const rows = db.prepare(`SELECT e.visitor, e.variant, e.occurred_at AS at, w.contact_id FROM mk_page_test_events e
      LEFT JOIN mk_web_visitors w ON w.id = e.visitor AND w.organization_id = ? WHERE e.test_id = ? AND e.type = 'view' AND e.consent = 1`).all(ctx.organizationId, test.id);
  const units = new Map();
  for (const r of rows) {
    const key = r.contact_id ? `c${r.contact_id}` : `v${r.visitor}`;
    const u = units.get(key) || { key, contact: r.contact_id || null, variants: new Set(), at: r.at };
    u.variants.add(r.variant); u.at = Math.min(u.at, r.at);
    units.set(key, u);
  }
  const out = { a: blank(), b: blank() };
  let ambiguous = 0;
  const usable = [];
  for (const u of units.values()) {
    if (u.variants.size > 1) { ambiguous += 1; continue; }
    const v = [...u.variants][0];
    out[v].units += 1;
    usable.push({ ...u, variant: v });
  }
  const userOf = new Map();
  const contactIds = [...new Set(usable.map((u) => u.contact).filter(Number.isInteger))];
  for (let i = 0; i < contactIds.length; i += 400) {
    const chunk = contactIds.slice(i, i + 400);
    for (const r of db.prepare(`SELECT c.id AS contact_id, u.id AS user_id FROM mk_contacts c JOIN users u ON u.id = c.lms_user_id AND c.email = lower(trim(u.email))
        WHERE c.organization_id = ? AND c.id IN (${chunk.map(() => "?").join(",")})`).all(ctx.organizationId, ...chunk)) userOf.set(r.contact_id, r.user_id);
  }
  const byUser = new Map();
  for (const u of usable) { const uid = u.contact && userOf.get(u.contact); if (uid) byUser.set(uid, u); }
  const userIds = [...byUser.keys()];
  const window = (test.attribution_days || 7) * DAY;
  const buyers = new Set();
  for (let i = 0; i < userIds.length; i += 400) {
    const chunk = userIds.slice(i, i + 400);
    const orders = db.prepare(`SELECT id, user_id, total_cents, created_at FROM orders WHERE total_cents > 0 AND user_id IN (${chunk.map(() => "?").join(",")})`).all(...chunk);
    const refunds = new Map();
    if (orders.length && db.prepare("SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = 'order_refunds'").get()) {
      const ids = orders.map((o) => o.id);
      for (let j = 0; j < ids.length; j += 400) {
        const sub = ids.slice(j, j + 400);
        for (const r of db.prepare(`SELECT order_id, SUM(amount_cents) cents FROM order_refunds WHERE order_id IN (${sub.map(() => "?").join(",")}) GROUP BY order_id`).all(...sub)) refunds.set(r.order_id, r.cents);
      }
    }
    for (const o of orders) {
      const u = byUser.get(o.user_id);
      const at = Date.parse(`${o.created_at.replace(" ", "T")}Z`);
      if (!u || at < u.at || at > u.at + window) continue;
      const v = out[u.variant];
      v.orders += 1; v.grossCents += o.total_cents; v.refundCents += Math.min(o.total_cents, refunds.get(o.id) || 0);
      buyers.add(u.key);
      u.bought = true;
    }
  }
  for (const u of usable) if (u.bought) out[u.variant].buyers += 1;
  for (const k of ["a", "b"]) {
    const v = out[k];
    v.netCents = v.grossCents - v.refundCents;
    v.rate = v.units ? v.buyers / v.units : null;
    v.revenuePerVisitorCents = v.units ? Math.round(v.netCents / v.units) : null;
    v.revenuePerBuyerCents = v.buyers ? Math.round(v.netCents / v.buyers) : null;
    v.avgOrderCents = v.orders ? Math.round(v.grossCents / v.orders) : null;
  }
  return { available: true, variants: out, ambiguous, windowDays: test.attribution_days || 7 };
}
function blank() { return { units: 0, buyers: 0, orders: 0, grossCents: 0, refundCents: 0, netCents: 0, rate: null, revenuePerVisitorCents: null, revenuePerBuyerCents: null, avgOrderCents: null }; }

// ---------- Résultats ----------
const compare = stats.compare;
const normalCdf = stats.normalCdf;
const pct = (part, whole) => (whole ? Math.round((part / whole) * 1000) / 10 : null);
const startedMs = (t) => (t.started_at ? Date.parse(`${t.started_at.replace(" ", "T")}Z`) : null);

function results(ctx, test, { now = Date.now() } = {}) {
  checkCtx(ctx);
  const count = ctx.db.prepare("SELECT variant, type, consent, COUNT(*) n FROM mk_page_test_events WHERE test_id = ? GROUP BY variant, type, consent").all(test.id);
  const v = { a: { views: 0, conversions: 0, tracked: 0 }, b: { views: 0, conversions: 0, tracked: 0 } };
  for (const r of count) {
    if (r.type === "view") { v[r.variant].views += r.n; if (r.consent) v[r.variant].tracked += r.n; } else v[r.variant].conversions += r.n;
  }
  const exposures = { a: v.a.views, b: v.b.views };
  const commerce = commerceOf(ctx, test);
  const goal = test.goalKey;
  // Objectif « achat » : la population mesurée est celle des personnes suivies (accord) — le dénominateur est le même pour les deux versions
  if (goal === "purchase") for (const k of ["a", "b"]) { v[k].views = commerce.variants[k].units; v[k].conversions = commerce.variants[k].buyers; }
  for (const k of ["a", "b"]) v[k].rate = pct(v[k].conversions, v[k].views);
  const cmp = stats.compare(v.a, v.b, test.confidence);
  const minViews = test.minViewsEff;
  const enoughViews = v.a.views >= minViews && v.b.views >= minViews;
  const enoughConv = v.a.conversions + v.b.conversions >= MIN_CONVERSIONS && stats.approximationValid(v.a, v.b);
  const enough = enoughViews && enoughConv;
  const started = startedMs(test);
  const daysRun = started ? Math.max(0, (now - started) / DAY) : 0;
  const leader = v.a.views && v.b.views && cmp.diff !== 0 ? (cmp.diff > 0 ? "b" : "a") : null;
  const alloc = stats.allocationCheck(exposures.a, exposures.b, test.traffic_b / 100);
  const anomalies = anomaliesOf(ctx, test, { v, exposures, alloc, commerce, goal });
  const blocking = anomalies.some((x) => x.level === "error");
  let verdict;
  if (!enough) verdict = { kind: "insufficient", leader, needViews: Math.max(0, minViews - Math.min(v.a.views, v.b.views)), needConversions: Math.max(0, MIN_CONVERSIONS - v.a.conversions - v.b.conversions), approximation: enoughViews && !stats.approximationValid(v.a, v.b) };
  else if (!cmp.significant) verdict = { kind: "inconclusive", leader };
  else {
    const winner = cmp.diff > 0 ? "b" : "a";
    const exact = (k) => v[k].conversions / v[k].views;
    const loser = winner === "a" ? "b" : "a";
    const uplift = exact(loser) ? Math.round(((exact(winner) - exact(loser)) / exact(loser)) * 1000) / 10 : null;
    // « Gagnant » seulement si la mesure est saine et le test a couvert au moins un cycle hebdomadaire ; sinon « significatif » avec la raison
    const reasons = [];
    if (blocking) reasons.push("une anomalie de mesure est signalée");
    if (daysRun < MIN_DAYS) reasons.push(`le test n'a pas encore ${MIN_DAYS} jours (${Math.floor(daysRun)} écoulé(s))`);
    verdict = { kind: reasons.length ? "significant" : "winner", winner, uplift, reasons };
  }
  Object.assign(verdict, { p: cmp.p, confidence: test.confidence, alpha: cmp.alpha });
  // Évolution : taux par jour et par version (14 derniers jours)
  const since = now - 14 * DAY;
  const days = ctx.db.prepare(`SELECT CAST(occurred_at / 86400000 AS INTEGER) d, variant, SUM(type = 'view') views, SUM(type = 'conversion') conversions
    FROM mk_page_test_events WHERE test_id = ? AND occurred_at >= ? GROUP BY d, variant ORDER BY d`).all(test.id, since);
  const evolution = [];
  for (const r of days) {
    let row = evolution.find((e) => e.day === r.d);
    if (!row) { row = { day: r.d, date: new Date(r.d * DAY).toISOString().slice(0, 10), a: null, b: null }; evolution.push(row); }
    row[r.variant] = { views: r.views, conversions: r.conversions, rate: pct(r.conversions, r.views) };
  }
  const baseline = v.a.views ? v.a.conversions / v.a.views : null;
  return {
    variants: v, exposures, p: cmp.p, compare: cmp, verdict, evolution, anomalies, commerce, goal, daysRun,
    allocation: { share: { a: 100 - test.traffic_b, b: test.traffic_b }, observed: alloc.checked ? { a: pct(exposures.a, exposures.a + exposures.b), b: pct(exposures.b, exposures.a + exposures.b) } : null, check: alloc },
    requiredSample: baseline ? stats.requiredSample(baseline, 0.2, test.confidence) : null,
    minViews, minConversions: MIN_CONVERSIONS, minDays: MIN_DAYS,
  };
}
// Anomalies : des alertes, jamais une correction silencieuse des chiffres
function anomaliesOf(ctx, test, { v, exposures, alloc, commerce, goal }) {
  const out = [];
  const add = (level, code, message) => out.push({ level, code, message });
  if (["running", "stopped"].includes(test.status) || test.status === "completed") {
    if (test.status === "running" && exposures.a + exposures.b === 0) add("warn", "no_exposure", "Aucune exposition enregistrée pour l'instant : vérifiez que la page reçoit des visites (les robots ne comptent pas).");
    if (alloc.checked && alloc.mismatch) add("error", "allocation", `La répartition observée (${exposures.a} contre ${exposures.b}) s'écarte trop de celle réglée (${100 - test.traffic_b} / ${test.traffic_b} %) pour être due au hasard : la mesure est faussée (robots, cache, redirection). Ne vous fiez pas à ce résultat.`);
    else if (exposures.a + exposures.b >= 50 && (exposures.a === 0 || exposures.b === 0)) add("error", "zero_variant", "Une des deux versions n'a reçu aucun visiteur.");
  }
  for (const k of ["a", "b"]) if (v[k].conversions > v[k].views) add("error", "conversion_over_exposure", `Version ${k.toUpperCase()} : plus de conversions que de visiteurs — données incohérentes.`);
  const page = ctx.db.prepare("SELECT status, archived_at, site_id FROM mk_landing_pages WHERE id = ?").get(test.page_id);
  if (test.status === "running" && (!page || page.status !== "published" || page.archived_at)) add("error", "page_offline", "La page testée n'est plus en ligne : le test ne reçoit plus de visiteurs.");
  if (page && (page.site_id ?? null) !== (test.site_id ?? null)) add("warn", "site_mismatch", "La page a changé de site depuis le début du test.");
  if (goal === "signup" && exposures.a + exposures.b >= MIN_VIEWS && v.a.conversions + v.b.conversions === 0) add("warn", "no_conversion_tracking", "Aucune inscription mesurée malgré les visites : la page a-t-elle un formulaire d'inscription fonctionnel ?");
  if (goal === "purchase" && commerce.available && commerce.variants.a.units + commerce.variants.b.units === 0 && exposures.a + exposures.b > 0) add("warn", "no_tracked_visitors", "Aucun visiteur n'a accepté le suivi : les achats ne peuvent pas lui être attribués.");
  if (commerce.ambiguous) add("info", "ambiguous", `${commerce.ambiguous} personne(s) ont vu les deux versions (plusieurs appareils) : exclues des achats.`);
  const tracked = v.a.tracked + v.b.tracked, total = exposures.a + exposures.b;
  if (total >= 50 && goal !== "purchase" && tracked < total) add("info", "anonymous", `${Math.round(((total - tracked) / total) * 100)} % des visiteurs n'ont pas accepté le suivi : ils sont comptés à la journée (une même personne revenue un autre jour compte à nouveau).`);
  return out;
}

// Tests EN COURS dont le résultat est concluant (verdict « winner » : assez de données, écart significatif, mesure saine, au moins MIN_DAYS jours).
// Calcul à la demande à partir des vraies données ; rien n'est décidé automatiquement : la personne déclare elle-même le gagnant.
function concludedTests(ctx, { now = Date.now() } = {}) {
  checkCtx(ctx);
  const out = [];
  for (const t of listTests(ctx).filter((x) => x.status === "running" && !x.archived)) {
    let r = null;
    try { r = results(ctx, t, { now }); } catch { r = null; }
    if (r && r.verdict && r.verdict.kind === "winner") out.push({ id: t.id, name: t.name, pageId: t.page_id, pageName: t.page_name, winner: r.verdict.winner, uplift: r.verdict.uplift, confidence: r.verdict.confidence });
  }
  return out;
}
module.exports = {
  GOALS, concludedTests, STATUS, TRANSITIONS, MIN_VIEWS, MIN_CONVERSIONS, MIN_DAYS, getTest, requireTest, listTests, searchTests, createTest, updateTest, startTest, stopTest, decideTest, deleteTest,
  archiveTest, restoreTest, validateStart, guardPageRemoval,
  runningTestFor, variantFor, assignment, recordView, recordConversion, results, commerceOf, compare, normalCdf,
};
