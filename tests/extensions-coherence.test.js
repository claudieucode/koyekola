// Cohérence des cinq écrans Extensions : une seule source de vérité pour l'état d'un site ; site courant retenu ; compteurs réels ; historique filtrable et paginé ; erreurs distinguées des états vides.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, loginInstructor } = require("./helpers");

describe("Extensions : cohérence entre les écrans", () => {
  let srv, boss, db, A, B;
  const X = "/marketing/site-web/extensions";
  const on = (site, ext) => (db.prepare("SELECT enabled e FROM mk_site_modules WHERE site_id = ? AND module = ?").get(site, ext) || {}).e === 1;
  const names = (html) => [...html.matchAll(/data-xc-item data-name="([^"]*)"/g)].map((m) => m[1]);
  const tabCounts = (html) => { const m = (label) => new RegExp(`${label}\\s*<span class="xc-badge">(\\d+)</span>`).exec(html); return { all: Number(m("Toutes les extensions")[1]), on: Number(m("Activées")[1]), off: Number(m("Désactivées")[1]) }; };
  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv); db = srv.db();
    const mk = async (name) => Number((await boss.post("/marketing/site-web/sites", { name })).location.match(/sites\/(\d+)/)[1]);
    A = await mk("1 Premier"); B = await mk("Zèbre"); // « 1 Premier » vient en premier par ordre alphabétique
  });
  after(() => { db.close(); return srv.stop(); });

  test("Commerce activé sur le site B : « Activées » le montre pour B, pas pour A ; compteurs justes ; désactivées complémentaires", async () => {
    assert.equal((await boss.post(`${X}/sites/${B}/commerce/activer`, { retour: "catalogue" })).status, 302);
    const onB = await boss.get(`${X}/activees?site=${B}`), offB = await boss.get(`${X}/desactivees?site=${B}`), onA = await boss.get(`${X}/activees?site=${A}`);
    assert.deepEqual(names(onB.text), ["kolakisa commerce"]);
    assert.equal(names(offB.text).includes("kolakisa commerce"), false); assert.equal(names(offB.text).length, 5);
    assert.deepEqual(tabCounts(onB.text), { all: 6, on: 1, off: 5 });
    assert.match(onA.text, /Aucune extension activée sur « 1 Premier »/, "vrai état vide pour A");
    assert.match(onA.text, /Zèbre/, "l'état vide indique où des extensions sont activées");
    assert.equal(on(A, "commerce"), false);
  });

  test("le site courant est retenu : sans ?site=, l'écran revient sur le dernier site choisi (plus de « 0 sur 0 » sur un site arbitraire)", async () => {
    await boss.get(`${X}/activees?site=${B}`);
    const again = await boss.get(`${X}/activees`);
    assert.deepEqual(names(again.text), ["kolakisa commerce"]);
    assert.match(again.text, new RegExp(`<option value="${B}" selected`));
  });

  test("avec une session neuve : le premier site ayant des extensions activées est choisi", async () => {
    const fresh = await loginInstructor(srv);
    const r = await fresh.get(`${X}/activees`);
    assert.deepEqual(names(r.text), ["kolakisa commerce"]);
  });

  test("désactivation : retrait immédiat de « Activées », réapparition en « Désactivées », compteurs recalculés, historique exact, données conservées, autre site inchangé", async () => {
    assert.equal((await boss.post(`${X}/sites/${B}/commerce/desactiver`, { confirmer: "1", retour: "catalogue" })).status, 302);
    const onB = await boss.get(`${X}/activees?site=${B}`);
    assert.match(onB.text, /Aucune extension activée sur « Zèbre »/);
    assert.equal(names((await boss.get(`${X}/desactivees?site=${B}`)).text).length, 6);
    assert.deepEqual(tabCounts((await boss.get(`${X}?site=${B}`)).text), { all: 6, on: 0, off: 6 });
    assert.equal(db.prepare("SELECT COUNT(*) n FROM mk_site_modules WHERE site_id = ? AND module = 'commerce'").get(B).n, 1);
    const ev = db.prepare("SELECT action FROM mk_extension_events WHERE site_id = ? AND extension = 'commerce' ORDER BY id").all(B).map((r) => r.action);
    assert.deepEqual(ev, ["enable", "disable"]);
    assert.equal(on(A, "commerce"), false);
  });

  test("historique : filtres (extension, opération, période, recherche), utilisateur, pagination, réinitialisation ; rien d'inventé", async () => {
    const all = await boss.get(`${X}/historique`);
    assert.match(all.text, /name="operation"/); assert.match(all.text, /name="du"/); assert.match(all.text, /name="q"/); assert.match(all.text, /Réinitialiser/);
    assert.match(all.text, /2 opérations/);
    assert.match(all.text, /Utilisateur/);
    const dis = await boss.get(`${X}/historique?operation=disable`);
    assert.match(dis.text, /1 opération/); assert.match(dis.text, /Désactivée/);
    const none = await boss.get(`${X}/historique?du=2999-01-01`);
    assert.match(none.text, /Aucune opération ne correspond/);
    const q = await boss.get(`${X}/historique?q=${encodeURIComponent("zèbre")}`); assert.match(q.text, /2 opérations/);
    const q2 = await boss.get(`${X}/historique?q=nexistepas`); assert.match(q2.text, /Aucune opération ne correspond/);
    const bad = await boss.get(`${X}/historique?operation=%27%3B--&du=pasunedate&page=-4`); assert.equal(bad.status, 200);
    // pagination : 30 opérations réelles supplémentaires (activations/désactivations alternées) → 2 pages
    for (let i = 0; i < 14; i++) { await boss.post(`${X}/sites/${A}/sms/activer`, {}); await boss.post(`${X}/sites/${A}/sms/desactiver`, { confirmer: "1" }); }
    const p1 = await boss.get(`${X}/historique`); assert.match(p1.text, /Page 1 sur 2/);
    const p2 = await boss.get(`${X}/historique?page=2`); assert.match(p2.text, /Page 2 sur 2/);
  });

  test("gestion : colonnes, dernière modification, actions sur une seule ligne ; confirmation avant désactivation", async () => {
    const g = await boss.get(`${X}/gestion?site=${B}`);
    for (const re of [/Catégorie/, /État sur ce site/, /Dépendances/, /Dernière modification/, /Jamais modifiée/, /class="xg-actions"/]) assert.match(g.text, re);
    const rowB = g.text.split("<tr").find((c) => c.includes("Kolakisa Commerce"));
    assert.match(rowB, /\d\d\/\d\d\/\d{4} \d\d:\d\d/, "date au format français");
    await boss.post(`${X}/sites/${B}/lms/activer`, {});
    const c = await boss.get(`${X}/gestion?site=${B}&extension=lms&confirmer=lms`); assert.match(c.text, /Confirmer la désactivation/);
  });

  test("permissions : une personne limitée à un site n'accède ni à l'écran ni aux actions", async () => {
    const { newStudent } = require("./helpers");
    const limited = await newStudent(srv);
    const idOf = db.prepare("SELECT id FROM users WHERE email = ?").get(limited.email).id;
    db.prepare("INSERT INTO mk_site_members (site_id, user_id, role) VALUES (?, ?, 'admin')").run(A, idOf);
    assert.ok([302, 403].includes((await limited.get(`${X}/activees?site=${A}`)).status));
    const r = await limited.post(`${X}/sites/${A}/commerce/activer`, {});
    assert.ok([302, 403].includes(r.status)); assert.equal(on(A, "commerce"), false);
  });
});
