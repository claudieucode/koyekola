// Programme 21.7 — AI Media Generator & Asset Manager. Service : base en mémoire (vraies migrations) + dossier de fichiers jetable + faux serveur de fournisseur local ; web : vrai serveur.
// Aucun appel réseau externe, aucun crédit IA : l'adaptateur OpenAI n'est testé que contre un faux serveur local.
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const http = require("node:http");
const SCRATCH = fs.mkdtempSync(path.join(os.tmpdir(), "koyekola-aimedia-"));
process.env.DATA_DIR = path.join(SCRATCH, "data");
process.env.UPLOADS_DIR = path.join(SCRATCH, "uploads");
const { test, describe, before, after, beforeEach } = require("node:test");
const assert = require("node:assert/strict");
const { freshMarketing } = require("./marketing-helpers");
const { startServer, Client, loginInstructor, newStudent } = require("./helpers");
const pages = require("../src/marketing/pages");
const am = require("../src/aiMedia");
const planner = require("../src/aiMedia/planner");
const providers = require("../src/aiMedia/providers");
const png = require("../src/aiMedia/png");
const { createAiCore } = require("../src/ai");
after(() => fs.rmSync(SCRATCH, { recursive: true, force: true }));

const PNG = (seed = "a") => png.placeholder(48, 32, seed);
const ADMIN = (org = 1) => ({ organizationId: org, userId: 7, can: () => true, siteScope: null });

describe("planificateur de consignes (pur)", () => {
  const ctx = { siteName: "Agence", category: "immobilier", sector: "", description: "", mood: "luxe", hue: 222 };
  test("fiche complète, consigne contextualisée (secteur, ambiance, teinte), sans texte ni personne identifiable", () => {
    const needs = planner.plan(ctx, [{ id: 1, name: "Accueil", sections: [{ id: "h1", type: "hero", title: "x" }, { id: "t1", type: "text" }] }]);
    const hero = needs.find((n) => n.slot === "image");
    for (const k of ["id", "key", "pageId", "pageName", "sectionId", "widget", "mediaType", "description", "prompt", "style", "format", "ratio", "width", "height", "priority", "status"]) assert.ok(hero[k] !== undefined, k);
    assert.match(hero.prompt, /maison|façade/); assert.match(hero.prompt, /bleu marine/); assert.match(hero.prompt, /premium/); assert.match(hero.prompt, /Sans aucun texte/);
    assert.deepEqual([hero.widget, hero.ratio, hero.width, hero.height], ["hero", "3:2", 1536, 1024]);
    const tech = planner.promptFor({ ...ctx, category: "saas", mood: "tech" }, "hero"); assert.notEqual(tech, hero.prompt); assert.match(tech, /numérique|réseaux/);
  });
  test("emplacements réels seulement : bandeau déjà illustré = aucun besoin ; boutique = besoin « sans emplacement » (aucun composant produit)", () => {
    const filled = planner.plan(ctx, [{ id: 1, name: "Services", sections: [{ id: "h1", type: "hero", image: "/uploads/marketing/1/a.png" }] }]);
    assert.equal(filled.length, 0);
    const shop = planner.plan({ ...ctx, category: "boutique" }, [{ id: 1, name: "Accueil", sections: [] }]);
    const prod = shop.find((n) => n.key === "site:produits"); assert.equal(prod.status, "no_slot"); assert.match(prod.reason, /composant produit/);
  });
  test("texte alternatif d'une image générée : repris de la demande, jamais inventé", () => { assert.match(planner.altFor({ description: "Illustration 1 de « Nos biens »" }), /\(image générée\)$/); });
});

describe("service médias IA", () => {
  let m, A, sid, core, opts, pageId, heroId, calls;
  const heroOf = (id = pageId) => pages.requirePage(A, id).working.sections.find((s) => s.type === "hero");
  const mkPage = (name = "Accueil Média", siteId = sid, sections = [{ type: "hero", title: "Bienvenue" }, { type: "text", markdown: "Texte" }]) => {
    const p = pages.createPage(A, { name, siteId, kind: "page", blank: true }), fresh = pages.requirePage(A, p.id);
    pages.saveDraft(A, p.id, { ...fresh.working, sections }, { revision: fresh.revision });
    return pages.requirePage(A, p.id);
  };
  const upload = (siteId = sid, buf = PNG("up")) => require("../src/marketing/media").saveUpload({ ...A, siteFilter: siteId }, { buffer: buf, originalName: "mon-logo.png", declaredType: "image/png", allow: ["image"], siteId });
  beforeEach(() => {
    m = freshMarketing(); A = m.ctx(1); sid = pages.createSite(A, { name: "Site Média" }).id;
    core = createAiCore({ db: m.db, settings: A.settings }); opts = { core, credentials: () => null }; calls = 0;
    const p = mkPage(); pageId = p.id; heroId = p.working.sections[0].id;
  });

  test("1. image Hero : besoin planifié, génération (démonstration), fichier enregistré dans la médiathèque du site avec provenance « démonstration »", async () => {
    const needs = am.plan(A, sid); const hero = needs.find((n) => n.widget === "hero");
    assert.equal(hero.status, "needed");
    const [t] = await am.startSync(A, sid, { needKeys: [hero.key], provider: "demo" }, opts);
    assert.equal(t.status, "succeeded"); assert.equal(t.mediaIds.length, 1);
    const prov = am.provenance(A, sid, t.mediaIds[0]);
    assert.deepEqual([prov.source, prov.aiGenerated, prov.provider], ["demo", false, "demo"]);
    assert.match(prov.notice, /attente/); assert.equal(m.db.prepare("SELECT site_id, reach, mime FROM mk_media WHERE id = ?").get(t.mediaIds[0]).site_id, sid);
    assert.equal(am.getNeed(A, sid, hero.key).status, "generated");
  });
  test("2. images de sections + 3. produits : illustrations d'une page « Réalisations » (3), besoin produits signalé sans emplacement", () => {
    mkPage("Nos réalisations");
    const needs = am.plan(A, sid);
    assert.equal(needs.filter((n) => /Illustration/.test(n.description)).length >= 3, true);
    m.db.prepare("UPDATE mk_sites SET site_type = 'boutique' WHERE id = ?").run(sid);
    assert.equal(am.plan(A, sid).find((n) => n.key === "site:produits").status, "no_slot");
    assert.throws(() => am.start(A, sid, { needKeys: ["site:produits"], provider: "demo" }, opts), /emplacement natif/);
  });
  test("4/12/13. sélection d'une image existante → hero natif (image + imageAlt) ; la page relue, validée et rechargée garde la référence ; le fichier existe", async () => {
    const up = upload(); am.plan(A, sid); const key = `${pageId}:${heroId}:image`;
    const r = am.assign(A, sid, { needKey: key, mediaId: up.id, alt: "Vue d'une façade" });
    assert.equal(r.verified, true);
    const page = pages.requirePage(A, pageId), hero = page.working.sections.find((s) => s.id === heroId);
    assert.deepEqual([hero.image, hero.imageAlt], [up.path, "Vue d'une façade"]);
    assert.deepEqual(pages.normalizeContent(A, page, page.working).sections, page.working.sections, "format natif stable");
    assert.ok(fs.existsSync(path.join(SCRATCH, "uploads", up.path.replace("/uploads/", ""))), "fichier présent");
    assert.equal(am.getNeed(A, sid, key).status, "assigned"); assert.equal(m.db.prepare("SELECT status FROM mk_landing_pages WHERE id = ?").get(pageId).status, "draft", "jamais publié");
    assert.match(JSON.stringify(page.working.sections), /\/uploads\/marketing\/1\/site-/, "référence médiathèque, pas d'URL temporaire ni de Base64");
  });
  test("12'. image supplémentaire : section native « Image » insérée avec identifiant déterministe, alt obligatoire", async () => {
    const p = mkPage("Nos réalisations"); am.plan(A, sid); const key = `${p.id}:${p.working.sections[0].id}:extra-1`;
    const up = upload(); assert.throws(() => am.assign(A, sid, { needKey: key, mediaId: up.id, alt: "" }), /alternatif|Image/);
    am.assign(A, sid, { needKey: key, mediaId: up.id, alt: "Réalisation" });
    const secs = pages.requirePage(A, p.id).working.sections;
    assert.equal(secs[1].type, "image"); assert.equal(secs[1].id, am.extraSectionId(key)); assert.equal(secs[1].src, up.path);
    assert.throws(() => am.assign(A, sid, { needKey: key, mediaId: up.id, alt: "x" }), (e) => e.code === "conflict", "section déjà occupée");
  });
  test("5/21. import utilisateur : provenance enregistrée sans licence supposée ; « libre de droits » exige sa source", () => {
    const up = upload(); const p = am.registerImport(A, sid, up.id, { author: "Moi" });
    assert.deepEqual([p.source, p.aiGenerated, p.license], ["user", false, ""]);
    assert.throws(() => am.describe(A, sid, up.id, { license: "libre de droits" }), /source de vérification/);
    assert.equal(am.describe(A, sid, up.id, { license: "CC0", licenseNote: "https://exemple.test/licence", tags: ["façade, Nuit", "façade"], category: "immeubles", alt: "Logo", focalX: 0.4, focalY: 0.6 }).focal.x, 0.4);
    assert.deepEqual(am.provenance(A, sid, up.id).tags, ["façade", "nuit"]);
  });
  test("6/7. fichiers invalides : SVG, faux PNG, fichier vide et fournisseur renvoyant du non-image sont rejetés, rien n'est enregistré", async () => {
    const media = require("../src/marketing/media");
    for (const buf of [Buffer.from("<svg xmlns='http://www.w3.org/2000/svg'><script>alert(1)</script></svg>"), Buffer.from("MZ pas une image"), Buffer.alloc(0)]) assert.throws(() => media.saveUpload({ ...A, siteFilter: sid }, { buffer: buf, originalName: "x.png", declaredType: "image/png", allow: ["image"], siteId: sid }));
    const original = providers.demo.generate;
    providers.demo.generate = async () => ({ images: [{ buffer: Buffer.from("<svg onload=alert(1)>"), mime: "image/png" }], billed: false });
    try {
      const needs = am.plan(A, sid); const [t] = await am.startSync(A, sid, { needKeys: [needs[0].key], provider: "demo" }, opts);
      assert.equal(t.status, "failed"); assert.equal(t.errorCode, "invalid_response");
    } finally { providers.demo.generate = original; }
    assert.equal(m.db.prepare("SELECT COUNT(*) n FROM mk_media WHERE site_id = ?").get(sid).n, 0, "aucun fichier invalide enregistré");
  });
  test("8/9/10. variantes responsives : réutilise les résolutions natives (jamais d'agrandissement, original conservé) ; WebP selon l'environnement, AVIF non généré", async () => {
    const up = upload(sid, png.placeholder(1600, 40, "big")); const r = am.responsive(A, sid, up.id);
    assert.equal(r.original, up.path); assert.equal(r.avif, false);
    if (r.available) { assert.ok(r.variants.length >= 3 && r.variants.every((v) => v.width < 1600 || v.width <= 1600)); assert.deepEqual(r.formats, ["webp"]); }
    else assert.deepEqual(r.variants, []);
  });
  test("11. texte alternatif : proposition d'après ce qui est connu ; décoratif = vide ; jamais d'information inventée", () => {
    const up = upload(); const s = am.suggestAlt(A, sid, up.id);
    assert.equal(s.basis, "nom du fichier"); assert.match(s.alt, /mon logo/); assert.match(s.note, /pas issue d'une analyse/);
    assert.deepEqual([am.suggestAlt(A, sid, up.id, { decorative: true }).alt, am.suggestAlt(A, sid, up.id, { decorative: true }).decorative], ["", true]);
    const p2 = mkPage("Déco"); am.plan(A, sid); am.assign(A, sid, { needKey: `${p2.id}:${p2.working.sections[0].id}:image`, mediaId: up.id, alt: "" });
    assert.equal(pages.requirePage(A, p2.id).working.sections[0].imageAlt, "", "bandeau décoratif : alt vide accepté");
  });
  test("14/15. régénération et protection : jamais de remplacement automatique ; remplacement explicite ; image manuelle = seconde confirmation ; restauration confirmée", async () => {
    const mediaA = upload(sid, PNG("1")), mediaB = upload(sid, PNG("2"));
    am.plan(A, sid); const key = `${pageId}:${heroId}:image`;
    // image posée À LA MAIN dans l'éditeur (hors assistant)
    const p = pages.requirePage(A, pageId); pages.saveDraft(A, pageId, { ...p.working, sections: p.working.sections.map((s) => (s.type === "hero" ? { ...s, image: mediaA.path, imageAlt: "main" } : s)) }, { revision: p.revision });
    am.plan(A, sid);
    assert.equal(am.listNeeds(A, sid).find((n) => n.key === key)?.status ?? "skipped", "skipped", "emplacement déjà pourvu : plus un besoin");
    m.db.prepare("UPDATE mk_aimedia_needs SET status = 'needed' WHERE need_key = ?").run(key);
    assert.throws(() => am.assign(A, sid, { needKey: key, mediaId: mediaB.id }), (e) => e.code === "conflict" && /jamais remplacée automatiquement/.test(e.message));
    assert.throws(() => am.assign(A, sid, { needKey: key, mediaId: mediaB.id, replace: true }), (e) => e.code === "conflict" && /manuellement/.test(e.message));
    assert.equal(heroOf().image, mediaA.path, "rien n'a changé");
    assert.equal(am.autoAssign(A, sid).done.length, 0, "le remplissage automatique ne remplace rien");
    am.assign(A, sid, { needKey: key, mediaId: mediaB.id, replace: true, confirmManual: true });
    assert.equal(heroOf().image, mediaB.path);
    const mediaC = upload(sid, PNG("3")); am.assign(A, sid, { needKey: key, mediaId: mediaC.id, replace: true });
    assert.equal(heroOf().image, mediaC.path, "image posée par l'assistant : remplacement explicite suffit");
    assert.throws(() => am.restore(A, sid, key), /confirmée explicitement/);
    am.restore(A, sid, key, { confirm: true }); assert.equal(heroOf().image, mediaB.path, "image précédente restaurée");
    assert.equal(heroOf().title, "Bienvenue", "le reste de la page est intact");
  });
  test("14'. régénération : nouvelle tâche liée, variantes multiples, retry contrôlé (3 essais au plus)", async () => {
    const needs = am.plan(A, sid); const key = needs.find((n) => n.widget === "hero").key;
    const [a] = await am.startSync(A, sid, { needKeys: [key], provider: "demo", variants: 3 }, opts); assert.equal(a.mediaIds.length, 3);
    const [dup] = am.start(A, sid, { needKeys: [key], provider: "demo", variants: 3 }, opts); assert.equal(dup.duplicate, true, "22. même demande : pas de doublon");
    assert.equal(m.db.prepare("SELECT COUNT(*) n FROM mk_aimedia_tasks").get().n, 1);
    const [b] = await am.startSync(A, sid, { needKeys: [key], provider: "demo", variants: 1, regenerate: true, prompt: "Nouvelle consigne pour une façade lumineuse au crépuscule" }, opts); assert.equal(b.status, "succeeded");
    assert.equal(m.db.prepare("SELECT COUNT(*) n FROM mk_aimedia_tasks").get().n, 2);
    const original = providers.demo.generate; providers.demo.generate = async () => { throw new providers.MediaError("provider_error", "boum", { retryable: true }); };
    try {
      const [f] = await am.startSync(A, sid, { needKeys: [key], provider: "demo", ratio: "1:1", regenerate: true }, opts); assert.equal(f.status, "failed");
      const r1 = am.retry(A, sid, f.id, { ...opts, sync: true })[0]; await am.run(A, sid, r1.id, opts);
      const r2 = am.retry(A, sid, r1.id, { ...opts, sync: true })[0]; await am.run(A, sid, r2.id, opts);
      assert.throws(() => am.retry(A, sid, r2.id, { ...opts, sync: true }), /Trois tentatives/);
    } finally { providers.demo.generate = original; }
    assert.throws(() => am.retry(A, sid, a.id, opts), /échouée/);
  });
  test("16/17. historique complet et quotas de l'AI Core : au-delà de la limite, le fournisseur n'est jamais appelé", async () => {
    const needs = am.plan(A, sid); const key = needs[0].key;
    core.usage.setQuota({ scope: "module", scopeId: "media", organizationId: 1, period: "day", maxRequests: 1 });
    let seen = 0; const original = providers.demo.generate; providers.demo.generate = async (...a) => { seen += 1; return original.apply(providers.demo, a); };
    try {
      const [ok] = await am.startSync(A, sid, { needKeys: [key], provider: "demo" }, opts); assert.equal(ok.status, "succeeded");
      const [blocked] = await am.startSync(A, sid, { needKeys: [key], provider: "demo", regenerate: true }, opts);
      assert.equal(blocked.status, "failed"); assert.equal(blocked.errorCode, "quota_exceeded"); assert.equal(seen, 1, "fournisseur appelé une seule fois");
    } finally { providers.demo.generate = original; }
    const h = am.historyList(A, sid);
    assert.ok(h.some((x) => x.op === "generate" && x.status === "ok" && x.provider === "demo" && x.prompt && x.durationMs !== null));
    assert.ok(h.some((x) => x.status === "failed" && /Limite/.test(x.error)));
    assert.equal(m.db.prepare("SELECT COUNT(*) n FROM mk_ai_core_usage WHERE module = 'media' AND status = 'succeeded' AND provider = 'demo'").get().n, 1, "consommation journalisée dans l'AI Core ; la demande refusée par le quota n'y figure pas");
    const c = am.consumption(A, sid); assert.match(c.note, /estimations/); assert.equal(h.find((x) => x.op === "generate").realCostMicro, null, "coût réel jamais inventé");
  });
  test("23. tâches asynchrones : démarrage non bloquant, annulation, expiration des tâches abandonnées", async () => {
    const needs = am.plan(A, sid); const key = needs[0].key;
    const [t] = am.start(A, sid, { needKeys: [key], provider: "demo" }, { ...opts, sync: true }); assert.equal(t.status, "queued");
    const c = am.cancel(A, sid, t.id); assert.equal(c.status, "canceled"); assert.equal(am.getNeed(A, sid, key).status, "needed");
    assert.throws(() => am.cancel(A, sid, t.id), /terminée/);
    await am.run(A, sid, t.id, opts); assert.equal(am.getTask(A, sid, t.id).status, "canceled", "une tâche annulée ne s'exécute pas");
    const [t2] = am.start(A, sid, { needKeys: [key], provider: "demo", regenerate: true }, { ...opts, sync: true });
    m.db.prepare("UPDATE mk_aimedia_tasks SET created_at = datetime('now', '-3 hours') WHERE id = ?").run(t2.id);
    assert.equal(am.listTasks(A, sid).find((x) => x.id === t2.id).errorCode, "expired");
    const [t3] = am.start(A, sid, { needKeys: [key], provider: "demo", regenerate: true }, { ...opts, sync: true });
    m.db.prepare("UPDATE mk_aimedia_tasks SET status = 'running', started_at = datetime('now', '-1 hours') WHERE id = ?").run(t3.id);
    assert.equal(am.listTasks(A, sid).find((x) => x.id === t3.id).errorCode, "timeout");
  });
  test("19/20. isolation : média d'un autre site, page d'un autre site, accès limité, et autres organisations refusés", async () => {
    const other = pages.createSite(A, { name: "Autre site" }).id; const foreign = upload(other, PNG("autre"));
    const needs = am.plan(A, sid); const key = `${pageId}:${heroId}:image`;
    assert.throws(() => am.assign(A, sid, { needKey: key, mediaId: foreign.id }), (e) => e.code === "not_found");
    assert.throws(() => am.describe(A, sid, foreign.id, { tags: ["x"] }), (e) => e.code === "not_found");
    assert.throws(() => am.provenance(A, sid, foreign.id), (e) => e.code === "not_found");
    assert.ok(!am.library(A, sid).some((i) => i.id === foreign.id), "absent de la médiathèque de ce site");
    const L = m.ctx(1, { siteScope: other });
    assert.throws(() => am.plan(L, sid), (e) => e.code === "not_found");
    assert.throws(() => am.start(L, sid, { needKeys: [key], provider: "demo" }, opts), (e) => e.code === "not_found");
    assert.throws(() => am.getNeed(m.ctx(2), sid, key));
    assert.ok(needs.length >= 1);
  });
  describe("fournisseur réel (OpenAI) contre un faux serveur local, autorisations et erreurs (18/21)", () => {
    let server, base, mode, bodies;
    before(async () => {
      bodies = [];
      server = http.createServer((req, res) => {
        let b = ""; req.on("data", (c) => { b += c; }); req.on("end", () => {
          bodies.push({ url: req.url, auth: req.headers.authorization, body: b });
          const send = (code, obj) => { res.writeHead(code, { "content-type": "application/json", "x-request-id": "req_test" }); res.end(JSON.stringify(obj)); };
          if (mode === "ok") return send(200, { data: [{ b64_json: PNG("fournisseur").toString("base64") }] });
          if (mode === "401") return send(401, { error: { message: "Incorrect API key provided: sk-test-secret-123" } });
          if (mode === "429") return send(429, { error: { message: "rate limit" } });
          if (mode === "500") return send(500, { error: { message: "oups" } });
          if (mode === "400") return send(400, { error: { message: "content policy" } });
          if (mode === "empty") return send(200, { data: [] });
          if (mode === "garbage") { res.writeHead(200, { "content-type": "application/json" }); return res.end("<html>"); }
          return send(200, { data: [{ b64_json: "@@@" }] });
        });
      });
      await new Promise((r) => server.listen(0, "127.0.0.1", r)); base = `http://127.0.0.1:${server.address().port}`; process.env.CONNECTOR_API_BASE_OPENAI = base;
    });
    after(() => { delete process.env.CONNECTOR_API_BASE_OPENAI; server.close(); });
    const enable = () => { core.config.updateGlobal(ADMIN(), { enabled: true, allowedProviders: ["openai"] }); core.config.updateSite(ADMIN(), sid, { enabled: true }); A.settings.set(1, "aimedia.spend_authorized", "1"); };
    const key = () => `${pageId}:${heroId}:image`;
    const real = { core: null, credentials: () => ({ secrets: { apiKey: "sk-test-secret-123" } }) };
    beforeEach(() => { mode = "ok"; bodies.length = 0; real.core = core; });

    test("sans autorisation de dépense, sans IA activée ou sans clé : refusé AVANT toute création de tâche et tout appel", async () => {
      am.plan(A, sid);
      assert.throws(() => am.start(A, sid, { needKeys: [key()], provider: "openai" }, real), (e) => /dépense|IA n'est pas activée/.test(e.message));
      core.config.updateGlobal(ADMIN(), { enabled: true, allowedProviders: ["openai"] }); core.config.updateSite(ADMIN(), sid, { enabled: true });
      assert.throws(() => am.start(A, sid, { needKeys: [key()], provider: "openai" }, real), /Dépense non autorisée/);
      A.settings.set(1, "aimedia.spend_authorized", "1");
      assert.throws(() => am.start(A, sid, { needKeys: [key()], provider: "openai" }, { core, credentials: () => null }), /Aucune clé configurée/);
      assert.throws(() => am.start(A, sid, { needKeys: [key()], provider: "stability" }, real), /n'est pas intégré/);
      assert.equal(m.db.prepare("SELECT COUNT(*) n FROM mk_aimedia_tasks").get().n, 0); assert.equal(bodies.length, 0);
      assert.equal(am.providerStatus(A, sid, real).find((p) => p.id === "stability").usable, false);
      assert.throws(() => am.setSpendAuthorized(m.ctx(1, { siteScope: sid }), true), (e) => e.code === "forbidden");
    });
    test("génération réussie : requête conforme, image enregistrée marquée « générée par IA », coût estimé inconnu (tarif non vérifié), jamais présenté comme réel", async () => {
      enable(); am.plan(A, sid);
      const [t] = await am.startSync(A, sid, { needKeys: [key()], provider: "openai", variants: 2 }, real);
      assert.equal(t.status, "succeeded");
      const req = JSON.parse(bodies[0].body); assert.deepEqual([bodies[0].url, req.model, req.size, req.n], ["/v1/images/generations", "gpt-image-1", "1536x1024", 2]); assert.match(req.prompt, /Sans aucun texte/);
      assert.equal(bodies[0].auth, "Bearer sk-test-secret-123");
      const p = am.provenance(A, sid, t.mediaIds[0]);
      assert.deepEqual([p.source, p.aiGenerated, p.provider, p.model], ["ai", true, "openai", "gpt-image-1"]); assert.match(p.notice, /photographie authentique/); assert.match(p.license, /à vérifier/);
      assert.equal(t.estCostMicro, null); assert.equal(t.realCostMicro, null);
      assert.equal(am.estimate(A, sid, { needKeys: [key()], provider: "openai" }).kind, "inconnu");
      assert.ok(am.library(A, sid, { ai: true }).some((i) => i.id === t.mediaIds[0]), "filtre « générées par IA »");
      assert.ok(am.library(A, sid, { source: "ai", q: "openai" }).length >= 1);
    });
    test("limite de coût de l'AI Core : tarif non vérifié → refus (aucun appel) ; erreurs fournisseur normalisées sans fuite de clé", async () => {
      enable(); am.plan(A, sid);
      core.usage.setQuota({ scope: "global", period: "day", maxCostMicroUsd: 1000000 });
      const [q] = await am.startSync(A, sid, { needKeys: [key()], provider: "openai" }, real);
      assert.equal(q.status, "failed"); assert.equal(q.errorCode, "cost_unverified"); assert.equal(bodies.length, 0);
      m.db.prepare("DELETE FROM mk_ai_core_quotas").run();
      const expectations = { 401: "auth", 429: "rate_limited", 500: "provider_error", 400: "content_policy", empty: "invalid_response", garbage: "invalid_response", bad: "invalid_response" };
      for (const [mode_, code] of Object.entries(expectations)) {
        mode = mode_;
        const [t] = await am.startSync(A, sid, { needKeys: [key()], provider: "openai", regenerate: true }, real);
        assert.equal(t.status, "failed", mode_); assert.equal(t.errorCode, code, mode_);
        assert.ok(!JSON.stringify(t).includes("sk-test-secret-123") && !JSON.stringify(am.historyList(A, sid)).includes("sk-test-secret-123"), "aucune clé dans les erreurs ni l'historique");
      }
      assert.equal(m.db.prepare("SELECT COUNT(*) n FROM mk_media WHERE site_id = ?").get(sid).n, 0, "aucune image enregistrée sur erreur");
    });
  });
});

describe("web : écran, tâches asynchrones, rechargement, droits", () => {
  let srv, boss, db, A, B, adminA, viewerA, adminB;
  const G = (id, rest = "") => `/marketing/site-web/sites/${id}/medias-ia${rest}`;
  const idOf = (c) => db.prepare("SELECT id FROM users WHERE email = ?").get(c.email).id;
  const wait = async (fn, ms = 20000) => { const t0 = Date.now(); for (;;) { const v = await fn(); if (v) return v; if (Date.now() - t0 > ms) throw new Error("délai dépassé"); await new Promise((r) => setTimeout(r, 150)); } };
  before(async () => {
    srv = await startServer({ SITE_URL: "https://kolakisa.test" });
    boss = await loginInstructor(srv); db = srv.db();
    const mk = async (n) => { await boss.post("/marketing/site-web/sites", { name: n }); return db.prepare("SELECT id FROM mk_sites WHERE name = ?").get(n).id; };
    A = await mk("Média A"); B = await mk("Média B");
    const member = async (site, role) => { const c = await newStudent(srv); db.prepare("INSERT INTO mk_site_members (site_id, user_id, role) VALUES (?, ?, ?)").run(site, idOf(c), role); return c; };
    adminA = await member(A, "admin"); viewerA = await member(A, "viewer"); adminB = await member(B, "admin");
  });
  after(() => { db.close(); return srv.stop(); });

  test("planifier → générer (arrière-plan) → suivre → placer dans le brouillon → rouvrir : l'image reste servie, la page s'ouvre dans l'éditeur", async () => {
    await boss.post("/marketing/site-web/sites", { name: "x" });
    const plan = JSON.stringify({ version: 1, site: { name: "A" }, pages: [{ name: "Accueil Média A", type: "accueil", sections: [{ kind: "hero", title: "Bienvenue" }, { kind: "intro", text: "Texte" }] }] });
    const g = await boss.post(`/marketing/site-web/sites/${A}/generateur/generer`, { plan }); const gid = Number(/generateur\/(\d+)/.exec(g.location)[1]);
    await boss.post(`/marketing/site-web/sites/${A}/generateur/${gid}/appliquer`, { "strategie_accueil-media-a": "create" });
    const page = db.prepare("SELECT id FROM mk_landing_pages WHERE name = 'Accueil Média A'").get();
    const screen = await boss.get(G(A)); assert.equal(screen.status, 200); assert.match(screen.text, /Aucun fournisseur d(?:'|&#39;)images réel n(?:'|&#39;)a été appelé/); assert.match(screen.text, /Google Imagen/);
    await boss.post(G(A, "/planifier"), {});
    const need = db.prepare("SELECT need_key FROM mk_aimedia_needs WHERE site_id = ? AND widget = 'hero'").get(A);
    assert.ok(need, "besoin planifié depuis la structure de la page");
    const r = await boss.post(G(A, "/generer"), { besoins: need.need_key, fournisseur: "demo", variantes: "2" });
    assert.equal(r.status, 302);
    const done = await wait(async () => { const j = JSON.parse((await boss.get(G(A, "/taches.json"))).text); return j.tasks.find((t) => t.status === "succeeded"); });
    assert.equal(done.mediaIds.length, 2); assert.equal(done.realCostMicro, null);
    const dup = await boss.post(G(A, "/generer"), { besoins: need.need_key, fournisseur: "demo", variantes: "2" }); assert.equal(dup.status, 302);
    assert.equal(db.prepare("SELECT COUNT(*) n FROM mk_aimedia_tasks WHERE site_id = ?").get(A).n, 1, "pas de doublon");
    const mid = done.mediaIds[0], path_ = db.prepare("SELECT path FROM mk_media WHERE id = ?").get(mid).path;
    await boss.post(G(A, "/affecter"), { besoin: need.need_key, media: String(mid), alt: "Façade (image générée)" });
    const secs = JSON.parse(db.prepare("SELECT draft FROM mk_landing_pages WHERE id = ?").get(page.id).draft).sections;
    assert.equal(secs[0].image, path_); assert.equal(secs[0].imageAlt, "Façade (image générée)");
    const img = await new Client(srv.base).get(path_); assert.equal(img.status, 200); assert.match(img.headers.get("content-type"), /image\/png/);
    assert.equal((await boss.get(`/marketing/pages/${page.id}/editeur`)).status, 200);
    assert.equal((await boss.get(`/marketing/pages/${page.id}/apercu`)).status, 200);
    const again = await boss.post(G(A, "/affecter"), { besoin: need.need_key, media: String(done.mediaIds[1]) }); assert.equal(again.status, 302);
    assert.equal(JSON.parse(db.prepare("SELECT draft FROM mk_landing_pages WHERE id = ?").get(page.id).draft).sections[0].image, path_, "pas de remplacement sans action explicite");
    await boss.post(G(A, "/affecter"), { besoin: need.need_key, media: String(done.mediaIds[1]), remplacer: "oui" });
    assert.notEqual(JSON.parse(db.prepare("SELECT draft FROM mk_landing_pages WHERE id = ?").get(page.id).draft).sections[0].image, path_, "remplacement explicite accepté (image de l'assistant)");
    const detail = JSON.parse((await boss.get(G(A, `/medias/${mid}.json`))).text); assert.equal(detail.provenance.source, "demo"); assert.ok(Array.isArray(detail.usage));
    assert.ok(db.prepare("SELECT COUNT(*) n FROM mk_aimedia_history WHERE site_id = ?").get(A).n >= 3);
  });
  test("19/20. isolation et droits : site B inaccessible depuis A, lecteur sans écriture, anonyme renvoyé à la connexion, autorisation de dépense réservée à l'équipe", async () => {
    assert.equal((await adminA.get(G(A))).status, 200);
    for (const p of [G(B), G(B, "/taches.json"), G(B, "/medias.json")]) assert.ok([403, 404].includes((await adminA.get(p)).status), p);
    const needs = db.prepare("SELECT COUNT(*) n FROM mk_aimedia_needs WHERE site_id = ?").get(B).n;
    await adminA.post(G(B, "/planifier"), {}); await adminB.post(G(A, "/planifier"), {}); await viewerA.post(G(A, "/planifier"), {});
    assert.equal(db.prepare("SELECT COUNT(*) n FROM mk_aimedia_needs WHERE site_id = ?").get(B).n, needs);
    const tasks = db.prepare("SELECT COUNT(*) n FROM mk_aimedia_tasks").get().n;
    await viewerA.post(G(A, "/generer"), { besoins: "1:a:image", fournisseur: "demo" }); await adminA.post(G(B, "/generer"), { besoins: "1:a:image", fournisseur: "demo" });
    assert.equal(db.prepare("SELECT COUNT(*) n FROM mk_aimedia_tasks").get().n, tasks);
    await adminA.post(G(A, "/depense"), { autoriser: "oui" });
    assert.equal(db.prepare("SELECT value FROM mk_settings WHERE key = 'aimedia.spend_authorized'").get()?.value ?? null, null, "un administrateur de site ne peut pas autoriser la dépense");
    const anon = await new Client(srv.base).get(G(A)); assert.equal(anon.status, 302); assert.match(anon.location, /connexion/);
    await boss.post(G(A, "/depense"), { autoriser: "oui" });
    assert.ok(db.prepare("SELECT value FROM mk_settings WHERE key = 'aimedia.spend_authorized'").get(), "l'équipe peut l'autoriser");
  });
});
