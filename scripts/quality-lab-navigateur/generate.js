// Programme 22.1 — Laboratoire : génère les sites de référence avec les VRAIS moteurs (21.3 à 21.7, système natif de pages), fournisseur d'IA SIMULÉ.
// Aucun appel réseau, aucun coût. Retourne, par scénario, les identifiants, les durées et les observations du générateur.
const pages = require("../../src/marketing/pages");
const plans = require("../../src/marketing/ai/builder/plans");
const ws = require("../../src/marketing/ai/builder/workspace");
const am = require("../../src/aiMedia");
const aiCore = require("../../src/services/aiCore");
const siteModules = require("../../src/marketing/siteModules");
const { createAiCore } = require("../../src/ai");

const fakeAi = (sc) => aiCore.setClientForTests({ beta: { messages: { create: async (r) => {
  const out = /analyste de projets/.test(r.system) ? sc.analysis : sc.plan;
  return { stop_reason: "end_turn", content: [{ type: "text", text: JSON.stringify(out) }], model: "fake", usage: { input_tokens: 10, output_tokens: 20 } };
} } } });
const time = async (fn) => { const t = process.hrtime.bigint(); const value = await fn(); return { value, ms: Number(process.hrtime.bigint() - t) / 1e6 }; };

async function generateVitrine(A, sc, { host }) {
  const obs = { id: sc.id, timings: {}, notes: [] };
  const site = pages.createSite(A, { name: sc.plan.site.name });
  const siteId = site.id; obs.siteId = siteId;
  siteModules.setEnabled(A, siteId, "ai", true); siteModules.setEnabled(A, siteId, "commerce", true);
  fakeAi(sc);
  const core = createAiCore({ db: A.db, settings: A.settings });
  let r = await time(() => plans.analyzeBrief(A, { brief: sc.brief, siteId })); obs.timings.analyse = r.ms; const planId = r.value.id; obs.planId = planId;
  obs.analysis = { level: r.value.analysis.level || null, questions: r.value.analysis.questions.length, warnings: (r.value.analysis.warnings || []).map((w) => w.code) };
  r = await time(() => plans.createPlan(A, planId, { proceedWithAssumptions: true })); obs.timings.plan = r.ms;
  obs.plan = { pages: r.value.plan.pages.length, warnings: (r.value.plan.warnings || []).map((w) => `${w.level}:${w.code}`), sectionTypes: r.value.plan.pages.map((p) => p.sections.map((s) => s.type)) };
  const v = ws.validatePlan(A, planId, { revision: r.value.revision }); obs.planStatus = v.status;
  r = await time(() => ws.generatePages(A, planId, {})); obs.timings.pages = r.ms; obs.skipped = r.value.skipped;
  const run = r.value.run; obs.pageRun = { pages: run.pages.length, summary: run.pages.map((p) => ({ name: p.name, sections: (p.sections || []).length, status: p.status })) };
  // 1re tentative SANS décision (comportement par défaut) : constate le conflit de noms entre sites d'une même organisation (défaut mesuré, voir le rapport)
  obs.crossSiteConflict = false;
  try { ws.applyPages(A, planId, run.id, {}); } catch (e) { if (e.code === "conflict") obs.crossSiteConflict = e.message; else throw e; }
  r = await time(async () => (obs.crossSiteConflict ? ws.applyPages(A, planId, run.id, Object.fromEntries(run.pages.map((p) => [p.key, "create"]))) : null)); obs.timings.apply = r.ms;
  // Design : propositions vérifiées, la première est appliquée
  r = await time(() => ws.generateDesign(A, planId, {})); obs.timings.design = r.ms;
  const d = r.value.run; obs.design = { proposals: d.proposals.map((p) => ({ key: p.key, name: p.name, primary: p.design && p.design.palette && p.design.palette.primary, ok: p.report && p.report.ok, fonts: p.design && p.design.typography ? [p.design.typography.heading, p.design.typography.body] : null })) };
  try { await ws.applyDesign(A, planId, d.id, d.proposals[0].key, {}); obs.designApplied = d.proposals[0].key; } catch (e) { obs.notes.push(`design non appliqué : ${e.message}`); }
  // Pages et accueil
  const list = pages.sitePages(A, siteId); obs.pages = list.map((p) => ({ id: p.id, name: p.name, slug: p.slug }));
  const home = list.find((p) => /accueil/i.test(p.name)) || list[0]; try { pages.setHomePage(A, siteId, home.id); obs.homeId = home.id; } catch (e) { obs.notes.push(`accueil : ${e.message}`); }
  // Médias : visuels d'attente (fournisseur « demo ») pour les bandeaux de l'accueil
  r = await time(async () => {
    const needs = am.plan(A, siteId); const heroes = needs.filter((n) => n.widget === "hero" && n.pageName === home.name);
    let done = 0; for (const h of heroes) { const [t] = await am.startSync(A, siteId, { needKeys: [h.key], provider: "demo" }, { core }); if (t.status === "succeeded") { am.assign(A, siteId, { needKey: h.key, mediaId: t.mediaIds[0], alt: `Visuel d'attente — ${sc.label}` }); done += 1; } }
    return { needs: needs.length, heroes: heroes.length, done };
  }); obs.timings.media = r.ms; obs.media = r.value;
  // Publication par le système natif
  obs.publish = { ok: 0, failed: [] };
  r = await time(async () => { for (const p of pages.sitePages(A, siteId)) { try { pages.publish(A, p.id); obs.publish.ok += 1; } catch (e) { obs.publish.failed.push(`${p.name}: ${e.message}`); } } });
  obs.timings.publish = r.ms;
  obs.pages = pages.sitePages(A, siteId).map((p) => ({ id: p.id, name: p.name, slug: p.slug, status: p.status }));
  // Sections prévues par le plan / sections réellement présentes dans les pages générées (une section vide ou sans adresse est écartée par le mapper)
  const generatedBy = Object.fromEntries(obs.pages.map((p) => [p.name.replace(/ \(\d+\)$/, ""), pages.requirePage(A, p.id).working.sections.map((x) => x.type)]));
  obs.sectionLoss = sc.plan.pages.map((p) => ({ page: p.name, planned: p.sections.map((x) => x.type), generated: generatedBy[p.name] || [] }));
  A.db.prepare("INSERT INTO mk_site_domains (organization_id, site_id, host, kind, status, is_canonical, verification_method, verified_at) VALUES (?, ?, ?, 'custom', 'verified', 1, 'test', datetime('now'))").run(A.organizationId, siteId, host);
  obs.host = host;
  return obs;
}

module.exports = { generateVitrine, fakeAi, time };
