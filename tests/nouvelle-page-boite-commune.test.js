// Incident : la boîte « Nouvelle page » (page vierge, modèles, mise en page) n'existait que sur le site principal ; les sites secondaires avaient un mini-formulaire à part.
// Désormais UNE boîte (partials/new-page-dialog) sert la liste centrale et l'écran Pages de chaque espace (principal compris) ; le site est celui de l'espace, vérifié côté serveur.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, Client, loginInstructor, newStudent } = require("./helpers");

describe("boîte « Nouvelle page » commune à tous les sites", () => {
  let srv, boss, db, A, B, adminA, viewerA, adminB, anon;
  const SP = "/marketing/site-web/sites", PR = "/marketing/site-web/principal";
  const one = (sql, ...a) => db.prepare(sql).get(...a);
  const mkSite = async (name) => Number(String((await boss.post(SP, { name })).location).match(/sites\/(\d+)/)[1]);
  const idOf = (c) => one("SELECT id FROM users WHERE email = ?", c.email).id;
  const member = async (site, role) => { const c = await newStudent(srv); db.prepare("INSERT INTO mk_site_members (site_id, user_id, role) VALUES (?, ?, ?)").run(site, idOf(c), role); return c; };
  const dialog = (html) => (html.match(/<dialog[^>]*id="nouvelle"[\s\S]*?<\/dialog>/) || [""])[0];
  const choices = (d) => ({ radios: [...d.matchAll(/<input type="radio" name="(template|layoutMode)" value="([^"]*)"/g)].map((m) => `${m[1]}=${m[2]}`), format: /name="layoutFormat"/.test(d), locked: /name="layoutLocked"/.test(d), submit: /Créer et ouvrir l’éditeur/.test(d) });
  const hiddenSite = (d) => (d.match(/<input type="hidden" name="site_id" value="(\d+)"/) || [])[1] || null;
  const pageRow = (name) => one("SELECT id, site_id, kind, slug FROM mk_landing_pages WHERE name = ?", name);

  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv); db = srv.db(); anon = new Client(srv.base);
    A = await mkSite("Alpha Boîte"); B = await mkSite("Bravo Boîte");
    adminA = await member(A, "admin"); viewerA = await member(A, "viewer"); adminB = await member(B, "admin");
  });
  after(() => { db.close(); return srv.stop(); });

  test("même boîte, mêmes choix (page vierge, modèles, mise en page) : liste centrale, site principal, sites secondaires", async () => {
    const central = choices(dialog((await boss.get("/marketing/pages")).text));
    assert.ok(central.radios.includes("template=") && central.radios.includes("layoutMode=free") && central.radios.includes("layoutMode=guided") && central.format && central.locked && central.submit);
    assert.ok(central.radios.filter((r) => r.startsWith("template=")).length > 1, "des modèles sont proposés");
    for (const [label, url] of [["principal", `${PR}/pages`], ["Alpha", `${SP}/${A}/pages`], ["Bravo", `${SP}/${B}/pages`]]) {
      const r = await boss.get(url); assert.equal(r.status, 200, label);
      const d = dialog(r.text); assert.ok(d, `${label} : la boîte est présente`);
      assert.deepEqual(choices(d), central, `${label} : mêmes choix que la liste centrale`);
      assert.doesNotMatch(r.text, /id="cms-create-field"/, `${label} : plus de mini-formulaire à part`);
      assert.match(r.text, /data-mk-modal-open="nouvelle">Ajouter une page</, `${label} : bouton d'ouverture`);
    }
  });
  test("le site de l'espace est transmis en champ caché (Alpha → Alpha, Bravo → Bravo), pas de choix de site ; le principal n'en transmet aucun", async () => {
    assert.equal(hiddenSite(dialog((await boss.get(`${SP}/${A}/pages`)).text)), String(A));
    assert.equal(hiddenSite(dialog((await boss.get(`${SP}/${B}/pages`)).text)), String(B));
    const p = dialog((await boss.get(`${PR}/pages`)).text); assert.equal(hiddenSite(p), null); assert.doesNotMatch(p, /name="site_id"/);
    assert.match(dialog((await boss.get("/marketing/pages")).text), /<select id="lp-new-site" name="site_id">/, "la liste centrale garde son sélecteur de site");
  });
  test("création depuis un site secondaire (champs de la boîte) : bon site, éditeur ouvert dans le cadre du site, enregistrement et rechargement", async () => {
    const r = await adminA.post("/marketing/pages", { name: "Page Boîte A", ouvrir: "editeur", template: "", layoutMode: "free", site_id: String(A) });
    const row = pageRow("Page Boîte A"); assert.ok(row); assert.equal(row.site_id, A); assert.equal(row.kind, "page");
    assert.equal(r.location, `/marketing/pages/${row.id}/editeur?retour=pages`);
    const ed = await adminA.get(r.location); assert.equal(ed.status, 200); assert.match(ed.text, new RegExp(`href="${SP}/${A}/pages"`), "retour de l'éditeur vers les pages du site");
    const screen = await adminA.get(`/marketing/pages/${row.id}`); assert.match(screen.text, /mk-site-banner-name[^>]*>Alpha Boîte/);
    const save = await adminA.post(`/marketing/pages/${row.id}`, { name: "Page Boîte A", slug: "boite-a-modifiee", site_id: String(B), action: "save" });
    assert.equal(save.location, `/marketing/pages/${row.id}`);
    const after = pageRow("Page Boîte A"); assert.equal(after.slug, "boite-a-modifiee", "modification enregistrée"); assert.equal(after.site_id, A, "un site_id forgé ne déplace pas la page");
    const reload = await adminA.get(`${SP}/${A}/pages`); assert.match(reload.text, /Page Boîte A/); assert.match(reload.text, /boite-a-modifiee/, "persistance après rechargement");
    assert.doesNotMatch((await adminB.get(`${SP}/${B}/pages`)).text, /Page Boîte A/, "Bravo ne voit pas la page d'Alpha");
  });
  test("modèle et mise en page guidée choisis dans la boîte d'un site secondaire : appliqués, dans le bon site", async () => {
    const tpl = [...dialog((await boss.get(`${SP}/${A}/pages`)).text).matchAll(/name="template" value="([a-z0-9_-]+)"/g)].map((m) => m[1])[0];
    assert.ok(tpl, "un modèle est proposé");
    await adminA.post("/marketing/pages", { name: "Page Modèle A", ouvrir: "editeur", template: tpl, layoutMode: "guided", layoutFormat: "standard", site_id: String(A) });
    assert.equal(pageRow("Page Modèle A").site_id, A);
    await adminA.post("/marketing/pages", { name: "Page Guidée A", ouvrir: "editeur", template: "", layoutMode: "guided", layoutFormat: "standard", layoutLocked: "1", site_id: String(A) });
    assert.equal(pageRow("Page Guidée A").site_id, A);
  });
  test("création depuis le site principal : sans rattachement à un site, éditeur ouvert", async () => {
    const r = await boss.post("/marketing/pages", { name: "Page Boîte Principal", ouvrir: "editeur", template: "", layoutMode: "free" });
    const row = pageRow("Page Boîte Principal"); assert.equal(row.site_id, null); assert.equal(r.location, `/marketing/pages/${row.id}/editeur?retour=pages`);
    assert.match((await boss.get(`${PR}/pages`)).text, /Page Boîte Principal/);
  });
  test("échec de création (nom déjà pris) dans un site : retour à la liste de CE site, la boîte se rouvre", async () => {
    const r = await adminA.post("/marketing/pages", { name: "Page Boîte A", ouvrir: "editeur", template: "", site_id: String(A) });
    assert.equal(r.location, `${SP}/${A}/pages`);
    const page = await adminA.get(r.location); assert.match(page.text, /data-mk-modal-reopen="nouvelle"/);
  });
  test("isolation : pas de boîte pour un lecteur, aucune création/écriture dans un autre site, anonyme refusé", async () => {
    assert.doesNotMatch((await viewerA.get(`${SP}/${A}/pages`)).text, /<dialog[^>]*id="nouvelle"/, "lecteur : pas de création");
    assert.equal((await viewerA.post("/marketing/pages", { name: "Par lecteur boîte", ouvrir: "editeur", site_id: String(A) })).status, 403);
    assert.equal((await adminB.get(`${SP}/${A}/pages`)).status, 403);
    const forged = await adminB.post("/marketing/pages", { name: "Intrus boîte", ouvrir: "editeur", site_id: String(A) }); assert.ok([302, 403, 404].includes(forged.status));
    assert.equal(pageRow("Intrus boîte"), undefined); assert.equal(pageRow("Par lecteur boîte"), undefined);
    const id = pageRow("Page Boîte A").id;
    assert.ok([403, 404].includes((await adminB.post(`/marketing/pages/${id}`, { name: "Piratée", slug: "pirate", action: "save" })).status)); assert.equal(pageRow("Page Boîte A").slug, "boite-a-modifiee");
    const a = await anon.post("/marketing/pages", { name: "Anonyme boîte", site_id: String(A) }); assert.equal(a.status, 302); assert.match(a.location, /connexion/);
  });
  test("la fiche d'un site renvoie vers la même boîte (plus de formulaire concurrent)", async () => {
    const html = (await boss.get(`${SP}/${A}/reglages`)).text;
    assert.match(html, new RegExp(`href="${SP}/${A}/pages#nouvelle"`)); assert.doesNotMatch(html, /id="site-new-page"/);
  });
});
