// Programme 21.8 — Interface « Assistant IA » : parcours complet sur un VRAI serveur (faux serveur d'API local avec le vrai SDK, aucune dépense), droits, module « ia » par site,
// isolation entre sites, quota, annulation/rétablissement, interaction réelle des moteurs 21.3 (plan) → 21.4 (pages) → 21.5 (design) → 21.6 (contenus) → publication native.
const http = require("node:http");
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, loginInstructor, newStudent, Client } = require("./helpers");

const KEY = "sk-ant-test-factice";
const fact = (value = "", status = "unknown", evidence = "") => ({ value, status, evidence, confidence: 0.9 });
const ANALYSIS = { briefLanguage: "fr", name: fact(), siteType: fact("entreprise", "explicit", "entreprise de construction"), sector: fact("construction", "explicit", "entreprise de construction"), country: fact(), city: fact(), siteLanguage: fact(), audience: fact(), tone: fact(), formality: fact(), style: fact(), typography: fact(), colors: [], secondaryTypes: [], goals: [{ key: "devis", status: "explicit", confidence: 0.9, evidence: "demander un devis" }], features: [{ key: "formulaire_devis", status: "explicit", confidence: 0.9, evidence: "demander un devis", reason: "" }], pagesRequested: [], contradictions: [], missing: [], questions: [] };
const sec = (type, purpose) => ({ key: "", type, purpose, description: "", expectedContent: "", widgets: [], importance: "important", requiredData: [], dependsOn: [], origin: "ai" });
const pg = (key, name, sections, pageType, position) => ({ key, name, slug: key, purpose: name, description: "", pageType, priority: "essential", origin: "ai", menu: "main", position, parent: "", relatedTo: [], sections });
const PLAN = { site: { name: "Construction", description: "" }, pages: [pg("accueil", "Accueil", [sec("hero", "Accroche"), sec("features", "Services"), sec("cta", "Devis")], "accueil", 1), pg("contact", "Contact", [sec("hero", "Titre"), sec("text", "Coordonnées")], "contact", 2)], navigation: { main: ["accueil", "contact"], secondary: [], footer: [] }, features: [], conversions: [], recommendations: [] };
const BRIEF = "Je veux un site pour mon entreprise de construction à Kinshasa, pour permettre aux clients de demander un devis.";

describe("Interface Assistant IA (serveur réel)", () => {
  let srv, db, boss, api, A, B, editorA, adminB, readerA, project, siteOfProject;
  const one = (sql, ...a) => db.prepare(sql).get(...a);
  const idOf = (c) => one("SELECT id FROM users WHERE email = ?", c.email).id;
  const M = (site) => `/marketing/site-web/sites/${site}/modules`;
  const U = (p = "") => `/marketing/ia/studio${p}`;
  const post = (c, path, body) => c.request(path, { method: "POST", json: body === undefined ? {} : body });
  const json = (r) => JSON.parse(r.text);
  const state = async (c = boss, id = project) => json(await c.get(U(`/${id}/etat.json`))).state;
  const edit = async (operation, label) => { const s = await state(); return post(boss, U(`/${project}/plan`), { operation, revision: s.project.revision, label }); };

  before(async () => {
    api = http.createServer((req, res) => {
      let body = ""; req.on("data", (d) => (body += d));
      req.on("end", () => {
        const r = JSON.parse(body || "{}");
        const first = String(r.messages && r.messages[0] && r.messages[0].content);
        const keys = [...first.matchAll(/"key":"([^"]+)"/g)].map((m) => m[1]);
        const out = /analyste de projets/.test(String(r.system)) ? ANALYSIS
          : /champs/.test(first) && keys.length ? { fields: keys.map((key) => ({ key, value: key.endsWith("/title") ? "Un titre clair" : "Un texte utile." })), seo: { title: "Un titre SEO", description: "Une description SEO assez longue pour être utile aux moteurs de recherche." } } : PLAN;
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ id: "msg_t", type: "message", role: "assistant", model: r.model, content: [{ type: "text", text: JSON.stringify(out) }], stop_reason: "end_turn", stop_sequence: null, usage: { input_tokens: 10, output_tokens: 20 } }));
      });
    });
    await new Promise((resolve) => api.listen(0, "127.0.0.1", resolve));
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "", ANTHROPIC_API_KEY: KEY, ANTHROPIC_BASE_URL: `http://127.0.0.1:${api.address().port}` });
    boss = await loginInstructor(srv); db = srv.db();
    const mk = async (name) => Number((await boss.post("/marketing/site-web/sites", { name })).location.match(/sites\/(\d+)/)[1]);
    A = await mk("Site Alpha"); B = await mk("Site Bravo");
    const member = async (site, role) => { const c = await newStudent(srv); db.prepare("INSERT INTO mk_site_members (site_id, user_id, role) VALUES (?, ?, ?)").run(site, idOf(c), role); return c; };
    editorA = await member(A, "editor"); adminB = await member(B, "admin");
    await boss.post("/marketing/site-web/utilisateurs/roles", { name: "Contacts seuls", description: "t", perm: ["contacts.read"] });
    readerA = await member(A, one("SELECT key FROM mk_roles WHERE name = 'Contacts seuls'").key);
    await boss.post(`${M(A)}/ai`, { etat: "activer" });
  });
  after(async () => { db.close(); await srv.stop(); api.close(); });

  describe("création et brief", () => {
    test("l'accueil des projets s'affiche pour l'équipe ; un visiteur non connecté n'y accède pas", async () => {
      const r = await boss.get(U()); assert.equal(r.status, 200); assert.match(r.text, /Créer un site avec l'IA/); assert.match(r.text, /Décrivez votre site/);
      const anon = await new Client(srv.base).get(U()); assert.notEqual(anon.status, 200);
    });
    test("un brief trop court est refusé ; un brief valide crée le projet ET un site en brouillon ; rien n'est publié", async () => {
      const short = await post(boss, U("/projets"), { brief: "Un site.", newSiteName: "Projet Bâti" }); assert.ok([400, 422].includes(short.status), short.text.slice(0, 200));
      assert.equal(one("SELECT COUNT(*) n FROM mk_sites WHERE name = 'Projet Bâti'").n, 0, "un brief refusé ne crée aucun site");
      const sitesBefore = one("SELECT COUNT(*) n FROM mk_sites").n;
      const r = await post(boss, U("/projets"), { brief: BRIEF, newSiteName: "Projet Bâti" });
      assert.equal(r.status, 200, r.text.slice(0, 300)); project = json(r).id;
      siteOfProject = one("SELECT site_id FROM mk_ai_plans WHERE id = ?", project).site_id;
      assert.ok(siteOfProject); assert.equal(one("SELECT COUNT(*) n FROM mk_sites").n, sitesBefore + 1);
      assert.equal(one("SELECT COUNT(*) n FROM mk_landing_pages WHERE site_id = ?", siteOfProject).n, 0, "aucune page créée à l'analyse");
      await boss.post(`${M(siteOfProject)}/ai`, { etat: "activer" });
    });
    test("l'état initial dit la vérité : brief en cours, tout le reste non commencé, 0 étape terminée", async () => {
      const s = await state(); const st = Object.fromEntries(s.steps.map((x) => [x.key, x.status]));
      assert.equal(s.steps.length, 8); assert.equal(s.progress.done, 0); assert.equal(s.progress.percent, 0);
      assert.equal(st.brief, "in_progress"); for (const k of ["plan", "pages", "design", "contenus", "medias", "apercu", "publication"]) assert.equal(st[k], "not_started", k);
      assert.equal(s.canPublish, false); assert.equal(s.media.providers.some((p) => p.kind === "real" && p.usable), false, "aucun fournisseur d'images réel n'est utilisable (aucune clé) : seul le mode démonstration l'est");
      assert.doesNotMatch(JSON.stringify(s), /sk-ant|ANTHROPIC/, "aucun secret dans l'état");
    });
    test("la page de l'espace de travail s'affiche (8 étapes, assistant, état embarqué sans balise exécutable)", async () => {
      const r = await boss.get(U(`/${project}`)); assert.equal(r.status, 200);
      assert.match(r.text, /id="aib-steps"/); assert.match(r.text, /Assistant IA/); assert.match(r.text, /aib-initial/);
      assert.doesNotMatch(r.text.split('id="aib-initial"')[1].split("</script>")[0], /<script|<\/?[a-z]/i, "JSON embarqué échappé");
    });
  });

  describe("plan, annulation et rétablissement", () => {
    test("planifier crée le plan : étape Brief terminée, étape Plan à vérifier", async () => {
      const r = await post(boss, U(`/${project}/planifier`), {}); assert.equal(r.status, 200, r.text.slice(0, 300));
      const s = json(r).state; const st = Object.fromEntries(s.steps.map((x) => [x.key, x.status]));
      assert.equal(st.brief, "done"); assert.equal(st.plan, "to_review"); assert.equal(s.plan.pages.length, 2);
    });
    test("modifier le plan : révision +1, annulable ; une révision périmée est refusée (409) sans rien écrire", async () => {
      const before = await state();
      const ok = await edit({ op: "rename_site", name: "BâtiPlus" }, "Renommage du site"); assert.equal(ok.status, 200);
      assert.equal(json(ok).state.plan.site.name, "BâtiPlus"); assert.equal(json(ok).state.undo.canUndo, true);
      const stale = await post(boss, U(`/${project}/plan`), { operation: { op: "rename_site", name: "Autre" }, revision: before.project.revision });
      assert.equal(stale.status, 409); assert.equal((await state()).plan.site.name, "BâtiPlus");
    });
    test("annuler puis rétablir ; une nouvelle modification vide la pile « rétablir »", async () => {
      let s = await state();
      const u = await post(boss, U(`/${project}/annuler`), { revision: s.project.revision }); assert.equal(u.status, 200, u.text.slice(0, 200));
      s = json(u).state; assert.notEqual(s.plan.site.name, "BâtiPlus"); assert.equal(s.undo.canRedo, true);
      const r = await post(boss, U(`/${project}/retablir`), { revision: s.project.revision }); assert.equal(json(r).state.plan.site.name, "BâtiPlus");
      await post(boss, U(`/${project}/annuler`), { revision: (await state()).project.revision });
      await edit({ op: "rename_site", name: "Autre nom" }, "Renommage");
      assert.equal((await state()).undo.canRedo, false, "une nouvelle action invalide le rétablissement");
      const none = await post(boss, U(`/${project}/retablir`), { revision: (await state()).project.revision }); assert.equal(none.status, 409);
    });
    test("dupliquer une page = une seule entrée d'annulation (page et sections)", async () => {
      const n0 = (await state()).plan.pages.length;
      let s = await state();
      const d = await post(boss, U(`/${project}/plan/dupliquer`), { key: "accueil", revision: s.project.revision }); assert.equal(d.status, 200, d.text.slice(0, 300));
      s = json(d).state; assert.equal(s.plan.pages.length, n0 + 1);
      const copy = s.plan.pages.find((p) => /copie/.test(p.name)); assert.equal(copy.sections.length, 3);
      s = json(await post(boss, U(`/${project}/annuler`), { revision: s.project.revision })).state;
      assert.equal(s.plan.pages.length, n0, "un seul « Annuler » retire la page ET ses sections");
    });
    test("une opération invalide dans un lot n'abîme pas le plan (rien n'est resté enregistré)", async () => {
      const s = await state();
      const r = await post(boss, U(`/${project}/plan/lot`), { operations: [{ op: "rename_site", name: "Lot" }, { op: "remove_page", key: "inexistante" }], revision: s.project.revision });
      assert.ok([404, 422].includes(r.status), r.text.slice(0, 200));
      const after = await state(); assert.equal(after.plan.site.name, s.plan.site.name); assert.equal(after.undo.undoLabel, s.undo.undoLabel);
    });
  });

  describe("assistant contextuel", () => {
    test("une demande de modification devient une PROPOSITION : le plan ne bouge qu'après acceptation", async () => {
      const n0 = (await state()).plan.pages.length;
      const r = await post(boss, U(`/${project}/assistant`), { message: "Ajoute une page À propos" }); assert.equal(r.status, 200);
      const m = json(r).message; assert.equal(m.kind, "proposal"); assert.equal(m.proposal.op.op, "add_page");
      assert.equal((await state()).plan.pages.length, n0, "aucune modification avant acceptation");
      const acc = await post(boss, U(`/${project}/propositions/${m.id}/accepter`), { revision: (await state()).project.revision }); assert.equal(acc.status, 200, acc.text.slice(0, 300));
      assert.equal(json(acc).state.plan.pages.length, n0 + 1); assert.equal(json(acc).message.decision, "accepted");
      assert.equal((await post(boss, U(`/${project}/propositions/${m.id}/accepter`), { revision: (await state()).project.revision })).status, 409, "une proposition ne s'applique qu'une fois");
      const back = await post(boss, U(`/${project}/annuler`), { revision: (await state()).project.revision }); assert.equal(json(back).state.plan.pages.length, n0, "acceptation annulable");
    });
    test("refuser une proposition ne modifie rien ; une proposition périmée est refusée", async () => {
      const m = json(await post(boss, U(`/${project}/assistant`), { message: "Ajoute une page Tarifs" })).message;
      const n0 = (await state()).plan.pages.length;
      const ref = await post(boss, U(`/${project}/propositions/${m.id}/refuser`), {}); assert.equal(json(ref).message.decision, "refused"); assert.equal((await state()).plan.pages.length, n0);
      const m2 = json(await post(boss, U(`/${project}/assistant`), { message: "Ajoute une page Équipe" })).message;
      const old = (await state()).project.revision; await edit({ op: "rename_site", name: "Encore un autre" }, "x");
      assert.equal((await post(boss, U(`/${project}/propositions/${m2.id}/accepter`), { revision: old })).status, 409);
    });
    test("conseil ≠ modification ; suppression jamais proposée ; autre étape orientée sans rien changer", async () => {
      const rev0 = (await state()).project.revision;
      const del = json(await post(boss, U(`/${project}/assistant`), { message: "Supprime la page Contact" })).message; assert.equal(del.kind, "advice"); assert.equal(del.proposal, null);
      const q = json(await post(boss, U(`/${project}/assistant`), { message: "Comment améliorer mon accueil ?" })).message; assert.equal(q.kind, "advice");
      const color = json(await post(boss, U(`/${project}/assistant`), { message: "Change la couleur principale en bleu marine" })); assert.equal(color.redirect, "design");
      assert.equal((await state()).project.revision, rev0, "aucune de ces demandes n'a modifié le plan");
      assert.ok((await state()).plan.pages.some((p) => p.key === "contact"));
    });
    test("l'historique de la conversation est conservé ; texte hostile et message trop long refusés", async () => {
      const s = await state(); assert.ok(s.messages.length >= 6);
      const hostile = await post(boss, U(`/${project}/assistant`), { message: "<img src=x onerror=alert(1)> ajoute une page <script>x</script>" }); assert.equal(hostile.status, 200);
      assert.doesNotMatch(json(hostile).message.text, /<script|<img/i);
      assert.equal((await post(boss, U(`/${project}/assistant`), { message: "x".repeat(700) })).status, 422);
      assert.equal((await post(boss, U(`/${project}/assistant`), { message: "   " })).status, 422);
    });
  });

  describe("pages, design, contenus, médias, aperçu, publication", () => {
    test("publier est impossible avant validation du plan (aucune page, aucune publication)", async () => {
      const r = await post(boss, U(`/${project}/publier`), {}); assert.ok([409, 422].includes(r.status), r.text.slice(0, 200));
      const g = await post(boss, U(`/${project}/pages/generer`), {}); assert.equal(g.status, 409, "génération impossible avant validation du plan");
    });
    test("valider le plan, puis générer et appliquer les pages (brouillons natifs)", async () => {
      // retire les pages ajoutées par les essais précédents pour un plan simple et connu
      let s = await state();
      const v = await post(boss, U(`/${project}/plan/valider`), { revision: s.project.revision }); assert.equal(v.status, 200, v.text.slice(0, 300));
      s = json(v).state; assert.equal(s.steps.find((x) => x.key === "plan").status, "done");
      const g = await post(boss, U(`/${project}/pages/generer`), {}); assert.equal(g.status, 200, g.text.slice(0, 400));
      const run = json(g).run; assert.equal(run.status, "proposed");
      assert.equal(one("SELECT COUNT(*) n FROM mk_landing_pages WHERE site_id = ?", siteOfProject).n, 0, "proposer n'écrit aucune page");
      const decisions = Object.fromEntries(run.pages.filter((p) => p.status === "ready").map((p) => [p.key, "create"]));
      const ap = await post(boss, U(`/${project}/pages/${run.id}/appliquer`), { decisions }); assert.equal(ap.status, 200, ap.text.slice(0, 400));
      const rows = db.prepare("SELECT id, status, site_id FROM mk_landing_pages WHERE site_id = ?").all(siteOfProject);
      assert.ok(rows.length >= 2); assert.ok(rows.every((r) => r.status !== "published"), "aucune page publiée par la génération");
      const st = json(ap).state; assert.ok(st.pages.filter((p) => p.pageId).length >= 2);
      assert.equal(st.steps.find((x) => x.key === "pages").status, st.pages.every((p) => p.pageId) ? "done" : "to_review");
    });
    test("médias : emplacements vides listés ; le fournisseur réel non configuré est refusé ; la génération « démonstration » suit tout le cycle (estimation, tâche, acceptation, image en place)", async () => {
      let s = await state(); assert.ok(s.media.slots.length >= 1); assert.ok(s.media.missing >= 1);
      assert.equal(s.steps.find((x) => x.key === "medias").status, "to_review"); assert.match(s.media.generation.reason, /démonstration|substitution|réel/i);
      const pl = await post(boss, U(`/${project}/media/planifier`), {}); assert.equal(pl.status, 200, pl.text.slice(0, 300));
      const needs = json(pl).needs.filter((n) => n.status === "needed"); assert.ok(needs.length >= 1, "des besoins visuels sont détectés dans les pages générées");
      const need = needs[0];
      const real = await post(boss, U(`/${project}/media/generer`), { needKeys: [need.key], provider: "openai" }); assert.equal(real.status, 403, "fournisseur réel non configuré : refusé, aucune dépense");
      assert.equal(one("SELECT COUNT(*) n FROM mk_aimedia_tasks WHERE need_key = ?", need.key).n, 0, "aucune tâche créée par un refus");
      const est = await post(boss, U(`/${project}/media/estimer`), { needKeys: [need.key], provider: "demo" }); assert.equal(est.status, 200); assert.ok(["estimé", "inconnu"].includes(json(est).estimate.kind));
      const gen = await post(boss, U(`/${project}/media/generer`), { needKeys: [need.key], provider: "demo" }); assert.equal(gen.status, 200, gen.text.slice(0, 300));
      assert.ok(["queued", "running", "succeeded"].includes(json(gen).tasks[0].status));
      for (let i = 0; i < 50 && (s = await state()).media.tasks.some((t) => t.needKey === need.key && ["queued", "running"].includes(t.status)); i += 1) await new Promise((r) => setTimeout(r, 200));
      const task = s.media.tasks.find((t) => t.needKey === need.key); assert.equal(task.status, "succeeded", JSON.stringify(task).slice(0, 300)); assert.ok(task.mediaIds.length >= 1);
      assert.ok(s.media.needs.find((n) => n.key === need.key).status === "generated", "image générée mais pas encore posée : à accepter");
      const missingBefore = s.media.missing;
      const ac = await post(boss, U(`/${project}/media/affecter`), { needKey: need.key, mediaId: task.mediaIds[0] }); assert.equal(ac.status, 200, ac.text.slice(0, 300));
      const after = json(ac).state; assert.equal(after.media.needs.find((n) => n.key === need.key).status, "assigned"); assert.ok(after.media.missing < missingBefore, "un emplacement est désormais pourvu");
      const again = await post(boss, U(`/${project}/media/affecter`), { needKey: need.key, mediaId: task.mediaIds[0] }); assert.equal(again.status, 409, "un emplacement rempli n'est jamais remplacé sans demande explicite");
      const lib = await boss.get(U(`/${project}/media/bibliotheque`)); assert.equal(lib.status, 200); assert.ok(json(lib).items.length >= 1);
    });
    test("aperçu : le moteur de rendu natif sert les brouillons générés", async () => {
      const p = (await state()).pages.find((x) => x.pageId);
      const r = await boss.get(`/marketing/pages/${p.pageId}/apercu`); assert.equal(r.status, 200); assert.match(r.text, /<html/i);
    });
    test("design : trois propositions, comparaison, application au brouillon, annulation", async () => {
      const g = await post(boss, U(`/${project}/design/generer`), { brief: { text: "Sobre, professionnel, bleu marine" } }); assert.equal(g.status, 200, g.text.slice(0, 300));
      const run = json(g).run; assert.equal(run.proposals.length, 3);
      const key = run.proposals.find((p) => p.ok !== false).key;
      const c = await boss.get(U(`/${project}/design/${run.id}/comparer?variante=${key}`)); assert.equal(c.status, 200, c.text.slice(0, 200));
      const ap = await post(boss, U(`/${project}/design/${run.id}/appliquer`), { variante: key }); assert.equal(ap.status, 200, ap.text.slice(0, 300));
      assert.equal(json(ap).state.steps.find((x) => x.key === "design").status, "done");
      const un = await post(boss, U(`/${project}/design/${run.id}/annuler`), {}); assert.equal(un.status, 200);
      assert.equal(json(un).state.steps.find((x) => x.key === "design").status, "not_started", "l'étape ne reste pas « terminée » après annulation");
    });
    test("contenus : le Content Generator produit un jeu de textes pour une page générée (via l'API native, visible dans l'état)", async () => {
      const p = (await state()).pages.find((x) => x.pageId);
      const g = await post(boss, `/marketing/site-web/sites/${siteOfProject}/contenus/generer`, { pageId: p.pageId, scope: "empty" }); assert.equal(g.status, 200, g.text.slice(0, 300));
      const s = await state(); assert.ok(s.runs.content.some((c) => c.page_id === p.pageId));
    });
    test("publication : la liste de contrôle reflète le réel ; la publication native réussit ou est refusée de façon cohérente avec l'état", async () => {
      const s = await state(); const keys = s.checklist.map((c) => c.key);
      for (const k of ["site", "plan", "pages", "preflight", "contenus", "images", "liens", "seo", "design", "mobile", "domaine"]) assert.ok(keys.includes(k), k);
      assert.equal(s.checklist.find((c) => c.key === "mobile").level, "info", "le mobile n'est pas déclaré vérifié automatiquement");
      const r = await post(boss, U(`/${project}/publier`), {});
      if (s.canPublish) {
        assert.equal(r.status, 200, r.text.slice(0, 300)); const out = json(r);
        assert.equal(out.published + out.failed, s.pages.filter((p) => p.pageId).length);
        const dbPublished = one("SELECT COUNT(*) n FROM mk_landing_pages WHERE site_id = ? AND status = 'published'", siteOfProject).n; assert.equal(dbPublished, out.published);
        assert.equal((await post(boss, U(`/${project}/publier`), {})).status, out.failed ? 200 : 409, "rien à republier");
      } else {
        assert.equal(r.status, 422, r.text.slice(0, 200)); assert.equal(one("SELECT COUNT(*) n FROM mk_landing_pages WHERE site_id = ? AND status = 'published'", siteOfProject).n, 0, "aucune page publiée quand c'est bloqué");
        assert.ok(s.blockers.length);
      }
    });
    test("la progression est dérivée des étapes réelles (jamais un pourcentage arbitraire)", async () => {
      const s = await state(); const done = s.steps.filter((x) => x.status === "done").length;
      assert.equal(s.progress.done, done); assert.equal(s.progress.percent, Math.round((done / 8) * 100));
    });
  });

  describe("permissions, module par site, isolation, quota", () => {
    let projectA, projectB;
    test("un lecteur sans droit sur les formulaires ne voit ni la liste ni l'état ; aucune écriture", async () => {
      assert.equal((await readerA.get(`${U("/projets.json")}?site=${A}`)).status, 403);
      assert.equal((await readerA.get(`${U(`/${project}/etat.json`)}?site=${A}`)).status, 403);
      assert.equal((await post(readerA, `${U("/projets")}?site=${A}`, { brief: BRIEF, siteId: A })).status, 403);
      assert.equal((await post(readerA, `${U(`/${project}/plan`)}?site=${A}`, { operation: { op: "rename_site", name: "x" }, revision: 1 })).status, 403);
    });
    test("un éditeur limité au site A crée un projet pour A seulement ; il ne peut pas créer de site ni viser le site B", async () => {
      const own = await post(editorA, `${U("/projets")}?site=${A}`, { brief: BRIEF, siteId: A }); assert.equal(own.status, 200, own.text.slice(0, 300)); projectA = json(own).id;
      assert.equal(one("SELECT site_id FROM mk_ai_plans WHERE id = ?", projectA).site_id, A);
      const other = await post(editorA, `${U("/projets")}?site=${A}`, { brief: BRIEF, siteId: B }); assert.equal(one("SELECT site_id FROM mk_ai_plans WHERE id = ?", json(other).id).site_id, A, "le site B demandé est ignoré : le serveur impose le site A");
      assert.equal((await post(editorA, `${U("/projets")}?site=${A}`, { brief: BRIEF, newSiteName: "Pirate" })).status, 403);
      assert.equal(one("SELECT COUNT(*) n FROM mk_sites WHERE name = 'Pirate'").n, 0);
    });
    test("isolation : l'éditeur du site A ne voit pas les projets du site B (liste, état, plan, assistant, génération)", async () => {
      await boss.post(`${M(B)}/ai`, { etat: "activer" });
      const b = await post(boss, U("/projets"), { brief: BRIEF, siteId: B }); projectB = json(b).id;
      const list = json(await editorA.get(`${U("/projets.json")}?site=${A}`)).projects; assert.ok(list.every((p) => p.siteId === A)); assert.ok(!list.some((p) => p.id === projectB));
      for (const [m, path, body] of [["GET", `/${projectB}/etat.json`], ["POST", `/${projectB}/planifier`, {}], ["POST", `/${projectB}/assistant`, { message: "Ajoute une page Test" }], ["POST", `/${projectB}/pages/generer`, {}], ["POST", `/${projectB}/annuler`, { revision: 1 }], ["POST", `/${projectB}/publier`, {}]]) {
        const r = m === "GET" ? await editorA.get(`${U(path)}?site=${A}`) : await post(editorA, `${U(path)}?site=${A}`, body);
        assert.ok([403, 404].includes(r.status), `${m} ${path} → ${r.status}`);
      }
      assert.notEqual((await editorA.get(`${U(`/${projectB}`)}?site=${A}`)).status, 200, "la page de l'espace de travail du site B est refusée");
      for (const path of [`/${projectB}/etat.json`, `/${projectB}`]) assert.notEqual((await editorA.get(`${U(path)}?site=${B}`)).status, 200, "viser le site B dans l'adresse ne contourne rien");
    });
    test("isolation des messages : une proposition d'un autre projet n'est pas acceptable via un autre identifiant de projet", async () => {
      await post(boss, U(`/${projectB}/planifier`), {});
      const m = json(await post(boss, U(`/${projectB}/assistant`), { message: "Ajoute une page Presse" })).message;
      const r = await post(boss, U(`/${project}/propositions/${m.id}/accepter`), { revision: (await state()).project.revision }); assert.equal(r.status, 404);
    });
    test("module « ia » désactivé pour le site : l'administrateur de ce site est refusé", async () => {
      await boss.post(`${M(B)}/ai`, { etat: "desactiver" });
      const r = await adminB.get(`${U("/projets.json")}?site=${B}`); assert.equal(r.status, 403);
      await boss.post(`${M(B)}/ai`, { etat: "activer" });
    });
    test("quota : au-delà du plafond quotidien de l'organisation, l'analyse est refusée (429) sans appel supplémentaire", async () => {
      const used = one("SELECT COUNT(*) n FROM mk_ai_requests").n;
      db.prepare("INSERT OR REPLACE INTO mk_settings (organization_id, key, value) VALUES (1, 'ai.daily_limit', ?)").run(String(used));
      const r = await post(boss, U("/projets"), { brief: BRIEF, siteId: A }); assert.equal(r.status, 429, r.text.slice(0, 200));
      assert.match(json(r).error, /limite|plafond|quota/i);
      const withNew = await post(boss, U("/projets"), { brief: BRIEF, newSiteName: "Site orphelin test" }); assert.equal(withNew.status, 429);
      assert.equal(one("SELECT status FROM mk_sites WHERE name = 'Site orphelin test'").status, "archived", "l'analyse a échoué : le site créé est archivé, pas laissé actif ni supprimé");
      db.prepare("DELETE FROM mk_settings WHERE organization_id = 1 AND key = 'ai.daily_limit'").run();
    });
    test("table de conversation : les messages ne contiennent aucun secret", async () => {
      const dump = JSON.stringify(db.prepare("SELECT * FROM mk_ai_builder_messages").all()) + JSON.stringify(db.prepare("SELECT * FROM mk_ai_builder_states").all());
      assert.doesNotMatch(dump, /sk-ant|ANTHROPIC_API_KEY/);
    });
  });
});
