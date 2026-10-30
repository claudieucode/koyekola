// Programme 21.8 — parcours HTTP réel : écran et API /site-web/sites/:id/createur-ia, droits, isolation entre sites, secrets, enchaînement RÉEL des moteurs 21.3 à 21.7
// (serveur spawné, faux serveur d'API local utilisé par le vrai SDK : aucun appel externe, aucun coût).
const http = require("node:http");
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, loginInstructor, newStudent } = require("./helpers");

const KEY = "sk-ant-test-factice";
const fact = (value = "", status = "unknown", evidence = "") => ({ value, status, evidence, confidence: 0.9 });
const ANALYSIS = { briefLanguage: "fr", name: fact("BâtiPlus", "explicit", "BâtiPlus"), siteType: fact("entreprise", "explicit", "entreprise de construction"), sector: fact("construction", "explicit", "entreprise de construction"), country: fact(), city: fact(), siteLanguage: fact("fr", "assumed"), audience: fact(), tone: fact(), formality: fact(), style: fact("moderne", "explicit", "moderne"), typography: fact(), colors: [], secondaryTypes: [], goals: [{ key: "devis", status: "explicit", confidence: 0.9, evidence: "devis" }], features: [], pagesRequested: [], contradictions: [], missing: [], questions: [] };
const sec = (type, purpose) => ({ key: "", type, purpose, description: "", expectedContent: "", widgets: [], importance: "important", requiredData: [], dependsOn: [], origin: "ai" });
const pgm = (key, name, sections, pageType, position) => ({ key, name, slug: key, purpose: `Objectif ${name}`, description: "", pageType, priority: "essential", origin: "ai", menu: "main", position, parent: "", relatedTo: [], sections });
const PLAN = { site: { name: "BâtiPlus", description: "" }, pages: [pgm("accueil", "Accueil", [sec("hero", "Accroche"), sec("features", "Services")], "accueil", 1), pgm("services", "Services", [sec("features", "Détail")], "services", 2)], navigation: { main: ["accueil", "services"], secondary: [], footer: [] }, features: [], conversions: [], recommendations: [] };
const BRIEF = { description: "Je veux un site pour mon entreprise de construction BâtiPlus à Kinshasa.", company: "BâtiPlus", sector: "construction", language: "fr" };

describe("Créateur de site IA (serveur réel)", () => {
  let srv, db, boss, api, requests = [], A, B, editorA, adminB, readerA;
  const one = (sql, ...a) => db.prepare(sql).get(...a);
  const idOf = (c) => one("SELECT id FROM users WHERE email = ?", c.email).id;
  const M = (site) => `/marketing/site-web/sites/${site}/modules`;
  const U = (site, p = "") => `/marketing/site-web/sites/${site}/createur-ia${p}`;
  const post = (c, path, body) => c.request(path, { method: "POST", json: body || {} });
  const json = (r) => JSON.parse(r.text);
  before(async () => {
    api = http.createServer((req, res) => {
      let body = ""; req.on("data", (d) => (body += d));
      req.on("end", () => {
        const r = JSON.parse(body || "{}"); requests.push({ key: req.headers["x-api-key"], body: r });
        const sys = String(r.system || ""), user = String((r.messages && r.messages[0] && r.messages[0].content) || "");
        let out = {};
        if (/analyste de projets/.test(sys)) out = ANALYSIS;
        else if (/architecte de sites/.test(sys)) out = PLAN;
        else if (/rédacteur web/.test(sys)) { const keys = [...user.matchAll(/"key":"([^"]+)"/g)].map((m) => m[1]); out = { fields: keys.map((key) => ({ key, value: /title/.test(key) ? "Un titre précis" : "Un texte clair et utile." })), seo: { title: "BâtiPlus : construction", description: "Entreprise de construction à Kinshasa : conception, chantiers et suivi, demandez un devis gratuit.", focusKeyword: "construction", slug: "accueil" }, questions: [] }; }
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

  test("écran : page rendue (barre, navigation, assistant, accessibilité), données d'amorçage sans secret, refus sans droit", async () => {
    const r = await boss.get(U(A)); assert.equal(r.status, 200);
    for (const s of ['id="aib-top"', 'id="aib-side"', 'id="aib-main"', 'id="aib-assist"', 'aria-label="Étapes du projet"', 'class="skip-link"', 'id="aib-boot"']) assert.ok(r.text.includes(s), s);
    assert.ok(!r.text.includes(KEY) && !/ANTHROPIC/.test(r.text));
    const boot = JSON.parse(r.text.match(/id="aib-boot">([\s\S]*?)<\/script>/)[1]);
    assert.equal(boot.siteId, A); assert.equal(boot.perms.write, true);
    assert.equal((await boss.get("/js/ai-builder.js")).status, 200); assert.equal((await boss.get("/css/ai-builder.css")).status, 200);
    assert.equal((await readerA.get(U(A) + `?site=${A}`)).status === 200, false, "un rôle sans droit de lecture des pages n'ouvre pas l'écran");
    assert.equal((await boss.get(U(999999))).status, 404);
  });
  test("parcours complet : projet → brief → plan → validation → pages → design → contenus → médias → aperçu → publication ; progression réelle à chaque étape", async () => {
    const mkp = await post(boss, U(A, "/api/projets"), { name: "Mon site" }); assert.equal(mkp.status, 200, mkp.text.slice(0, 200)); const pid = json(mkp).project.id;
    const P = (p) => U(A, `/api/projets/${pid}${p}`);
    const state = async () => json(await boss.get(P("/etat")));
    assert.deepEqual((await state()).steps.map((s) => s.status), Array(8).fill("notstarted"));
    let st = await state();
    const sv = await post(boss, P("/brouillon"), { fields: BRIEF, revision: st.project.revision }); assert.equal(sv.status, 200);
    assert.equal((await post(boss, P("/brouillon"), { fields: BRIEF, revision: st.project.revision })).status, 409, "révision périmée refusée");
    const an = await post(boss, P("/analyser")); assert.equal(an.status, 200, an.text.slice(0, 300));
    const pl = await post(boss, P("/planifier"), { proceedWithAssumptions: true }); assert.equal(pl.status, 200, pl.text.slice(0, 300));
    const plan = json(pl).plan;
    const ed = await post(boss, P("/plan/modifier"), { operation: { op: "add_page", name: "À propos" }, revision: plan.revision }); assert.equal(ed.status, 200);
    const stale = await post(boss, P("/plan/modifier"), { operation: { op: "add_page", name: "Autre" }, revision: plan.revision }); assert.equal(stale.status, 409);
    const va = await post(boss, P("/plan/valider"), { revision: json(ed).plan.revision }); assert.equal(va.status, 200, va.text.slice(0, 300));
    assert.equal((await state()).steps[1].status, "done");
    const gen = await post(boss, P("/pages/generer")); assert.equal(gen.status, 200, gen.text.slice(0, 400));
    assert.equal(db.prepare("SELECT COUNT(*) n FROM mk_landing_pages WHERE site_id = ?").get(A).n, 0, "rien n'est écrit avant l'application");
    const ap = await post(boss, P("/pages/appliquer")); assert.equal(ap.status, 200, ap.text.slice(0, 400));
    const pages = json(await boss.get(P("/pages"))).pages; assert.ok(pages.length >= 3 && pages.every((p) => p.status !== "published"));
    // design : génération, comparaison, application au brouillon du Personnaliser (base de l'application), annulation
    const dg = await post(boss, P("/design/generer"), { text: "élégant, bleu marine" }); assert.equal(dg.status, 200, dg.text.slice(0, 300));
    const key = json(dg).run.proposals[0].key;
    const cmp = await boss.get(P("/design/comparer") + `?key=${key}`); assert.equal(cmp.status, 200, cmp.text.slice(0, 200));
    const da = await post(boss, P("/design/appliquer"), { key }); assert.equal(da.status, 200, da.text.slice(0, 300));
    assert.equal((await state()).steps[3].status, "done");
    assert.ok(one("SELECT changes FROM cms_customizer_drafts WHERE site_id = ?", A), "le design est écrit dans le brouillon natif du personnalisateur");
    // contenus
    const home = pages.find((p) => p.key === "accueil");
    const cg = await post(boss, P("/contenus/generer"), { pageId: home.pageId }); assert.equal(cg.status, 200, cg.text.slice(0, 400));
    const ca = await post(boss, P("/contenus/appliquer"), { setId: json(cg).set.id }); assert.equal(ca.status, 200, ca.text.slice(0, 300));
    assert.ok(json(ca).written.length > 0);
    // médias : analyse des besoins puis génération avec le fournisseur de démonstration
    const mp = await post(boss, P("/medias/planifier")); assert.equal(mp.status, 200, mp.text.slice(0, 300));
    const needs = json(mp).needs.filter((n) => n.status === "needed");
    if (needs.length) {
      const est = await post(boss, P("/medias/estimer"), { needKeys: [needs[0].key], provider: "demo" }); assert.equal(est.status, 200);
      const mg = await post(boss, P("/medias/generer"), { needKeys: [needs[0].key], provider: "demo" }); assert.equal(mg.status, 200, mg.text.slice(0, 300));
      assert.equal(json(await boss.get(P("/medias"))).tasks.length >= 1, true);
    }
    // aperçu + publication
    const ap2 = json(await boss.get(P("/apercu"))); assert.ok(ap2.pages.length >= 3);
    const fr = await boss.get(ap2.pages[0].previewUrl); assert.equal(fr.status, 200, "l'aperçu utilise le moteur de rendu natif");
    const pub = json(await boss.get(P("/publication"))).check; assert.ok(pub.items.length >= 6 && Array.isArray(pub.blocking));
    const noConfirm = await post(boss, P("/publication/publier"), {}); assert.ok([409, 422].includes(noConfirm.status), String(noConfirm.status));
    assert.equal(db.prepare("SELECT COUNT(*) n FROM mk_landing_pages WHERE site_id = ? AND status = 'published'").get(A).n, 0, "rien n'est publié sans confirmation ni contrôles");
    // journal / annuler
    const jr = json(await boss.get(P("/journal"))); assert.ok(jr.events.some((e) => e.kind === "change"));
    const un = await post(boss, P("/annuler")); assert.equal(un.status, 200, un.text.slice(0, 200));
    // assistant
    const as = await post(boss, P("/assistant"), { message: "Ajoute une page Tarifs", step: "plan" }); assert.equal(as.status, 200, as.text.slice(0, 300));
    assert.equal(json(as).proposal.type, "plan");
    // liste des projets
    const lp = json(await boss.get(U(A, "/api/projets"))).projects; assert.equal(lp.length, 1); assert.ok(lp[0].progress.done >= 3);
    assert.equal(db.prepare("SELECT COUNT(*) n FROM mk_landing_pages WHERE site_id = ? AND status = 'published'").get(A).n, 0);
  });
  test("droits et isolation : lecteur sans droit, administrateur d'un autre site, accès forgé, module IA coupé ; aucun appel fournisseur pour un refus", async () => {
    const mkp = await post(editorA, U(A, "/api/projets") + `?site=${A}`, { name: "Projet éditeur" }); assert.equal(mkp.status, 200, mkp.text.slice(0, 200)); const pid = json(mkp).project.id;
    const n = requests.length;
    const attempts = [
      ["lecteur", await readerA.get(U(A, "/api/projets") + `?site=${A}`)], ["lecteur écrit", await post(readerA, U(A, "/api/projets") + `?site=${A}`, { name: "x" })],
      ["adminB lit A", await adminB.get(U(A, `/api/projets/${pid}/etat`) + `?site=${B}`)], ["adminB lit A (sans site)", await adminB.get(U(A, `/api/projets/${pid}/etat`))],
      ["adminB écrit A", await post(adminB, U(A, `/api/projets/${pid}/analyser`) + `?site=${B}`)], ["adminB assistant", await post(adminB, U(A, `/api/projets/${pid}/assistant`) + `?site=${B}`, { message: "Ajoute une page X" })],
      ["éditeur A sur B", await post(editorA, U(B, "/api/projets") + `?site=${A}`, { name: "x" })],
    ];
    for (const [who, r] of attempts) assert.ok([403, 404].includes(r.status), `${who} : ${r.status}`);
    assert.equal(requests.length, n, "aucun appel au fournisseur pour un refus");
    assert.equal((await boss.get(U(B, `/api/projets/${pid}/etat`))).status, 404, "un projet du site A est introuvable depuis le site B, même pour l'équipe");
    // éditeur de A : le module IA est actif pour A → l'analyse fonctionne ; coupé → refus avant tout appel
    const st = json(await editorA.get(U(A, `/api/projets/${pid}/etat`) + `?site=${A}`));
    assert.equal((await post(editorA, U(A, `/api/projets/${pid}/brouillon`) + `?site=${A}`, { fields: BRIEF, revision: st.project.revision })).status, 200);
    assert.equal((await post(editorA, U(A, `/api/projets/${pid}/analyser`) + `?site=${A}`)).status, 200);
    const calls = requests.length;
    await boss.post(`${M(A)}/ai`, { etat: "desactiver" });
    const off = await post(editorA, U(A, `/api/projets/${pid}/analyser`) + `?site=${A}`); assert.ok([400, 403].includes(off.status), String(off.status)); assert.equal(requests.length, calls);
    // publication : droit pages.publish requis
    assert.ok([403, 404].includes((await post(readerA, U(A, `/api/projets/${pid}/publication/publier`) + `?site=${A}`, { confirm: true })).status));
  });
  test("aucune clé ni secret dans aucune réponse ; une seule clé (celle du serveur) est utilisée", async () => {
    const all = [await boss.get(U(A)), await boss.get(U(A, "/api/projets"))];
    for (const x of all) assert.ok(!x.text.includes(KEY) && !/ANTHROPIC|sk-ant/.test(x.text));
    assert.ok(requests.every((q) => q.key === KEY));
  });
});
