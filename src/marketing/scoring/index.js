// Score des contacts (phase 13). Une règle donne (ou retire) des points quand un VRAI événement du bus survient pour un
// contact : page visitée, clic dans un e-mail, formulaire envoyé, ajout au panier, achat… éventuellement filtré (une
// page, une formation précise) et plafonné (au plus N fois par contact). Chaque attribution est tracée (journal) ;
// le score ne descend jamais sous 0. Les niveaux (froid, intéressé, chaud, très chaud par défaut) se modifient ; un
// changement de niveau émet « contact.score_level_changed », qui peut déclencher une automatisation.
// Les règles s'appliquent aux événements à venir ; « Recalculer » rejoue l'historique des événements déjà reçus.
const { MarketingError } = require("../errors");
const { checkCtx, audit, emit } = require("../audience/shared");
const { transaction } = require("../db/tx");
const { TRIGGERS } = require("../automations/catalog");
const siteModules = require("../siteModules");
const siteAccess = require("../contactcore/siteAccess");
const { validSite } = require("../audit");

// R7 lot 6.4 — par site : les règles, les niveaux et le score STOCKÉ du contact sont des données d'organisation (équipe seulement) ; le calcul est inchangé et chaque ligne du journal porte le site de l'événement.
// Un accès limité à un site ne voit que le « score du site » : la somme des lignes de SON site, pour les seuls contacts que son site peut lire (jamais le score de l'organisation, ni les règles).
const limited = (ctx) => ctx.siteScope !== undefined && ctx.siteScope !== null;
const teamOnly = (ctx, what = "Cette opération") => { if (limited(ctx)) throw new MarketingError("forbidden", `${what} est réservée à l'équipe de l'organisation.`); };
const SITE_SCORE = "MAX(0, COALESCE((SELECT SUM(l.points) FROM mk_score_log l WHERE l.contact_id = c.id AND l.organization_id = c.organization_id AND l.site_id = ?), 0))";

const LEVEL_EVENT = "contact.score_level_changed";
const DEFAULT_LEVELS = [["Froid", 0], ["Intéressé", 21], ["Chaud", 51], ["Très chaud", 101]];
// Règles proposées (créées à la demande, jamais d'office) : valeurs de départ, toutes modifiables
const SUGGESTED = [
  ["page.visited", 5, null], ["email.clicked", 10, null], ["form.submitted", 20, null], ["lms.course_viewed", 5, 10],
  ["lms.cart_added", 25, null], ["lms.checkout_started", 40, null], ["funnel.completed", 30, null], ["lms.order_completed", 100, null],
  ["lms.course_progress_50", 15, null],
];
const bad = (m) => new MarketingError("invalid_field", m);

// Événements utilisables : tous les événements réels propres à UN contact (catalogue des webhooks : désinscription,
// adresse bloquée… pour retirer des points), avec les filtres des déclencheurs ; jamais le changement de niveau lui-même
// (boucle) ni les événements sans contact (import terminé, campagne terminée)
function ruleEvents() {
  const { EVENTS } = require("../webhooks/catalog");
  const out = {};
  for (const [k, label] of Object.entries(EVENTS)) {
    if (k === LEVEL_EVENT || k === "contacts.imported" || k === "campaign.sent") continue;
    out[k] = { label: TRIGGERS[k] ? TRIGGERS[k].label : label, filters: TRIGGERS[k] ? TRIGGERS[k].filters : [] };
  }
  return out;
}

// ---------- Niveaux ----------
function levels(ctx) {
  checkCtx(ctx);
  if (limited(ctx) && !ctx.db.prepare("SELECT 1 FROM mk_score_levels WHERE organization_id = ?").get(ctx.organizationId)) return DEFAULT_LEVELS.map(([name, min], i) => ({ id: -(i + 1), name, min_score: min })); // lecture seule : un site n'écrit jamais
  let rows = ctx.db.prepare("SELECT id, name, min_score FROM mk_score_levels WHERE organization_id = ? ORDER BY min_score").all(ctx.organizationId);
  if (!rows.length) {
    const ins = ctx.db.prepare("INSERT OR IGNORE INTO mk_score_levels (organization_id, name, min_score) VALUES (?, ?, ?)");
    for (const [name, min] of DEFAULT_LEVELS) ins.run(ctx.organizationId, name, min);
    rows = ctx.db.prepare("SELECT id, name, min_score FROM mk_score_levels WHERE organization_id = ? ORDER BY min_score").all(ctx.organizationId);
  }
  return rows;
}
const levelOf = (list, score) => list.filter((l) => score >= l.min_score).pop() || list[0];
// Remplacer les niveaux : [{ id?, name, min }] ; le premier commence à 0, seuils croissants et distincts
function saveLevels(ctx, input) {
  teamOnly(ctx, "La modification des niveaux");

  const current = levels(ctx);
  const list = (Array.isArray(input) ? input : []).map((l) => ({ id: Number(l.id) || null, name: String(l.name || "").replace(/\s+/g, " ").trim().slice(0, 40), min: Number(l.min) }))
    .filter((l) => l.name);
  if (list.length < 2 || list.length > 8) throw bad("Entre 2 et 8 niveaux.");
  if (list[0].min !== 0) throw bad("Le premier niveau commence à 0.");
  for (let i = 0; i < list.length; i++) {
    if (!Number.isInteger(list[i].min) || list[i].min < 0 || list[i].min > 100000) throw bad(`Niveau « ${list[i].name} » : seuil invalide.`);
    if (i && list[i].min <= list[i - 1].min) throw bad("Les seuils doivent être croissants.");
  }
  if (new Set(list.map((l) => l.name.toLowerCase())).size !== list.length) throw bad("Deux niveaux portent le même nom.");
  transaction(ctx.db, () => {
    const keep = new Set();
    // Seuils temporaires négatifs interdits par la contrainte : on décale d'abord les seuils existants très haut
    ctx.db.prepare("UPDATE mk_score_levels SET min_score = min_score + 1000000 WHERE organization_id = ?").run(ctx.organizationId);
    for (const l of list) {
      const existing = l.id && current.find((c) => c.id === l.id);
      if (existing) { ctx.db.prepare("UPDATE mk_score_levels SET name = ?, min_score = ? WHERE id = ?").run(l.name, l.min, l.id); keep.add(l.id); }
      else keep.add(Number(ctx.db.prepare("INSERT INTO mk_score_levels (organization_id, name, min_score) VALUES (?, ?, ?)").run(ctx.organizationId, l.name, l.min).lastInsertRowid));
    }
    for (const c of current) if (!keep.has(c.id)) ctx.db.prepare("DELETE FROM mk_score_levels WHERE id = ?").run(c.id);
  });
  audit(ctx, "scoring.levels_updated", "organization", ctx.organizationId, {});
  return levels(ctx);
}

// ---------- Règles ----------
function listRules(ctx) {
  checkCtx(ctx);
  teamOnly(ctx, "La lecture des règles de score");

  return ctx.db.prepare(`SELECT r.*, (SELECT COUNT(*) FROM mk_score_log l WHERE l.rule_id = r.id) AS applied,
      (SELECT COUNT(DISTINCT l.contact_id) FROM mk_score_log l WHERE l.rule_id = r.id) AS contacts
    FROM mk_score_rules r WHERE r.organization_id = ? ORDER BY r.event, r.id`).all(ctx.organizationId);
}
function normalizeRule(input) {
  const events = ruleEvents();
  const event = String(input.event || "");
  if (!Object.hasOwn(events, event)) throw bad("Choisissez un événement de la liste.");
  const points = Number(input.points);
  if (!Number.isInteger(points) || points === 0 || points < -1000 || points > 1000) throw bad("Points : un nombre entier entre -1000 et 1000, différent de 0.");
  const maxTimes = input.maxTimes === "" || input.maxTimes === null || input.maxTimes === undefined ? null : Number(input.maxTimes);
  if (maxTimes !== null && (!Number.isInteger(maxTimes) || maxTimes < 1 || maxTimes > 1000)) throw bad("Limite : vide (sans limite) ou un nombre entre 1 et 1000.");
  const filter = events[event].filters[0];
  const value = String(input.filterValue || "").trim().slice(0, 100);
  return { event, points, maxTimes, filterKey: filter && value ? filter[0] : "", filterValue: filter && value ? value : "", active: input.active === false ? 0 : 1 };
}
function createRule(ctx, input = {}) {
  checkCtx(ctx);
  teamOnly(ctx, "La création d'une règle de score");

  const r = normalizeRule(input);
  if (ctx.db.prepare("SELECT COUNT(*) n FROM mk_score_rules WHERE organization_id = ?").get(ctx.organizationId).n >= 100) throw bad("100 règles au plus.");
  const id = Number(ctx.db.prepare("INSERT INTO mk_score_rules (organization_id, event, filter_key, filter_value, points, max_times, active, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)")
    .run(ctx.organizationId, r.event, r.filterKey, r.filterValue, r.points, r.maxTimes, r.active, ctx.userId ?? null).lastInsertRowid);
  audit(ctx, "scoring.rule_created", "organization", ctx.organizationId, { rule: id });
  return id;
}
function updateRule(ctx, id, input = {}) {
  checkCtx(ctx);
  teamOnly(ctx, "La modification d'une règle de score");

  const rule = ctx.db.prepare("SELECT * FROM mk_score_rules WHERE id = ? AND organization_id = ?").get(Number(id), ctx.organizationId);
  if (!rule) throw new MarketingError("not_found", "Règle introuvable.");
  const r = normalizeRule({ event: rule.event, filterValue: rule.filter_value, points: rule.points, maxTimes: rule.max_times, active: Boolean(rule.active), ...input });
  ctx.db.prepare("UPDATE mk_score_rules SET event = ?, filter_key = ?, filter_value = ?, points = ?, max_times = ?, active = ?, updated_at = datetime('now') WHERE id = ?")
    .run(r.event, r.filterKey, r.filterValue, r.points, r.maxTimes, r.active, rule.id);
}
function deleteRule(ctx, id) {
  checkCtx(ctx);
  teamOnly(ctx, "La suppression d'une règle de score");

  const changed = ctx.db.prepare("DELETE FROM mk_score_rules WHERE id = ? AND organization_id = ?").run(Number(id), ctx.organizationId).changes;
  if (!changed) throw new MarketingError("not_found", "Règle introuvable.");
}
function addSuggested(ctx) {
  checkCtx(ctx);
  teamOnly(ctx, "L'ajout des règles proposées");

  const existing = new Set(listRules(ctx).map((r) => `${r.event}|${r.filter_value}`));
  let n = 0;
  for (const [event, points, maxTimes] of SUGGESTED) {
    if (!ruleEvents()[event] || existing.has(`${event}|`)) continue;
    createRule(ctx, { event, points, maxTimes });
    n += 1;
  }
  return n;
}

// ---------- Application ----------
// Applique les règles à un événement. silent : pas d'événement de changement de niveau (recalcul de l'historique).
function applyEvent(ctx, event, { silent = false } = {}) {
  if (!event || !Number.isInteger(event.contactId) || event.name === LEVEL_EVENT) return 0;
  const rules = ctx.db.prepare("SELECT * FROM mk_score_rules WHERE organization_id = ? AND event = ? AND active = 1").all(ctx.organizationId, event.name);
  if (!rules.length) return 0;
  const contact = ctx.db.prepare("SELECT id, email, score FROM mk_contacts WHERE id = ? AND organization_id = ?").get(event.contactId, ctx.organizationId);
  if (!contact) return 0;
  const md = event.metadata || {};
  let delta = 0;
  for (const r of rules) {
    if (!require("../automations/catalog").filterMatches(md, { key: r.filter_key, value: r.filter_value })) continue;
    if (r.max_times !== null && ctx.db.prepare("SELECT COUNT(*) n FROM mk_score_log WHERE rule_id = ? AND contact_id = ?").get(r.id, contact.id).n >= r.max_times) continue;
    const ins = ctx.db.prepare("INSERT OR IGNORE INTO mk_score_log (organization_id, contact_id, rule_id, event_id, event, points, created_at, site_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)")
      .run(ctx.organizationId, contact.id, r.id, event.id, event.name, r.points, event.occurredAt || Date.now(), validSite(ctx.db, ctx.organizationId, event.siteId)); // site de l'ÉVÉNEMENT (écrit par le serveur), jamais une valeur de requête
    if (ins.changes) delta += r.points;
  }
  if (!delta) return 0;
  const next = Math.max(0, contact.score + delta);
  ctx.db.prepare("UPDATE mk_contacts SET score = ? WHERE id = ?").run(next, contact.id);
  if (!silent) {
    const lv = levels(ctx);
    const before = levelOf(lv, contact.score), after = levelOf(lv, next);
    if (before.id !== after.id) {
      emit(ctx, LEVEL_EVENT, { contact, source: "marketing", idempotencyKey: `score_level:${contact.id}:${event.id}`,
        metadata: { levelId: String(after.id), level: after.name, previousLevel: before.name, score: next, direction: after.min_score > before.min_score ? "up" : "down" } });
    }
  }
  return delta;
}
// Ajustement par un SCÉNARIO (action « Modifier le score ») : « add » / « subtract » (points) ou « set » (nouveau score).
// Le score reste borné à 0 ; la différence réellement appliquée est journalisée (source « automation ») : elle survit à un recalcul
// des règles. `key` identifie le passage et l'étape : rejouer la même étape ne change rien. Aucun événement de changement de
// niveau n'est émis (les actions d'un scénario n'en émettent jamais : pas de scénarios qui se déclenchent en boucle).
const MAX_ADJUST = 100000;
function adjustScore(ctx, contactId, { mode, points, key, siteId } = {}) {
  checkCtx(ctx);
  if (!["add", "subtract", "set"].includes(mode)) throw bad("Mode de score invalide (ajouter, retirer, définir).");
  if (!Number.isInteger(points) || points < 0 || points > MAX_ADJUST || (mode !== "set" && points < 1)) throw bad(`Points invalides (un entier de ${mode === "set" ? 0 : 1} à ${MAX_ADJUST}).`);
  if (!Number.isInteger(key) || key < 1) throw bad("Référence d'étape invalide.");
  return transaction(ctx.db, () => {
    const c = ctx.db.prepare("SELECT id, score FROM mk_contacts WHERE id = ? AND organization_id = ?").get(contactId, ctx.organizationId);
    if (!c) throw bad("Contact introuvable.");
    const next = mode === "add" ? c.score + points : mode === "subtract" ? Math.max(0, c.score - points) : points;
    const delta = next - c.score;
    const ins = ctx.db.prepare("INSERT OR IGNORE INTO mk_score_log (organization_id, contact_id, rule_id, event_id, event, points, created_at, source, site_id) VALUES (?, ?, NULL, ?, 'automation.score', ?, ?, 'automation', ?)")
      .run(ctx.organizationId, c.id, key, delta, ctx.now ? ctx.now() : Date.now(), validSite(ctx.db, ctx.organizationId, siteId)); // siteId = site du scénario (relu en base par l'appelant)
    if (!ins.changes) return { applied: false, delta: 0, score: c.score }; // étape déjà exécutée
    if (delta) ctx.db.prepare("UPDATE mk_contacts SET score = ? WHERE id = ?").run(next, c.id);
    return { applied: true, delta, score: next };
  });
}

// Recalcul complet à partir des événements reçus (les règles actuelles appliquées à tout l'historique)
function recompute(ctx) {
  checkCtx(ctx);
  teamOnly(ctx, "Le recalcul des scores");

  return transaction(ctx.db, () => {
    ctx.db.prepare("DELETE FROM mk_score_log WHERE organization_id = ? AND source = 'rule'").run(ctx.organizationId);
    ctx.db.prepare("UPDATE mk_contacts SET score = 0 WHERE organization_id = ? AND score <> 0").run(ctx.organizationId);
    const names = [...new Set(ctx.db.prepare("SELECT event FROM mk_score_rules WHERE organization_id = ? AND active = 1").all(ctx.organizationId).map((r) => r.event))];
    const keepAdjustments = () => ctx.db.prepare("UPDATE mk_contacts SET score = MAX(0, score + COALESCE((SELECT SUM(points) FROM mk_score_log WHERE contact_id = mk_contacts.id AND source = 'automation'), 0)) WHERE organization_id = ? AND EXISTS (SELECT 1 FROM mk_score_log WHERE contact_id = mk_contacts.id AND source = 'automation')").run(ctx.organizationId);
    if (!names.length) { keepAdjustments(); return { events: 0, contacts: ctx.db.prepare("SELECT COUNT(*) n FROM mk_contacts WHERE organization_id = ? AND score > 0").get(ctx.organizationId).n }; }
    const rows = ctx.db.prepare(`SELECT * FROM mk_events WHERE organization_id = ? AND contact_id IS NOT NULL AND name IN (${names.map(() => "?").join(",")}) ORDER BY id`).all(ctx.organizationId, ...names);
    let n = 0;
    for (const row of rows) {
      const ev = { id: row.id, name: row.name, contactId: row.contact_id, occurredAt: row.occurred_at, siteId: row.site_id ?? null, metadata: JSON.parse(row.metadata || "{}") };
      if (applyEvent(ctx, ev, { silent: true })) n += 1;
    }
    keepAdjustments();
    audit(ctx, "scoring.recomputed", "organization", ctx.organizationId, { events: n });
    return { events: n, contacts: ctx.db.prepare("SELECT COUNT(*) n FROM mk_contacts WHERE organization_id = ? AND score > 0").get(ctx.organizationId).n };
  });
}

// Gestionnaire du bus (toutes organisations) : les points sont attribués quand l'événement est distribué
function eventHandler({ db, bus }) {
  return (event) => { applyEvent({ db, organizationId: event.organizationId, bus, userId: null }, event); };
}

// ---------- Lecture ----------
function overview(ctx) {
  checkCtx(ctx);
  if (limited(ctx)) return siteOverview(ctx);
  const lv = levels(ctx);
  const counts = lv.map((l, i) => {
    const next = lv[i + 1];
    const n = ctx.db.prepare(`SELECT COUNT(*) n FROM mk_contacts WHERE organization_id = ? AND score >= ?${next ? " AND score < ?" : ""}`).get(ctx.organizationId, l.min_score, ...(next ? [next.min_score] : [])).n;
    return { ...l, contacts: n };
  });
  const top = ctx.db.prepare("SELECT id, email, first_name, last_name, score FROM mk_contacts WHERE organization_id = ? AND score > 0 ORDER BY score DESC, id LIMIT 10").all(ctx.organizationId)
    .map((c) => ({ ...c, level: levelOf(lv, c.score).name }));
  return { levels: counts, top };
}
// Accès limité : contacts lisibles par le site, score = somme des lignes de CE site (jamais le score de l'organisation)
function siteOverview(ctx) {
  siteModules.assertEnabled(ctx, "scoring");
  const lv = levels(ctx);
  const rd = siteAccess.readSql(ctx, "c");
  const base = `SELECT c.id, c.email, c.first_name, c.last_name, ${SITE_SCORE} AS score FROM mk_contacts c WHERE c.organization_id = ? AND ${rd.sql}`;
  const args = [ctx.siteScope, ctx.organizationId, ...rd.params];
  const counts = lv.map((l, i) => {
    const next = lv[i + 1];
    const n = ctx.db.prepare(`SELECT COUNT(*) n FROM (${base}) WHERE score >= ?${next ? " AND score < ?" : ""}`).get(...args, l.min_score, ...(next ? [next.min_score] : [])).n;
    return { ...l, contacts: n };
  });
  const top = ctx.db.prepare(`SELECT * FROM (${base}) WHERE score > 0 ORDER BY score DESC, id LIMIT 10`).all(...args).map((c) => ({ ...c, level: levelOf(lv, c.score).name }));
  return { levels: counts, top };
}
function contactScore(ctx, contactId) {
  checkCtx(ctx);
  if (limited(ctx)) {
    // Contact lisible par le site ET module activé pour lui, sinon aucun score n'est montré (la fiche du contact reste ouverte)
    if (!Number.isInteger(ctx.siteScope) || !siteModules.isEnabled(ctx.db, ctx.organizationId, ctx.siteScope, "scoring")) return null;
    const contact = ctx.db.prepare("SELECT id FROM mk_contacts WHERE id = ? AND organization_id = ?").get(contactId, ctx.organizationId);
    if (!siteAccess.canRead(ctx, contact)) return null;
    const total = ctx.db.prepare("SELECT MAX(0, COALESCE(SUM(points), 0)) AS s FROM mk_score_log WHERE contact_id = ? AND organization_id = ? AND site_id = ?").get(contactId, ctx.organizationId, ctx.siteScope).s;
    const lv = levels(ctx);
    const history = ctx.db.prepare("SELECT event, points, created_at, source FROM mk_score_log WHERE contact_id = ? AND organization_id = ? AND site_id = ? ORDER BY created_at DESC, id DESC LIMIT 20").all(contactId, ctx.organizationId, ctx.siteScope);
    return { score: total, level: levelOf(lv, total).name, siteScore: true, history: history.map((h) => ({ ...h, label: h.source === "automation" ? "Scénario d'automatisation" : (ruleEvents()[h.event] || {}).label || h.event })) };
  }
  const c = ctx.db.prepare("SELECT score FROM mk_contacts WHERE id = ? AND organization_id = ?").get(contactId, ctx.organizationId);
  if (!c) return null;
  const lv = levels(ctx);
  const history = ctx.db.prepare("SELECT event, points, created_at, source FROM mk_score_log WHERE contact_id = ? AND organization_id = ? ORDER BY created_at DESC, id DESC LIMIT 20").all(contactId, ctx.organizationId);
  return { score: c.score, level: levelOf(lv, c.score).name, history: history.map((h) => ({ ...h, label: h.source === "automation" ? "Scénario d'automatisation" : (ruleEvents()[h.event] || {}).label || h.event })) };
}

module.exports = { LEVEL_EVENT, DEFAULT_LEVELS, SUGGESTED, ruleEvents, levels, levelOf, saveLevels, listRules, createRule, updateRule, deleteRule, addSuggested, applyEvent, adjustScore, MAX_ADJUST, recompute, eventHandler, overview, contactScore };
