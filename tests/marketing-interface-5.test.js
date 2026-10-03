// Marketing M4c — pages /marketing/automatisations et /marketing/evenements ; parcours réel LMS → événement → scénario → e-mail.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { startServer, Client, loginInstructor, newStudent } = require("./helpers");
const { TEST_KEY } = require("./marketing-helpers");

let srv, boss;
const sql = (query, ...args) => { const db = srv.db(); const r = db.prepare(query).all(...args); db.close(); return r; };
const run = (query, ...args) => { const db = srv.db(); db.prepare(query).run(...args); db.close(); };
const follow = async (client, res) => (res.location ? client.get(res.location) : res);
const post = async (client, url, form) => follow(client, await client.post(url, form));
const member = async (role) => {
  const c = await newStudent(srv);
  run("INSERT INTO mk_org_members (organization_id, user_id, role) VALUES (1, (SELECT id FROM users WHERE email = ?), ?)", c.email, role);
  return c;
};
const autoId = (name) => sql("SELECT id FROM mk_automations WHERE name = ?", name)[0]?.id;
const data = (html) => JSON.parse(html.match(/<script type="application\/json" id="mk-automation-data">([\s\S]*?)<\/script>/)[1]);
const createTemplate = async (client, name, kind) => Number((await client.post("/marketing/modeles", { name, starter: "blank", kind })).location.match(/(\d+)$/)[1]);

before(async () => {
  srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
  boss = await loginInstructor(srv);
});
after(() => srv.stop());

describe("accès", () => {
  test("anonyme : connexion ; étudiant : 403 ; lecteur : consulte sans modifier ; éditeur : édite mais n'active pas", async () => {
    assert.match((await new Client(srv.base).get("/marketing/automatisations")).location, /^\/connexion/);
    const s = await newStudent(srv);
    assert.equal((await s.get("/marketing/automatisations")).status, 403);
    assert.equal((await s.get("/marketing/evenements")).status, 403);
    await post(boss, "/marketing/automatisations", { name: "Accès", kind: "transactional", trigger_event: "lms.user_registered" });
    const id = autoId("Accès");
    const v = await member("viewer");
    const list = await v.get("/marketing/automatisations");
    assert.equal(list.status, 200);
    assert.doesNotMatch(list.text, /Nouveau scénario/);
    assert.equal(data((await v.get(`/marketing/automatisations/${id}`)).text).readOnly, true);
    assert.equal((await v.postJson(`/marketing/automatisations/${id}`, { steps: [] })).status, 403);
    assert.equal((await v.post("/marketing/automatisations", { name: "Intrus", kind: "marketing", trigger_event: "contact.created" })).status, 403);
    const ed = await member("editor");
    assert.equal((await ed.postJson(`/marketing/automatisations/${id}`, { steps: [{ type: "end" }] })).status, 200);
    assert.equal((await ed.post(`/marketing/automatisations/${id}/activer`, {})).status, 403);
  });
});

describe("liste et création", () => {
  test("liste avec déclencheurs en français ; création → éditeur ; erreurs claires", async () => {
    const r = await boss.get("/marketing/automatisations");
    assert.equal(r.status, 200);
    assert.match(r.text, /Nouveau scénario/);
    assert.match(r.text, /value="lms\.order_completed"/);
    assert.match(r.text, /Un compte est créé sur KOLAKISA/);
    const res = await boss.post("/marketing/automatisations", { name: "Bienvenue élève", kind: "transactional", trigger_event: "lms.user_registered" });
    assert.match(res.location, /^\/marketing\/automatisations\/\d+$/);
    assert.match((await post(boss, "/marketing/automatisations", { name: "bienvenue élève", kind: "transactional", trigger_event: "lms.user_registered" })).text, /porte déjà ce nom/);
    assert.match((await post(boss, "/marketing/automatisations", { name: "Autre", kind: "marketing", trigger_event: "N.IMPORTE.QUOI" })).text, /Déclencheur inconnu/, "hors du catalogue ET mal formé (majuscules) : refusé");
    assert.equal(autoId("Autre"), undefined);
  });
  test("déclencheur personnalisé (hors catalogue fermé) : accepté s'il est bien formé, le champ libre remplace le menu, mal formé refusé", async () => {
    await post(boss, "/marketing/automatisations", { name: "Événement API", kind: "marketing", trigger_event: "lms.user_registered", trigger_event_custom: "mon_evenement.special" });
    const customId = autoId("Événement API");
    assert.ok(customId, "créé malgré un déclencheur hors catalogue, car bien formé");
    assert.equal(sql("SELECT trigger_event FROM mk_automations WHERE id = ?", customId)[0].trigger_event, "mon_evenement.special", "le champ libre l'emporte sur le menu déroulant");
    assert.match((await boss.get("/marketing/automatisations")).text, /mon_evenement\.special/, "affiché tel quel dans la liste (absent du catalogue)");
    assert.match((await post(boss, "/marketing/automatisations", { name: "Mal formé", kind: "marketing", trigger_event: "lms.user_registered", trigger_event_custom: "1 espace invalide" })).text, /Déclencheur inconnu/);
    assert.equal(autoId("Mal formé"), undefined);
  });
  test("introuvable : 404", async () => {
    assert.equal((await boss.get("/marketing/automatisations/999999")).status, 404);
    assert.equal((await boss.get("/marketing/automatisations/abc")).status, 404);
  });
});

describe("éditeur", () => {
  let id, tplId;
  before(async () => { id = autoId("Bienvenue élève"); tplId = await createTemplate(boss, "Bienvenue transac", "transactional"); });

  test("page : données JSON échappées, modèles du bon type, listes, segments, catalogue ; script servi", async () => {
    await post(boss, "/marketing/automatisations", { name: "</script><img src=x onerror=alert(1)>", kind: "marketing", trigger_event: "contact.created" });
    const hostile = autoId("</script><img src=x onerror=alert(1)>");
    const page = await boss.get(`/marketing/automatisations/${hostile}`);
    assert.doesNotMatch(page.text, /<img src=x onerror/);
    assert.equal(data(page.text).automation.name, "</script><img src=x onerror=alert(1)>");
    const d = data((await boss.get(`/marketing/automatisations/${id}`)).text);
    assert.ok(d.templates.every((t) => t.kind === "transactional"), "seuls les modèles du type du scénario");
    assert.ok(d.templates.some((t) => t.id === tplId));
    assert.ok(d.triggers["lms.course_completed"].filters.length === 1);
    assert.equal((await boss.get("/js/automation-flow.js")).status, 200);
    assert.match(page.text, /id="au-flow"/);
    assert.match(page.text, /id="au-panel"/);
    assert.doesNotMatch(page.text, /id="au-steps"/, "l'ancienne liste d'étapes est remplacée par le canevas");
  });
  test("canevas : une automatisation sans canvas enregistré en reçoit un calculé ; round-trip nœuds/arêtes", async () => {
    const first = data((await boss.get(`/marketing/automatisations/${id}`)).text);
    assert.ok(first.canvas && Array.isArray(first.canvas.nodes) && Array.isArray(first.canvas.edges), "canvas calculé à la volée");
    assert.ok(first.canvas.nodes.some((n) => n.type === "trigger"));
    const canvas = {
      nodes: [
        { id: "trigger", type: "trigger", data: { triggerEvent: "lms.user_registered", triggerFilter: {} }, position: { x: 0, y: 0 } },
        { id: "n1", type: "email", data: { templateId: tplId, trackClicks: false }, position: { x: 300, y: 0 } },
      ],
      edges: [{ id: "e1", source: "trigger", target: "n1" }],
    };
    const saved = await boss.postJson(`/marketing/automatisations/${id}`, { name: "Bienvenue élève", triggerEvent: "lms.user_registered", triggerFilter: {}, canvas });
    assert.equal(saved.status, 200);
    const reloaded = data((await boss.get(`/marketing/automatisations/${id}`)).text);
    assert.equal(reloaded.canvas.nodes.length, 2);
    assert.equal(reloaded.automation.steps.length, 1);
    assert.equal(reloaded.automation.steps[0].type, "email");
  });
  test("condition construite ici (ET/OU) : catalogue fourni au client, round-trip d'une définition personnalisée sans segment enregistré", async () => {
    const payload = data((await boss.get(`/marketing/automatisations/${id}`)).text);
    assert.ok(Array.isArray(payload.segmentCatalog) && payload.segmentCatalog.length, "catalogue de champs fourni");
    assert.ok(payload.segmentCatalog.some((f) => f.field === "email" && f.cmps.some((c) => c.cmp === "contains")));
    const canvas = {
      nodes: [
        { id: "trigger", type: "trigger", data: { triggerEvent: "lms.user_registered", triggerFilter: {} }, position: { x: 0, y: 0 } },
        { id: "n1", type: "condition", data: { check: "segment", definition: { op: "and", rules: [{ field: "email", cmp: "contains", value: "ex.fr" }] } }, position: { x: 300, y: 0 } },
        { id: "n2", type: "end", data: {}, position: { x: 600, y: 0 } },
      ],
      edges: [{ id: "e1", source: "trigger", target: "n1" }, { id: "e2", source: "n1", target: "n2", sourceHandle: "true" }],
    };
    const saved = await boss.postJson(`/marketing/automatisations/${id}`, { name: "Bienvenue élève", triggerEvent: "lms.user_registered", triggerFilter: {}, canvas });
    assert.equal(saved.status, 200);
    const reloaded = data((await boss.get(`/marketing/automatisations/${id}`)).text);
    const cond = reloaded.automation.steps.find((s) => s.type === "condition");
    assert.deepEqual(cond.definition, { op: "and", rules: [{ field: "email", cmp: "contains", value: "ex.fr" }] });
    const condNode = reloaded.canvas.nodes.find((n) => n.type === "condition");
    assert.equal(condNode.data._segmentId, undefined, "aucun segment enregistré n'est lié à une condition construite ici");
    // définition invalide (champ inexistant) : refusée avec le numéro d'étape, comme toute autre erreur de validation
    const bad = await boss.postJson(`/marketing/automatisations/${id}`, {
      canvas: { nodes: [canvas.nodes[0], { ...canvas.nodes[1], data: { check: "segment", definition: { op: "and", rules: [{ field: "n_importe_quoi", cmp: "eq", value: "x" }] } } }, canvas.nodes[2]], edges: canvas.edges },
    });
    assert.equal(bad.status, 400);
  });
  test("déclencheur personnalisé depuis le nœud déclencheur (enregistrement JSON du canevas)", async () => {
    const ok = await boss.postJson(`/marketing/automatisations/${id}`, { name: "Bienvenue élève", triggerEvent: "webhook.recu", triggerFilter: {}, steps: [] });
    assert.equal(ok.status, 200);
    assert.equal(sql("SELECT trigger_event FROM mk_automations WHERE id = ?", id)[0].trigger_event, "webhook.recu");
    const badTrigger = await boss.postJson(`/marketing/automatisations/${id}`, { triggerEvent: "Webhook Invalide!", triggerFilter: {}, steps: [] });
    assert.equal(badTrigger.status, 400);
    assert.match(JSON.parse(badTrigger.text).error, /Déclencheur inconnu/);
    // remis dans l'état attendu par les tests suivants
    await boss.postJson(`/marketing/automatisations/${id}`, { triggerEvent: "lms.user_registered", triggerFilter: {}, steps: [] });
  });
  test("plusieurs déclencheurs (jusqu'à 3) depuis le nœud déclencheur : payload fourni au client, aller-retour complet", async () => {
    const before = data((await boss.get(`/marketing/automatisations/${id}`)).text);
    assert.equal(before.automation.triggers.length, 1, "un seul déclencheur par défaut, comme avant cette phase");
    const ok = await boss.postJson(`/marketing/automatisations/${id}`, {
      name: "Bienvenue élève",
      triggers: [{ event: "lms.user_registered", filter: {} }, { event: "lms.order_completed", filter: {} }, { event: "demo.custom_event", filter: {} }],
      steps: [],
    });
    assert.equal(ok.status, 200);
    const reloaded = data((await boss.get(`/marketing/automatisations/${id}`)).text);
    assert.deepEqual(reloaded.automation.triggers.map((t) => t.event), ["lms.user_registered", "lms.order_completed", "demo.custom_event"]);
    assert.equal(sql("SELECT trigger_event FROM mk_automations WHERE id = ?", id)[0].trigger_event, "lms.user_registered", "la colonne miroir reflète le 1er");
    // un 4e déclencheur : refusé
    const tooMany = await boss.postJson(`/marketing/automatisations/${id}`, { triggers: [{ event: "a.b" }, { event: "c.d" }, { event: "e.f" }, { event: "g.h" }], steps: [] });
    assert.equal(tooMany.status, 400);
    // remis dans l'état attendu par les tests suivants
    await boss.postJson(`/marketing/automatisations/${id}`, { triggerEvent: "lms.user_registered", triggerFilter: {}, steps: [] });
  });
  test("enregistrement JSON : étapes validées et normalisées ; erreur avec le numéro d'étape", async () => {
    const ok = await boss.postJson(`/marketing/automatisations/${id}`, { triggerEvent: "lms.user_registered", steps: [{ type: "email", templateId: tplId, junk: 1 }, { type: "wait", amount: 1, unit: "days" }, { type: "add_tag", tag: "Élève" }] });
    assert.equal(ok.status, 200);
    assert.deepEqual(JSON.parse(sql("SELECT steps FROM mk_automations WHERE id = ?", id)[0].steps)[0], { type: "email", templateId: tplId, trackClicks: false });
    const bad = await boss.postJson(`/marketing/automatisations/${id}`, { steps: [{ type: "wait", amount: 0, unit: "days" }] });
    assert.equal(bad.status, 400);
    assert.match(JSON.parse(bad.text).error, /Étape 1/);
    assert.equal(JSON.parse(sql("SELECT steps FROM mk_automations WHERE id = ?", id)[0].steps).length, 3, "l'ancienne version est intacte");
  });
  test("contrôle avant activation affiché ; activation refusée sans étapes ; réussie sinon", async () => {
    await post(boss, "/marketing/automatisations", { name: "Vide", kind: "transactional", trigger_event: "lms.order_completed" });
    const empty = autoId("Vide");
    assert.match((await boss.get(`/marketing/automatisations/${empty}`)).text, /aucune étape/i);
    assert.match((await post(boss, `/marketing/automatisations/${empty}/activer`, {})).text, /aucune étape/i);
    assert.equal(sql("SELECT status FROM mk_automations WHERE id = ?", empty)[0].status, "draft");
    const page = await boss.get(`/marketing/automatisations/${id}`);
    assert.match(page.text, /Contrôle avant activation/);
    assert.match(page.text, /Fournisseur « console »/);
    const r = await post(boss, `/marketing/automatisations/${id}/activer`, {});
    assert.match(r.text, /Scénario activé/);
    assert.equal(sql("SELECT status FROM mk_automations WHERE id = ?", id)[0].status, "active");
    assert.equal(sql("SELECT COUNT(*) n FROM mk_campaigns WHERE automation_id = ?", id)[0].n, 1);
  });
  test("scénario actif : modification refusée, suppression refusée ; pause → modification → réactivation obligatoire", async () => {
    const edit = await boss.postJson(`/marketing/automatisations/${id}`, { steps: [{ type: "end" }] });
    assert.equal(edit.status, 400);
    assert.match(JSON.parse(edit.text).error, /pause/i);
    assert.match((await post(boss, `/marketing/automatisations/${id}/supprimer`, {})).text, /ne se supprime pas/);
    assert.match((await post(boss, `/marketing/automatisations/${id}/pause`, {})).text, /pause/i);
    assert.equal((await boss.postJson(`/marketing/automatisations/${id}`, { steps: [{ type: "add_tag", tag: "x" }] })).status, 200);
    assert.match((await post(boss, `/marketing/automatisations/${id}/reprendre`, {})).text, /réactivez/i);
    assert.match((await post(boss, `/marketing/automatisations/${id}/activer`, {})).text, /Scénario activé/);
  });
  test("passages et statistiques affichés", async () => {
    run("INSERT INTO mk_contacts (organization_id, email) VALUES (1, 'passage@ex.fr')");
    const cid = sql("SELECT id FROM mk_contacts WHERE email = 'passage@ex.fr'")[0].id;
    run("INSERT INTO mk_automation_runs (organization_id, automation_id, contact_id, steps, wake_at, entered_at, status) VALUES (1, ?, ?, '[]', 0, 0, 'completed')", id, cid);
    const page = await boss.get(`/marketing/automatisations/${id}`);
    assert.match(page.text, /passage@ex\.fr/);
    assert.match(page.text, /Statistiques/);
    assert.match(page.text, /Voir le journal/);
  });
  test("journal d'un passage : étapes franchies affichées, isolation, introuvable → 404", async () => {
    run("INSERT INTO mk_contacts (organization_id, email) VALUES (1, 'journal@ex.fr')");
    const cid = sql("SELECT id FROM mk_contacts WHERE email = 'journal@ex.fr'")[0].id;
    const steps = JSON.stringify([{ type: "email", templateId: tplId }, { type: "wait", amount: 1, unit: "days" }, { type: "end" }]);
    run("INSERT INTO mk_automation_runs (organization_id, automation_id, contact_id, steps, wake_at, entered_at, finished_at, status, step_index) VALUES (1, ?, ?, ?, 0, 1000, 2000, 'completed', 2)", id, cid, steps);
    const runId = sql("SELECT id FROM mk_automation_runs WHERE contact_id = ?", cid)[0].id;
    run("INSERT INTO mk_automation_log (organization_id, run_id, step_index, action, detail, at) VALUES (1, ?, 0, 'sent', 'message 42', 1000)", runId);
    run("INSERT INTO mk_automation_log (organization_id, run_id, step_index, action, detail, at) VALUES (1, ?, 1, 'wait', '1 days', 1000)", runId);
    const page = await boss.get(`/marketing/automatisations/${id}/passages/${runId}`);
    assert.equal(page.status, 200);
    assert.match(page.text, /journal@ex\.fr/);
    assert.match(page.text, /E-mail envoyé/);
    assert.match(page.text, /message 42/);
    assert.equal((await boss.get(`/marketing/automatisations/${id}/passages/999999`)).status, 404);
    assert.equal((await boss.get(`/marketing/automatisations/${id}/passages/abc`)).status, 404);
    const other = await member("viewer");
    assert.equal((await other.get(`/marketing/automatisations/${id}/passages/${runId}`)).status, 200, "lecteur : consultation autorisée");
  });
  test("contrôle avant activation : erreur de modèle liée à l'étape (numéro + identifiant, bouton « voir sur le canevas »)", async () => {
    const throwawayId = await createTemplate(boss, "Jetable", "transactional");
    await post(boss, "/marketing/automatisations", { name: "Modèle fantôme", kind: "transactional", trigger_event: "lms.user_registered" });
    const orphanId = autoId("Modèle fantôme");
    await boss.postJson(`/marketing/automatisations/${orphanId}`, { steps: [{ type: "email", templateId: throwawayId }] });
    run("DELETE FROM mk_templates WHERE id = ?", throwawayId);
    const page = await boss.get(`/marketing/automatisations/${orphanId}`);
    assert.match(page.text, /Étape 1 \(e-mail\)/);
    assert.match(page.text, new RegExp(`data-au-goto-template="${throwawayId}"`));
  });
  test("dupliquer : nouveau brouillon indépendant, jamais actif, nom rendu unique automatiquement", async () => {
    const dup = await post(boss, `/marketing/automatisations/${id}/dupliquer`, {});
    assert.match(dup.text, /dupliqué/i);
    const copyId = autoId("Bienvenue élève (copie)");
    assert.ok(copyId, "la copie porte le nom d'origine + « (copie) »");
    const copy = data((await boss.get(`/marketing/automatisations/${copyId}`)).text);
    assert.equal(copy.readOnly, false, "toujours un brouillon, jamais verrouillé");
    assert.equal(sql("SELECT status FROM mk_automations WHERE id = ?", copyId)[0].status, "draft");
    assert.equal(sql("SELECT active_steps FROM mk_automations WHERE id = ?", copyId)[0].active_steps, "", "jamais les campagnes système de l'original");
    // dupliquer une seconde fois : le nom se numérote pour rester unique
    await post(boss, `/marketing/automatisations/${id}/dupliquer`, {});
    assert.ok(autoId("Bienvenue élève (copie 2)"), "un deuxième doublon se numérote");
  });
  test("pause puis suppression d'un scénario", async () => {
    await post(boss, `/marketing/automatisations/${id}/pause`, {});
    assert.match((await post(boss, `/marketing/automatisations/${id}/supprimer`, {})).text, /supprimé/i);
    assert.equal(autoId("Bienvenue élève"), undefined);
    assert.equal(sql("SELECT COUNT(*) n FROM mk_campaigns WHERE kind = 'automation'")[0].n, 0);
  });
});

describe("événements et pont", () => {
  test("page : état des curseurs, événements récents", async () => {
    const r = await boss.get("/marketing/evenements");
    assert.equal(r.status, 200);
    assert.match(r.text, /Pont KOLAKISA/);
    assert.match(r.text, /Synchroniser maintenant/);
  });
  test("synchronisation manuelle : réservée aux administrateurs, initialise puis lit les nouveautés", async () => {
    const ed = await member("editor");
    assert.equal((await ed.post("/marketing/evenements/synchroniser", {})).status, 403);
    const first = await post(boss, "/marketing/evenements/synchroniser", {});
    assert.match(first.text, /Synchronisation terminée/);
    run("INSERT INTO users (username, email, password_hash, role) VALUES ('lecteur-pont', 'pont@ex.fr', 'x', 'etudiant')");
    const second = await post(boss, "/marketing/evenements/synchroniser", {});
    assert.match(second.text, /1 événement/);
    assert.equal(sql("SELECT COUNT(*) n FROM mk_events WHERE name = 'lms.user_registered' AND email = 'pont@ex.fr'")[0].n, 1);
    const page = await boss.get("/marketing/evenements");
    assert.match(page.text, /lms\.user_registered/);
    assert.match(page.text, /pont@ex\.fr/);
  });
});

describe("parcours réel avec le worker : inscription sur le site → e-mail de scénario", () => {
  let e2e, client;
  before(async () => {
    e2e = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "", MARKETING_WORKER: "on" });
    client = await loginInstructor(e2e);
  });
  after(() => e2e.stop());
  const q = (sql, ...a) => { const db = e2e.db(); const r = db.prepare(sql).all(...a); db.close(); return r; };

  test("un élève s'inscrit → le pont voit l'événement → le scénario transactionnel envoie l'e-mail", async () => {
    const tplId = Number((await client.post("/marketing/modeles", { name: "Bienvenue e2e", starter: "blank", kind: "transactional" })).location.match(/(\d+)$/)[1]);
    const created = await client.post("/marketing/automatisations", { name: "Bienvenue e2e", kind: "transactional", trigger_event: "lms.user_registered" });
    const id = Number(created.location.match(/(\d+)$/)[1]);
    assert.equal((await client.postJson(`/marketing/automatisations/${id}`, { steps: [{ type: "email", templateId: tplId }] })).status, 200);
    assert.match((await follow(client, await client.post(`/marketing/automatisations/${id}/activer`, {}))).text, /Scénario activé/);
    // le pont s'est initialisé au démarrage du worker : on attend les curseurs, puis on inscrit l'élève
    for (let i = 0; i < 40 && q("SELECT COUNT(*) n FROM mk_bridge_cursors")[0].n < 6; i++) await new Promise((r) => setTimeout(r, 250));
    assert.equal(q("SELECT COUNT(*) n FROM mk_bridge_cursors")[0].n, 6);
    const student = new Client(e2e.base);
    const reg = await student.post("/inscription", { username: "eleve-e2e", email: "eleve-e2e@test.local", password: "MotDePasseEleve123" });
    assert.equal(reg.status, 302);
    await follow(client, await client.post("/marketing/evenements/synchroniser", {}));
    let msgs = [];
    for (let i = 0; i < 60 && !msgs.length; i++) {
      msgs = q("SELECT status, provider, subject FROM mk_messages WHERE email = 'eleve-e2e@test.local'");
      if (!msgs.length) await new Promise((r) => setTimeout(r, 250));
    }
    assert.equal(msgs.length, 1);
    assert.deepEqual([msgs[0].status, msgs[0].provider], ["sent", "console"]);
    assert.equal(q("SELECT status FROM mk_automation_runs WHERE automation_id = ?", id)[0].status, "completed");
    assert.equal(q("SELECT status FROM mk_contacts WHERE email = 'eleve-e2e@test.local'")[0].status, "unknown", "un e-mail transactionnel ne donne aucun consentement");
  });
  test("l'historique n'a rien déclenché : les comptes existants avant l'activation n'ont reçu aucun e-mail", async () => {
    assert.equal(q("SELECT COUNT(*) n FROM mk_messages WHERE email = 'prof@test.local'")[0].n, 0);
    assert.equal(q("SELECT COUNT(*) n FROM mk_messages")[0].n, 1);
  });
});
