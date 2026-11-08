// Publication d'un modèle (chantier B du pied de page) : résumé lisible des conditions, plan de publication (« où afficher ce pied ? », conflits, chevauchements, effet sur les pages réelles),
// test « ce modèle s'applique-t-il à cette adresse ? » et sélecteurs de cibles (pages, catégories, étiquettes, auteurs, formations, rôles). Lecture seule : aucune écriture ici
// (la publication elle-même est store.publishScoped). Tout est filtré par organisation ET par site.
const Types = require("./types");
const Cond = require("./conditions");
const Res = require("./resolve");
const M = require("./match");
const store = require("./store");
const U = require("./urlContext");

const P = () => require("../marketing/pages");
const q = (s) => `« ${s} »`;
const join = (a) => a.map(q).join(", ");

// ── Résumé en français simple ────────────────────────────────────────────────────────────────────────────────────────────────────────────
function pageNamer(ctx, siteId) {
  let map = null;
  return (id) => { if (!map) { map = new Map(); try { for (const p of P().sitePages(ctx, siteId)) map.set(p.id, p.name); } catch { /* noms indisponibles */ } } return map.get(Number(id)) || `page n° ${id}`; };
}
function labelOf(c, nameOf) {
  if (c.kind === "page" && c.ids && !c.author) return `${c.ids.length > 1 ? "les pages" : "la page"} ${join(c.ids.map(nameOf))}`;
  if (c.kind === "child_of") return `${c.direct ? "les sous-pages directes" : "toutes les sous-pages"} de ${q(nameOf(c.parent))}`;
  return Cond.describeOne(c);
}
// { text, allSite, include: [libellé], exclude: [libellé] } — « Tout le site sauf les pages « A », « B » »
function summary(ctx, siteId, conditions) {
  const cond = conditions || { include: [], exclude: [] }, nameOf = pageNamer(ctx, siteId);
  const include = (cond.include || []).map((c) => labelOf(c, nameOf)), exclude = (cond.exclude || []).map((c) => labelOf(c, nameOf));
  const allSite = include.length === 0;
  const head = allSite ? "Tout le site" : `Uniquement : ${include.join(", ou ")}`;
  return { allSite, include, exclude, text: exclude.length ? `${head}, sauf : ${exclude.join(", ")}` : head };
}

// ── Effet sur les pages réelles du site (pages publiées du Page Builder) ────────────────────────────────────────────────────────────────
function pagesImpact(ctx, siteId, t, pool) {
  const site = store.site(ctx, siteId);
  let pages = []; try { pages = P().sitePages(ctx, siteId).filter((p) => p.status === "published" && p.kind === "page"); } catch { pages = []; }
  let wins = 0; const takes = new Map(); const names = new Map(pool.map((x) => [x.id, x.name]));
  const before = pool.filter((x) => x.id !== t.id);
  for (const p of pages) {
    const c = { siteId, view: site.home_page_id === p.id ? "front" : "page", id: p.id, parents: [], authorId: null, categories: [], categoryAncestors: [], tags: [] };
    const now = Res.resolve(pool, c, { type: t.type }).winner;
    if (now && now.id === t.id) {
      wins += 1;
      const was = Res.resolve(before, c, { type: t.type }).winner;
      if (was) takes.set(was.id, (takes.get(was.id) || 0) + 1);
    }
  }
  return { of: pages.length, wins, takesFrom: [...takes].map(([id, n]) => ({ id, name: names.get(id), pages: n })) };
}

// Plan de publication d'un modèle avec un jeu de conditions éventuel (sans rien écrire)
function plan(ctx, siteId, id, { conditions = null } = {}) {
  const t = store.get(ctx, siteId, id);
  const cond = conditions === null || conditions === undefined ? t.conditions : Cond.normalize(conditions, t.type);
  const everPublished = Boolean(ctx.db.prepare("SELECT 1 FROM mk_tb_versions WHERE template_id = ?").get(t.id));
  const others = store.list(ctx, siteId).filter((o) => o.id !== t.id && o.type === t.type && o.status === "published");
  const cand = { ...t, conditions: cond, status: "published" };
  const pool = [...others, cand];
  const all = Res.conflicts(pool).filter((c) => c.a === t.id || c.b === t.id);
  const nameOf = (c) => (c.a === t.id ? c.b : c.a);
  const byId = new Map(pool.map((x) => [x.id, x]));
  const blocking = all.filter((c) => c.severity === "blocking").map((c) => ({ ...c, otherId: nameOf(c), otherName: byId.get(nameOf(c)).name }));
  const warnings = all.filter((c) => c.severity === "warning").map((c) => ({ ...c, otherId: nameOf(c), otherName: byId.get(nameOf(c)).name }));
  // Chevauchements : même page possible pour les deux modèles ; on dit lequel l'emporte (le plus précis, sinon le plus récemment publié)
  const mine = Res.topScore(cand), incs = cond.include.length ? cond.include : [{ kind: "site" }];
  const overlaps = [];
  for (const o of others) {
    const oi = o.conditions.include.length ? o.conditions.include : [{ kind: "site" }];
    if (!incs.some((x) => oi.some((y) => Res.condOverlap(x, y)))) continue;
    if (JSON.stringify(o.conditions) === JSON.stringify(cond)) continue; // doublon exact : déjà dans « blocking »
    const theirs = Res.topScore(o);
    const relation = mine > theirs ? "mine_wins" : mine < theirs ? "theirs_wins" : "same";
    const message = relation === "mine_wins" ? `Sur les pages qu'ils ont en commun, ce pied (plus précis) remplacera ${q(o.name)}.`
      : relation === "theirs_wins" ? `Sur les pages qu'ils ont en commun, ${q(o.name)} (plus précis) restera affiché : ce pied n'y apparaîtra pas.`
        : `Même précision que ${q(o.name)} : le plus récemment publié (ce pied) l'emportera sur les pages communes.`;
    overlaps.push({ id: o.id, name: o.name, relation, message });
  }
  const impact = pagesImpact(ctx, siteId, t, pool);
  const replaceable = blocking.filter((b) => b.kind === "duplicate").map((b) => ({ id: b.otherId, name: b.otherName }));
  return { templateId: t.id, name: t.name, type: t.type, status: t.status, firstPublish: !everPublished && t.status !== "published", everPublished,
    conditions: cond, summary: summary(ctx, siteId, cond), blocking, warnings, overlaps, impact, replaceable,
    canPublish: blocking.length === 0, needsChoice: blocking.length > 0 || warnings.length > 0 };
}

// ── « Ce modèle s'applique-t-il à cette adresse ? » ──────────────────────────────────────────────────────────────────────────────────────
// visitor : { loggedIn, role } pour tester les conditions « visiteur connecté / rôle » ; absent = visiteur non précisé (ces conditions ne correspondent pas).
function appliesToUrl(ctx, siteId, id, url, { visitor = null, conditions = null } = {}) {
  const t = store.get(ctx, siteId, id);
  const cond = conditions === null || conditions === undefined ? t.conditions : Cond.normalize(conditions, t.type);
  const r = U.fromUrl(ctx, siteId, url, { visitor });
  if (!r.ok) return { ok: false, error: r.error };
  const pool = store.list(ctx, siteId).filter((o) => o.status === "published" && o.type === t.type && o.id !== t.id);
  const me = { ...t, conditions: cond, status: "published" };
  const res = Res.resolve([...pool, me], r.context, { type: t.type });
  const mine = res.explain.find((e) => e.id === t.id);
  const applies = Boolean(res.winner && res.winner.id === t.id);
  const ev = Res.evaluate(me, r.context);
  return { ok: true, url: U.clean(url), pageLabel: r.label, note: r.note || "", view: r.context.view, applies, wouldMatch: ev.applies, status: t.status,
    winner: res.winner ? { id: res.winner.id, name: res.winner.name } : null, reason: mine ? mine.reason : "", live: t.status === "published",
    message: applies ? (t.status === "published" ? "Oui : ce pied s'affiche sur cette adresse." : "Oui, une fois publié : ce pied s'affichera sur cette adresse.")
      : ev.applies && res.winner ? `Non : ${q(res.winner.name)} est plus prioritaire sur cette adresse.` : `Non : ${mine ? mine.reason : "les conditions ne correspondent pas."}` };
}

// ── Sélecteurs de cibles (liste avec recherche) ──────────────────────────────────────────────────────────────────────────────────────────
const TARGETS = Object.freeze(["page", "category", "tag", "author", "product_category", "product_tag", "course", "role"]);
const ROLES = [{ value: "etudiant", label: "Étudiant (compte de la plateforme)" }, { value: "formateur", label: "Formateur (compte de la plateforme)" }, { value: "client", label: "Client de la boutique" }];
const norm = (s) => String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
function targets(ctx, siteId, kind, query = "") {
  store.site(ctx, siteId);
  if (!TARGETS.includes(kind)) throw Object.assign(new Error("Type de cible inconnu."), { code: "invalid_field" });
  const needle = norm(String(query).slice(0, 60)), db = ctx.db, out = [];
  const take = (rows) => { for (const r of rows) { if (!needle || norm(r.label).includes(needle)) out.push(r); if (out.length >= 30) break; } };
  const siteTerm = siteId === null ? "NOT IN (SELECT content_id FROM mk_content_sites WHERE content_type = 'term')" : "IN (SELECT content_id FROM mk_content_sites WHERE content_type = 'term' AND site_id = ?)";
  const sitePost = siteId === null ? "NOT IN (SELECT content_id FROM mk_content_sites WHERE content_type = 'post')" : "IN (SELECT content_id FROM mk_content_sites WHERE content_type = 'post' AND site_id = ?)";
  const args = siteId === null ? [] : [siteId];
  try {
    if (kind === "page") take(P().sitePages(ctx, siteId).filter((p) => p.kind === "page").map((p) => ({ value: p.id, label: p.name, hint: p.status === "published" ? "" : "brouillon" })));
    else if (kind === "category" || kind === "tag") {
      take(db.prepare(`SELECT DISTINCT name FROM taxonomy_terms WHERE taxonomy = ? AND id ${siteTerm} ORDER BY name COLLATE NOCASE LIMIT 300`).all(kind, ...args).map((r) => ({ value: r.name, label: r.name })));
      if (kind === "category") { const seen = new Set(out.map((o) => norm(o.value))); take(db.prepare(`SELECT DISTINCT category c FROM posts WHERE category IS NOT NULL AND category != '' AND deleted_at IS NULL AND id ${sitePost} ORDER BY 1 LIMIT 300`).all(...args).filter((r) => !seen.has(norm(r.c))).map((r) => ({ value: r.c, label: r.c }))); }
    } else if (kind === "author") take(db.prepare(`SELECT DISTINCT u.id, u.username FROM posts p JOIN users u ON u.id = p.author_id WHERE p.deleted_at IS NULL AND p.id ${sitePost} ORDER BY u.username COLLATE NOCASE LIMIT 300`).all(...args).map((r) => ({ value: r.id, label: r.username })));
    else if (kind === "product_category") take(db.prepare("SELECT DISTINCT name FROM mk_shop_categories WHERE organization_id = ? AND site_id IS ? ORDER BY name COLLATE NOCASE LIMIT 300").all(ctx.organizationId, siteId).map((r) => ({ value: r.name, label: r.name })));
    else if (kind === "product_tag") {
      const set = new Set();
      for (const r of db.prepare("SELECT tags FROM mk_shop_products WHERE organization_id = ? AND site_id IS ? AND deleted_at IS NULL LIMIT 500").all(ctx.organizationId, siteId)) { try { for (const x of JSON.parse(r.tags)) set.add(String(x)); } catch { /* étiquettes illisibles */ } }
      take([...set].sort((a, b) => a.localeCompare(b, "fr")).map((x) => ({ value: x, label: x })));
    } else if (kind === "course") {
      if (siteId === null) take(db.prepare("SELECT id, title FROM courses WHERE published = 1 AND archived = 0 ORDER BY title COLLATE NOCASE LIMIT 300").all().map((r) => ({ value: r.id, label: r.title })));
    } else if (kind === "role") take(ROLES);
  } catch { /* module absent : liste vide */ }
  return out;
}
module.exports = { summary, plan, appliesToUrl, targets, TARGETS, ROLES };
