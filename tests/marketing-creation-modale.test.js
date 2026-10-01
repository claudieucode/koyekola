// Passe UI/UX (suite du §35) — création dans une fenêtre modale sur Automatisations, Formulaires, Webhooks et Clés
// d'API, comme Listes/Étiquettes/Propriétés : plus de formulaire de création affiché en permanence sur la page.
// Même composant partagé (dialog data-mk-modal), ouvrable par le bouton du bandeau (ancre d'URL) ou de l'état vide.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const { startServer, loginInstructor, newStudent } = require("./helpers");
const { TEST_KEY } = require("./marketing-helpers");

let srv, boss;
const run = (query, ...args) => { const db = srv.db(); db.prepare(query).run(...args); db.close(); };
const member = async (role) => {
  const c = await newStudent(srv);
  run("INSERT INTO mk_org_members (organization_id, user_id, role) VALUES (1, (SELECT id FROM users WHERE email = ?), ?)", c.email, role);
  return c;
};

const PAGES = [
  { url: "/marketing/automatisations", id: "nouveau", action: "/marketing/automatisations", primary: "Nouveau scénario" },
  { url: "/marketing/formulaires", id: "nouveau", action: "/marketing/formulaires", primary: "Nouveau formulaire" },
  { url: "/marketing/webhooks", id: "nouveau", action: "/marketing/webhooks", primary: "Nouveau webhook" },
  { url: "/marketing/api", id: "nouvelle", action: "/marketing/api", primary: "Nouvelle clé" },
];
// Le formulaire de création, où qu'il soit dans la page
const createForm = (html, action) => new RegExp(`<form[^>]*action="${action.replace(/\//g, "\\/")}"[^>]*method="post"|<form[^>]*method="post"[^>]*action="${action.replace(/\//g, "\\/")}"`).exec(html);
const dialogOf = (html, id) => new RegExp(`<dialog class="mk-dialog mk-modal[^"]*" id="${id}" data-mk-modal data-mk-modal-hash="${id}"[\\s\\S]*?<\\/dialog>`).exec(html)?.[0];

before(async () => {
  srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test" });
  boss = await loginInstructor(srv);
});
after(() => srv.stop());

describe("création dans une fenêtre modale", () => {
  for (const p of PAGES) {
    test(`${p.url} : formulaire de création uniquement dans la modale, bouton du bandeau et de l'état vide`, async () => {
      const html = (await boss.get(p.url)).text;
      const dialog = dialogOf(html, p.id);
      assert.ok(dialog, "modale de création présente");
      assert.ok(createForm(dialog, p.action), "le formulaire est dans la modale");
      assert.equal(createForm(html.replace(dialog, ""), p.action), null, "aucun formulaire de création hors de la modale");
      assert.match(html, new RegExp(`<a class="btn btn-primary btn-sm mk-primary" href="${p.url}#${p.id}">${p.primary}</a>`), "bouton du bandeau");
      assert.match(html, /class="mk-empty"[\s\S]*?data-mk-modal-open="/, "l'état vide propose la création");
      assert.match(dialog, /data-mk-modal-close/, "bouton Annuler");
    });
  }
  test("après une erreur de création, la modale se rouvre avec le message", async () => {
    const r = await boss.post("/marketing/webhooks", { name: "", url: "pas-une-adresse" });
    const html = (await boss.get(r.location)).text;
    assert.match(html, /mk-flash-error/);
    assert.match(html, /<span hidden data-mk-modal-reopen="nouveau"><\/span>/);
  });
  test("webhooks : événements présentés en grille lisible, « Tous les événements » à part", async () => {
    const dialog = dialogOf((await boss.get("/marketing/webhooks")).text, "nouveau");
    assert.match(dialog, /<label class="checkbox-row mk-check-all"><input type="checkbox" name="events" value="\*"/);
    assert.match(dialog, /<div class="mk-check-grid">[\s\S]*value="lms\.order_completed"/);
  });
  test("la création fonctionne toujours (scénario, formulaire, clé)", async () => {
    assert.match((await boss.post("/marketing/automatisations", { name: "Modale A", kind: "transactional", trigger_event: "lms.user_registered" })).location, /^\/marketing\/automatisations\/\d+$/);
    assert.match((await boss.post("/marketing/formulaires", { name: "Modale F", consentText: "J'accepte." })).location, /^\/marketing\/formulaires\/\d+$/);
    const k = await boss.post("/marketing/api", { name: "Modale K", scope: "read" });
    assert.match((await boss.get(k.location)).text, /Clé « Modale K » créée/);
  });
  test("lecteur : ni modale ni bouton de création sur Automatisations et Formulaires", async () => {
    const v = await member("viewer");
    for (const url of ["/marketing/automatisations", "/marketing/formulaires"]) {
      const html = (await v.get(url)).text;
      assert.doesNotMatch(html, /data-mk-modal-open|<dialog class="mk-dialog mk-modal"/, url);
      assert.doesNotMatch(html, /mk-primary/, url);
    }
  });
});
