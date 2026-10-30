// Programme 21.11 — mesures de performance RÉELLES des moteurs du programme 21 (en processus, base en mémoire, dossier de fichiers jetable, IA simulée). Les durées sont affichées (lignes « PERF ») et bornées par des
// seuils volontairement larges : le test détecte une dérive grossière (complexité cassée), pas une micro-variation. Aucune mesure de réseau, de navigateur ni de fournisseur réel.
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const SCRATCH = fs.mkdtempSync(path.join(os.tmpdir(), "koyekola-p21-perf-"));
process.env.DATA_DIR = path.join(SCRATCH, "data");
process.env.UPLOADS_DIR = path.join(SCRATCH, "uploads");
const { test, describe, after } = require("node:test");
const assert = require("node:assert/strict");
const { freshMarketing } = require("./marketing-helpers");
const pages = require("../src/marketing/pages");
const gen = require("../src/pageGen");
const am = require("../src/aiMedia");
const png = require("../src/aiMedia/png");
const designGen = require("../src/designGen");
const content = require("../src/contentGen");
const { createAiCore } = require("../src/ai");
after(() => fs.rmSync(SCRATCH, { recursive: true, force: true }));
const t0 = () => process.hrtime.bigint();
const ms = (s) => Number(process.hrtime.bigint() - s) / 1e6;
const perf = (label, v, unit = "ms") => console.log(`PERF ${label} : ${typeof v === "number" ? v.toFixed(1) : v} ${unit}`);

describe("performance des moteurs (mesures réelles, machine d'essai chargée)", () => {
  test("génération et enregistrement de 12 pages de 8 sections (Page Generator + moteur de pages)", async () => {
    const m = freshMarketing(), A = m.ctx(1), sid = pages.createSite(A, { name: "Perf" }).id;
    const kinds = ["hero", "intro", "services", "benefits", "gallery", "testimonials", "faq", "cta"];
    const plan = { version: 1, site: { name: "Perf" }, pages: Array.from({ length: 12 }, (_, i) => ({ key: `p${i}`, name: `Page perf ${i}`, type: "autre", sections: kinds.map((k, j) => ({ key: `${k}-${j}`, kind: k, title: k })) })) };
    let s = t0(); const run = await gen.generate(A, sid, plan); const tGen = ms(s);
    s = t0(); gen.apply(A, sid, run.id, {}); const tApply = ms(s);
    perf("12 pages × 8 sections : proposition", tGen); perf("12 pages : enregistrement en brouillon", tApply);
    assert.equal(run.result.pages.length, 12); assert.ok(tGen < 15000 && tApply < 15000);
    s = t0(); for (const p of pages.sitePages(A, sid)) pages.requirePage(A, p.id); perf("relecture de 12 pages", ms(s)); 
  });
  test("médiathèque : 300 images enregistrées, listées, filtrées et recherchées par métadonnées", async () => {
    const m = freshMarketing(), A = m.ctx(1), sid = pages.createSite(A, { name: "Perf médias" }).id, media = require("../src/marketing/media");
    let s = t0(); for (let i = 0; i < 300; i += 1) media.saveUpload({ ...A, siteFilter: sid }, { buffer: png.placeholder(24, 16, `m${i}`), originalName: `img-${i}.png`, declaredType: "image/png", allow: ["image"], siteId: sid });
    perf("enregistrement de 300 images (type réel, empreinte, fichier)", ms(s));
    for (let i = 0; i < 300; i += 3) m.db.prepare("INSERT OR IGNORE INTO mk_aimedia_meta (media_id, organization_id, site_id, source, tags) VALUES (?, 1, ?, ?, ?)").run(i + 1, sid, i % 2 ? "ai" : "user", JSON.stringify(["façade", `t${i}`]));
    require("../src/aiMedia/store").ensureSchema(m.db);
    s = t0(); const all = am.library(A, sid, {}); const tList = ms(s); s = t0(); const ai = am.library(A, sid, { ai: true, q: "façade" }); const tFilter = ms(s);
    perf("liste (200 max)", tList); perf("filtre IA + recherche", tFilter); assert.ok(all.length >= 100 && tList < 5000 && tFilter < 5000);
    s = t0(); const unused = am.library(A, sid, { unused: true, limit: 60 }); perf("images inutilisées (60 premières)", ms(s)); assert.ok(Array.isArray(unused));
  });
  test("besoins visuels sur 12 pages, projet avec un historique de 500 tâches/opérations : lecture de l'état", async () => {
    const m = freshMarketing(), A = m.ctx(1), sid = pages.createSite(A, { name: "Perf état" }).id;
    for (let i = 0; i < 12; i += 1) { const p = pages.createPage(A, { name: `Accueil perf ${i}`, siteId: sid, kind: "page", blank: true }); const c = pages.requirePage(A, p.id); pages.saveDraft(A, p.id, { ...c.working, sections: [{ type: "hero", title: "Titre" }, { type: "text", markdown: "Texte" }] }, { revision: c.revision }); }
    let s = t0(); const needs = am.plan(A, sid); perf("planification des besoins (12 pages)", ms(s)); assert.ok(needs.length >= 12);
    const ins = m.db.prepare("INSERT INTO mk_aimedia_history (organization_id, site_id, op, status) VALUES (1, ?, 'generate', 'ok')");
    for (let i = 0; i < 500; i += 1) ins.run(sid);
    s = t0(); am.historyList(A, sid, 60); am.listTasks(A, sid); am.consumption(A, sid); perf("historique de 500 opérations : lecture", ms(s));
    s = t0(); const d = await designGen.generate(A, sid, { text: "entreprise sérieuse, bleu marine", category: "entreprise" }); perf("direction artistique : 3 variantes validées", ms(s)); assert.ok(d.proposals.length >= 2);
  });
  test("contenus : analyse de 12 pages (champs éligibles) et génération simulée", async () => {
    const m = freshMarketing(), A = m.ctx(1), sid = pages.createSite(A, { name: "Perf contenus" }).id;
    const ids = []; for (let i = 0; i < 12; i += 1) { const p = pages.createPage(A, { name: `Contenu perf ${i}`, siteId: sid, kind: "page", blank: true }); const c = pages.requirePage(A, p.id); pages.saveDraft(A, p.id, { ...c.working, sections: [{ type: "hero", title: "[Titre]" }, { type: "features", title: "", items: [{ title: "[Service]", text: "" }] }, { type: "faq", items: [{ q: "[Q]", a: "[R]" }] }] }, { revision: c.revision }); ids.push(p.id); }
    let s = t0(); for (const id of ids) content.pageFields(pages.requirePage(A, id), { scope: "empty" }); perf("champs éligibles de 12 pages", ms(s));
    s = t0(); for (const id of ids.slice(0, 4)) { const el = content.pageFields(pages.requirePage(A, id), { scope: "empty" }).eligible; await content.generatePage(A, sid, { pageId: id, context: { language: "fr" }, call: async () => ({ fields: el.map((f) => ({ key: f.key, value: "Texte rédigé avec soin" })), seo: { title: "t", description: "d", focusKeyword: "" }, questions: [] }) }); }
    perf("4 générations de contenu simulées", ms(s));
  });
  test("tâches d'images simultanées : 4 générations lancées ensemble, aucune perte, quotas respectés", async () => {
    const m = freshMarketing(), A = m.ctx(1), sid = pages.createSite(A, { name: "Perf tâches" }).id, core = createAiCore({ db: m.db, settings: A.settings });
    for (let i = 0; i < 4; i += 1) { const p = pages.createPage(A, { name: `Tâche perf ${i}`, siteId: sid, kind: "page", blank: true }); const c = pages.requirePage(A, p.id); pages.saveDraft(A, p.id, { ...c.working, sections: [{ type: "hero", title: "Titre" }] }, { revision: c.revision }); }
    const needs = am.plan(A, sid).filter((n) => n.widget === "hero").slice(0, 4);
    const tasks = am.start(A, sid, { needKeys: needs.map((n) => n.key), provider: "demo" }, { core, sync: true });
    const s = t0(); await Promise.all(tasks.map((t) => am.run(A, sid, t.id, { core }))); perf("4 tâches d'image en parallèle (démonstration)", ms(s));
    assert.equal(am.listTasks(A, sid).filter((t) => t.status === "succeeded").length, 4);
  });
});
