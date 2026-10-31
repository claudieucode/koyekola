// Advanced Content Intelligence & SEO Quality Engine (programme 22.6) — point d'entrée. Voir docs/KOLAKISA_ADVANCED_CONTENT_INTELLIGENCE.md.
// S'appuie sur l'existant : voix (contentGen.voice), anti-invention (contentGen.facts), SEO (src/seo + contentGen.seo), régénération et versions (src/regen), pages natives (marketing/pages).
// Aucun contenu parallèle : on LIT les sections natives et on PROPOSE ; toute écriture passe par pages.saveDraft (brouillon) ou par regen (avant/après, annulable).
// Toutes les lectures sont filtrées par site ET organisation ; le site vient de l'appelant (adresse vérifiée), jamais d'un champ libre.
const crypto = require("node:crypto");
const store = require("./store");
const textLib = require("./text");
const quality = require("./quality");
const intentLib = require("./intent");
const kindsLib = require("./kinds");
const linking = require("./linking");
const i18n = require("./i18n");
const providers = require("./providers");
const technical = require("./technical");
const presets = require("./presets");
const pages = require("../marketing/pages");
const contentGen = require("../contentGen");
const localize = require("../contentGen/localize");
const factsLib = require("../contentGen/facts");

const bad = (m, code = "invalid") => Object.assign(new Error(m), { code, name: "MarketingError" });
const MAX_PAGES = 200, MAX_SIBLINGS = 60;
const now = (ctx) => new Date(ctx.now ? ctx.now() : Date.now()).toISOString();
const sha = (s) => crypto.createHash("sha1").update(String(s)).digest("hex").slice(0, 16);

// Garde commune : site de l'organisation, dans la portée du membre (siteScope), non supprimé ; en écriture, site actif. Appelée par la route AVANT tout service.
function siteOf(ctx, siteId, { write = false } = {}) {
  store.ensureSchema(ctx.db);
  if (!Number.isInteger(siteId) || siteId < 1 || (ctx.siteScope !== undefined && ctx.siteScope !== null && ctx.siteScope !== siteId)) throw bad("Site introuvable.", "not_found");
  const s = ctx.db.prepare("SELECT id, name, home_page_id, status, deleted_at FROM mk_sites WHERE id = ? AND organization_id = ?").get(siteId, ctx.organizationId);
  if (!s || s.deleted_at) throw bad("Site introuvable.", "not_found");
  if (write && s.status !== "active") throw bad("Ce site est archivé : restaurez-le avant de le modifier.");
  return s;
}
const getSetting = (ctx, siteId, key, fb) => { const r = ctx.db.prepare("SELECT value FROM mk_ci_settings WHERE site_id = ? AND organization_id = ? AND key = ?").get(siteId, ctx.organizationId, key); return r ? store.json(r.value, fb) : fb; };
function setSetting(ctx, siteId, key, value) {
  ctx.db.prepare("INSERT INTO mk_ci_settings (site_id, organization_id, key, value, updated_by, updated_at) VALUES (?,?,?,?,?,?) ON CONFLICT(site_id, key) DO UPDATE SET value = excluded.value, updated_by = excluded.updated_by, updated_at = excluded.updated_at")
    .run(siteId, ctx.organizationId, key, JSON.stringify(value), ctx.userId || null, now(ctx));
}
// Faits fournis par la personne (nom, ville…) : la SEULE source de ce que l'analyse tient pour vérifié
function getFacts(ctx, siteId) { const s = siteOf(ctx, siteId); return { company_name: s.name, ...getSetting(ctx, siteId, "facts", {}) }; }
function setFacts(ctx, siteId, facts) {
  siteOf(ctx, siteId);
  if (!facts || typeof facts !== "object" || Array.isArray(facts)) throw bad("Faits : un objet clé/valeur est attendu.");
  const out = {};
  for (const [k, v] of Object.entries(facts).slice(0, 60)) { const key = String(k).toLowerCase().replace(/[^a-z0-9_]/g, "_").slice(0, 40), val = factsLib.clean(String(v ?? ""), 600); if (key && val) out[key] = val; }
  setSetting(ctx, siteId, "facts", out);
  return { facts: out };
}
// Marché du site : langue(s) de contenu, pays, région. Aucune présomption (devise, moyens de paiement, obligations légales) : voir contentGen/localize.
function getMarket(ctx, siteId) { siteOf(ctx, siteId); return getSetting(ctx, siteId, "market", { language: "fr", country: "", languages: ["fr"] }); }
function setMarket(ctx, siteId, input = {}) {
  siteOf(ctx, siteId);
  const language = String(input.language || "fr").toLowerCase(), country = String(input.country || "").toUpperCase();
  if (!/^[a-z]{2}$/.test(language)) throw bad("Langue : deux lettres.");
  if (country && !/^[A-Z]{2}$/.test(country)) throw bad("Pays : code à deux lettres.");
  const languages = [...new Set([language, ...(Array.isArray(input.languages) ? input.languages : []).map((l) => String(l).toLowerCase()).filter((l) => /^[a-z]{2}$/.test(l))])].slice(0, 12);
  const m = { language, country, languages };
  setSetting(ctx, siteId, "market", m);
  return { ...m, localization: localize.COUNTRIES[country] ? { ...localize.COUNTRIES[country], languageLevel: (localize.LANGUAGES[language] || {}).level || "unknown" } : null, notice: "Adapter un contenu à un marché demande un texte propre à ce marché ; changer un nom de pays ou de ville ne suffit pas." };
}
function setPageKind(ctx, siteId, pageId, kind) {
  siteOf(ctx, siteId);
  if (!ctx.db.prepare("SELECT 1 FROM mk_landing_pages WHERE id = ? AND site_id = ? AND organization_id = ?").get(pageId, siteId, ctx.organizationId)) throw bad("Page introuvable dans ce site.", "not_found");
  if (kind !== null && !kindsLib.KINDS[kind]) throw bad("Genre de page inconnu.");
  const all = getSetting(ctx, siteId, "page_kinds", {});
  if (kind === null) delete all[pageId]; else all[pageId] = kind;
  setSetting(ctx, siteId, "page_kinds", all);
  return { pageId, kind };
}

function siblingsOf(ctx, siteId, exceptId) {
  const rows = ctx.db.prepare("SELECT id, name FROM mk_landing_pages WHERE site_id = ? AND organization_id = ? AND id != ? AND archived_at IS NULL ORDER BY id LIMIT ?").all(siteId, ctx.organizationId, exceptId, MAX_SIBLINGS);
  return rows.map((r) => ({ id: r.id, name: r.name, text: textLib.fromSections((pages.requirePage(ctx, r.id) || {}).working || {}).text }));
}
function context(ctx, siteId) {
  const site = siteOf(ctx, siteId);
  return { site, voice: contentGen.getVoice(ctx, siteId), facts: getFacts(ctx, siteId), market: getMarket(ctx, siteId), kinds: getSetting(ctx, siteId, "page_kinds", {}) };
}
// Évaluation d'une page du site. Résultat mis en cache tant que le contenu, la voix, les faits, le mot-clé et les autres pages ne changent pas (aucune analyse répétée inutile).
function evaluatePage(ctx, siteId, pageId, { force = false, shared = null } = {}) {
  const c = shared || context(ctx, siteId);
  const page = Number.isInteger(pageId) ? pages.getPage(ctx, pageId) : null;
  if (!page || page.site_id !== siteId) throw bad("Page introuvable dans ce site.", "not_found");
  const doc = textLib.fromSections(page.working || {});
  const primary = providers.list(ctx, siteId, { pageId }).find((k) => k.role === "primary");
  const keyword = (primary && primary.keyword) || doc.seo.focusKeyword || "";
  const detected = kindsLib.detect({ name: page.name, slug: page.slug, kind: page.kind, types: doc.types, explicit: c.kinds[pageId] || null, isHome: c.site.home_page_id === pageId });
  const sibs = siblingsOf(ctx, siteId, pageId);
  const fp = textLib.fingerprint(doc, JSON.stringify([c.voice, c.facts, c.market, keyword, detected.kind, page.slug, page.status, sha(sibs.map((s) => s.text).join("|"))]));
  if (!force) { const hit = ctx.db.prepare("SELECT fp, result, evaluated_at FROM mk_ci_evals WHERE site_id = ? AND organization_id = ? AND page_id = ?").get(siteId, ctx.organizationId, pageId); if (hit && hit.fp === fp) return { ...store.json(hit.result, {}), cached: true, evaluatedAt: hit.evaluated_at }; }
  const q = quality.evaluate(doc, { kind: detected.kind, keyword, voice: c.voice, facts: c.facts, language: c.market.language, siblings: sibs, brand: c.site.name, audience: c.facts.audience || "", slug: page.slug });
  const tech = technical.check(doc, { page: { slug: page.slug, status: page.status, indexable: page.indexable }, siteNoindex: false });
  const intent = intentLib.analyze(keyword, { kind: detected.kind, city: c.facts.city, brand: c.site.name });
  const result = { pageId, name: page.name, status: page.status, kind: detected.kind, kindBasis: detected.basis, keyword: keyword || null, intent, quality: q, technical: tech, fingerprint: fp };
  ctx.db.prepare("INSERT INTO mk_ci_evals (site_id, organization_id, page_id, fp, result, evaluated_at) VALUES (?,?,?,?,?,?) ON CONFLICT(site_id, page_id) DO UPDATE SET fp = excluded.fp, result = excluded.result, evaluated_at = excluded.evaluated_at")
    .run(siteId, ctx.organizationId, pageId, fp, JSON.stringify(result), now(ctx));
  return { ...result, cached: false, evaluatedAt: now(ctx) };
}
// Texte hors page (article du Blog Studio, sélection dans l'éditeur) : même évaluateur, sans enregistrement
function evaluateText(ctx, siteId, { kind = "article", title = "", body = "", keyword = "", seo = {} } = {}) {
  const c = context(ctx, siteId);
  if (!kindsLib.KINDS[kind]) throw bad("Genre de contenu inconnu.");
  const doc = textLib.fromText({ title, body, seo: { ...seo, focusKeyword: keyword || seo.focusKeyword } });
  return { kind, keyword: keyword || null, intent: intentLib.analyze(keyword, { kind, city: c.facts.city, brand: c.site.name }), quality: quality.evaluate(doc, { kind, keyword, voice: c.voice, facts: c.facts, language: c.market.language, brand: c.site.name, audience: c.facts.audience || "" }) };
}
// Tableau de bord : AUCUNE métrique de trafic, de position ou de clic (aucune source connectée à ce niveau). Tout est calculé sur le contenu réel.
function dashboard(ctx, siteId) {
  const c = context(ctx, siteId);
  const rows = ctx.db.prepare("SELECT id FROM mk_landing_pages WHERE site_id = ? AND organization_id = ? AND archived_at IS NULL ORDER BY id LIMIT ?").all(siteId, ctx.organizationId, MAX_PAGES);
  const evals = rows.map((r) => evaluatePage(ctx, siteId, r.id, { shared: c }));
  const link = linking.analyze(ctx, siteId);
  const hasIssue = (e, id) => e.quality.issues.some((i) => i.id === id || i.id.startsWith(id));
  const pageLine = (e) => ({ pageId: e.pageId, name: e.name, status: e.status, kind: e.kind, score: e.quality.global, evaluated: `${e.quality.evaluable}/${e.quality.total}`, blocking: e.quality.blocking, issues: e.quality.issues.length, cached: e.cached });
  const scored = evals.filter((e) => e.quality.global !== null);
  const cons = (code) => evals.filter((e) => hasIssue(e, code)).map(pageLine);
  const overview = {
    analyzed: evals.length, optimized: scored.filter((e) => e.quality.global >= 80 && e.quality.blocking === 0).length, toImprove: evals.filter((e) => e.quality.blocking > 0 || (e.quality.global !== null && e.quality.global < 80)).length,
    withoutMetadata: evals.filter((e) => hasIssue(e, "seo_title_missing") || hasIssue(e, "seo_desc_missing")).length, withTechnicalIssues: evals.filter((e) => e.technical.issues.some((i) => i.severity !== "info")).length,
    withoutRelevantLinks: link.pages.filter((p) => p.status === "published" && p.outbound === 0).length, orphans: link.orphans.length, incomplete: evals.filter((e) => hasIssue(e, "placeholders_left") || hasIssue(e, "filler_text")).length,
    averageScore: scored.length ? Math.round(scored.reduce((n, e) => n + e.quality.global, 0) / scored.length) : null,
  };
  const editorial = {
    toneConsistency: cons("address_mismatch"), writingFillers: cons("filler_phrases"), repetitions: cons("repeated_words"), nearDuplicates: cons("near_duplicate"), missingInfo: cons("placeholders_left"), unverifiedClaims: evals.filter((e) => e.quality.issues.some((i) => i.id.startsWith("unverified_claim"))).map(pageLine),
    generic: evals.filter((e) => e.quality.issues.some((i) => i.id === "filler_phrases" || i.id === "cta_generic")).map(pageLine),
  };
  return { siteId, overview, pages: evals.map(pageLine), editorial, links: { orphans: link.orphans, genericAnchors: link.generic, toUnpublished: link.toUnpublished, limits: link.limits },
    traffic: { available: false, note: "Aucune métrique de trafic, de position ni de clic n'est affichée : elles exigent une source connectée (voir Connexions). Rien n'est estimé." },
    disclaimer: quality.DISCLAIMER, truncated: rows.length >= MAX_PAGES };
}
// Intégration au constructeur de sites : après génération, vérification d'ensemble + éléments à compléter (rien n'est modifié)
function review(ctx, siteId) {
  const c = context(ctx, siteId), d = dashboard(ctx, siteId);
  const toComplete = [];
  for (const p of d.pages) {
    const e = evaluatePage(ctx, siteId, p.pageId, { shared: c });
    for (const i of e.quality.issues.filter((x) => x.id === "placeholders_left" || x.id === "filler_text")) toComplete.push({ pageId: p.pageId, page: p.name, what: i.explanation, matches: i.matches || [] });
    if (!e.keyword) toComplete.push({ pageId: p.pageId, page: p.name, what: "Mot-clé principal non défini : l'intention de recherche ne peut pas être estimée.", matches: [] });
    const k = kindsLib.KINDS[e.kind];
    if (k) for (const f of k.facts.filter((f) => !c.facts[f])) toComplete.push({ pageId: p.pageId, page: p.name, what: factsLib.QUESTIONS[f] || `Information « ${f} » à fournir.`, matches: [] });
  }
  return { dashboard: d, toComplete, groups: i18n.groups(ctx, siteId).map((g) => ({ ...g, validation: i18n.validate(g) })) };
}
function plan(ctx, siteId, { kind, keyword = "" }) {
  const c = context(ctx, siteId);
  if (!kindsLib.KINDS[kind]) throw bad("Genre de page inconnu.");
  const intent = intentLib.analyze(keyword, { kind, city: c.facts.city, brand: c.site.name });
  return { ...kindsLib.plan(kind, { facts: c.facts, intent }), intent, voice: contentGen.voice.toPrompt(c.voice, c.market.language) };
}
// Assistant d'optimisation : transforme l'action choisie en demande au moteur de régénération (proposition avant/après, jamais appliquée seule)
async function optimize(ctx, siteId, { action, extra = "", pageId, fieldKey = null, sectionId = null, can = () => true, call }) {
  const req = presets.request(action, extra);
  if (!req) throw bad("Action inconnue.");
  siteOf(ctx, siteId);
  const R = require("../regen");
  const c = context(ctx, siteId);
  const selection = { pageId, ...(fieldKey ? { fieldKey } : {}), ...(sectionId ? { sectionId } : {}) };
  return R.propose(ctx, siteId, { text: req.text, selection, context: { facts: { company_name: c.site.name, ...c.facts }, language: c.market.language, country: c.market.country }, can, ...(call ? { call } : {}) });
}
module.exports = { guard: siteOf, context, getFacts, setFacts, getMarket, setMarket, setPageKind, evaluatePage, evaluateText, dashboard, review, plan, optimize, intent: intentLib, kinds: kindsLib, quality, linking, i18n, providers, technical, presets, readability: require("./readability"), text: textLib };
