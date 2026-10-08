// Éditeur de scénarios — PALETTE D'ACTIONS dans un VRAI navigateur (Chrome piloté par Playwright) contre un vrai serveur :
// une action qui dépend d'une connexion non réglée est marquée « Connexion requise » (avec la raison), « Seulement les
// actions disponibles » masque réellement ces actions, la disponibilité suit les réglages, les actions récentes remontent.
// Ignoré (avec la raison) si Playwright ou Chrome ne sont pas installés : `npm i --no-save playwright-core`, ou CHROME_PATH.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, loginInstructor } = require("./helpers");

let chromium = null;
try { chromium = require("playwright-core").chromium; } catch { /* module absent */ }
const CHROME = process.env.CHROME_PATH || ["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/usr/bin/google-chrome", "/usr/bin/chromium"].find((p) => fs.existsSync(p));
const SKIP = !chromium || !CHROME ? "Playwright ou Chrome absent : parcours navigateur non exécuté sur cette machine" : false;
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

describe("palette d'actions des scénarios : disponibilité réelle, filtre, récentes (navigateur)", { skip: SKIP }, () => {
  let srv, boss, browser, context, page, errors, n = 0, autoId, org;
  // « Récemment utilisées » répète une action déjà insérée : on vise toujours la première occurrence
  const item = (type) => page.locator(`#au-palette .mk-pal-item[data-step-type="${type}"]`).first();
  const visible = (type) => item(type).evaluate((b) => !b.closest("li").hidden && b.offsetParent !== null);

  async function openEditor() {
    n += 1;
    if (context) await context.close();
    context = await browser.newContext({ viewport: { width: 1600, height: 900 } });
    await context.addCookies([...boss.cookies].map(([name, value]) => ({ name, value, url: srv.base })));
    page = await context.newPage();
    page.on("pageerror", (e) => errors.push(`pageerror : ${e.message}`));
    page.on("console", (m) => { if (m.type() === "error" && !/Failed to load resource/.test(m.text())) errors.push(`console : ${m.text().slice(0, 200)}`); });
    const r = await boss.post("/marketing/automatisations", { name: `Palette ${n}`, kind: "marketing", trigger_event: "lms.user_registered" });
    autoId = Number(String(r.location).match(/(\d+)$/)[1]);
    org = srv.db().prepare("SELECT organization_id AS o FROM mk_automations WHERE id = ?").get(autoId).o;
    await page.goto(`${srv.base}/marketing/automatisations/${autoId}`);
    await page.waitForSelector("#au-palette .mk-pal-item", { timeout: 15000 });
  }
  const setting = (key, value) => srv.db().prepare("INSERT OR REPLACE INTO mk_settings (organization_id, key, value) VALUES (?, ?, ?)").run(org, key, value);

  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv);
    browser = await chromium.launch({ executablePath: CHROME, headless: true });
    errors = [];
  });
  after(async () => { if (browser) await browser.close(); if (srv) await srv.stop(); });

  test("par défaut : e-mail et SMS sont marqués « Connexion requise » avec la raison ; les autres actions ne le sont pas", async () => {
    await openEditor();
    for (const type of ["email", "sms"]) {
      assert.equal(await item(type).locator(".mk-pal-badge").innerText(), "Connexion requise", `${type} : badge`);
      assert.match(await item(type).getAttribute("class"), /is-needs-connection/);
      assert.match(await item(type).getAttribute("data-tip"), /connexion requise/i);
      assert.match(await item(type).getAttribute("aria-label"), /Connexion requise/, `${type} : annoncé aux lecteurs d'écran`);
    }
    assert.match(await item("sms").getAttribute("data-tip"), /Fournisseur SMS/);
    assert.match(await item("email").getAttribute("data-tip"), /Fournisseur d'e-mails/);
    for (const type of ["wait", "condition", "split", "update_field", "add_tag", "end"]) assert.equal(await item(type).locator(".mk-pal-badge").count(), 0, `${type} : aucune connexion requise`);
  });

  test("« Seulement les actions disponibles » masque réellement les actions à connecter, et le choix survit au rechargement", async () => {
    await openEditor();
    assert.ok(await visible("sms") && await visible("email"), "affichées par défaut (jamais cachées sans qu'on le demande)");
    await page.locator("[data-pal-only]").check();
    assert.equal(await visible("sms"), false); assert.equal(await visible("email"), false);
    assert.ok(await visible("wait") && await visible("condition"), "les actions disponibles restent");
    await page.reload(); await page.waitForSelector("#au-palette .mk-pal-item");
    assert.equal(await page.locator("[data-pal-only]").isChecked(), true, "choix mémorisé");
    assert.equal(await visible("sms"), false, "filtre toujours appliqué après rechargement");
    await page.locator("[data-pal-only]").uncheck();
    assert.ok(await visible("sms"), "décoché : de retour");
  });

  test("la recherche trouve les actions qui demandent une connexion (« connexion »)", async () => {
    await openEditor();
    await page.fill("#au-pal-search", "connexion");
    assert.ok(await visible("sms") && await visible("email"));
    assert.equal(await visible("wait"), false);
  });

  test("une fois les connexions réglées (e-mail, SMS, webhook), les badges et le filtre disparaissent (rien de décoratif)", async () => {
    await openEditor();
    setting("email.provider", "smtp"); setting("email.from", "KOLAKISA <contact@exemple.fr>");
    srv.db().prepare("INSERT OR IGNORE INTO mk_webhook_endpoints (organization_id, name, url, secret, events) VALUES (?, 'CRM', 'https://crm.exemple.com/hook', '', '[\"*\"]')").run(org);
    setting("sms.provider", "twilio"); setting("sms.sender", "KOLAKISA"); setting("sms.account_sid", "AC00000000000000000000000000000000"); setting("sms.auth_token", "jeton");
    await page.reload(); await page.waitForSelector("#au-palette .mk-pal-item");
    assert.equal(await page.locator("#au-palette .mk-pal-badge").count(), 0, "plus aucun badge");
    assert.equal(await page.locator("[data-pal-only]").count(), 0, "plus de filtre : il n'y a rien à filtrer");
    assert.ok(await visible("sms") && await visible("email"));
  });

  test("les actions récemment utilisées remontent en tête à la prochaine ouverture (4 au plus, la plus récente d'abord)", async () => {
    await openEditor();
    for (const type of ["wait", "split", "add_tag"]) { await item(type).click(); await wait(250); }
    await page.reload(); await page.waitForSelector("#au-palette .mk-pal-item");
    const first = page.locator("#au-palette .mk-pal-group").first();
    assert.match(await first.locator(".mk-pal-cat").innerText(), /récemment utilisées/i);
    const types = await first.locator(".mk-pal-item").evaluateAll((bs) => bs.map((b) => b.dataset.stepType));
    assert.deepEqual(types, ["add_tag", "split", "wait"]);
    // Cliquer sur une récente l'insère vraiment (une étape de plus sur le canevas)
    const before = await page.locator(".drawflow-node").count();
    await first.locator('.mk-pal-item[data-step-type="split"]').click(); await wait(400);
    assert.equal(await page.locator(".drawflow-node").count(), before + 1, "l'action récente est insérée");
  });

  // Étapes enregistrées du scénario ouvert (relues en base : ce que le moteur exécutera réellement)
  const savedSteps = () => JSON.parse(srv.db().prepare("SELECT steps FROM mk_automations WHERE id = ?").get(autoId).steps || "[]");
  const dialog = () => page.locator("dialog.mk-step-dialog[open]");
  // Relie la sortie du déclencheur à l'entrée de l'étape (sans liaison, une étape n'est pas exécutée) puis enregistre le scénario
  async function connectAndSave(label) {
    const out = page.locator(".drawflow-node").filter({ hasText: "Déclencheur" }).first().locator(".output").first();
    const inp = page.locator(".drawflow-node").filter({ hasText: label }).first().locator(".input").first();
    await out.dragTo(inp);
    await page.locator("#au-save").click();
  }
  const until = async (check, what) => { const end = Date.now() + 8000; for (;;) { let v = null; try { v = await check(); } catch { /* nouvel essai */ } if (v) return v; if (Date.now() > end) throw new Error(`Délai dépassé : ${what}`); await wait(120); } };

  test("« Modifier le score » : insertion, réglages réels, validation, résumé sur le bloc, enregistrement", async () => {
    await openEditor();
    await item("adjust_score").click();
    await page.locator(".drawflow-node").filter({ hasText: "Modifier le score" }).first().click(); // clic sur une étape = la configurer
    await dialog().waitFor({ timeout: 8000 });
    assert.match(await dialog().innerText(), /Modifier le score/);
    // Mode « définir » : le libellé du champ suit le mode
    await dialog().locator("select").selectOption("set");
    assert.match(await dialog().innerText(), /Nouveau score/);
    await dialog().locator("select").selectOption("subtract");
    assert.match(await dialog().innerText(), /Nombre de points/);
    // Validation : 0 point est refusé, la fenêtre reste ouverte avec le message
    await dialog().locator("input[type=number]").fill("0");
    await dialog().locator("[data-step-save]").click();
    assert.match(await dialog().locator(".mk-step-dialog-error").innerText(), /Points : un nombre entier de 1 à 100000/);
    await dialog().locator("input[type=number]").fill("7");
    await dialog().locator("[data-step-save]").click();
    await page.locator("dialog.mk-step-dialog[open]").waitFor({ state: "detached", timeout: 8000 });
    await connectAndSave("Modifier le score");
    await until(() => { const st = savedSteps(); return st.length === 1 && st[0].type === "adjust_score" && st[0].mode === "subtract" && st[0].points === 7; }, "étape enregistrée et exécutable (retirer 7 points)");
    assert.match(await page.locator(".drawflow-node").filter({ hasText: "Modifier le score" }).first().innerText(), /−\s*7 points/);
  });

  test("« Ajouter une note » : texte obligatoire, enregistré tel quel, résumé sur le bloc", async () => {
    await openEditor();
    await item("add_note").click();
    await page.locator(".drawflow-node").filter({ hasText: "Ajouter une note" }).first().click();
    await dialog().waitFor({ timeout: 8000 });
    await dialog().locator("[data-step-save]").click();
    assert.match(await dialog().locator(".mk-step-dialog-error").innerText(), /Écrivez le texte de la note/);
    await dialog().locator("textarea").fill("Hésitant après trois visites");
    await dialog().locator("[data-step-save]").click();
    await page.locator("dialog.mk-step-dialog[open]").waitFor({ state: "detached", timeout: 8000 });
    await connectAndSave("Ajouter une note");
    await until(() => { const st = savedSteps(); return st.length === 1 && st[0].type === "add_note" && st[0].body === "Hésitant après trois visites"; }, "note enregistrée et exécutable");
    assert.match(await page.locator(".drawflow-node").filter({ hasText: "Ajouter une note" }).first().innerText(), /Hésitant après trois visites/);
  });

  test("« Attendre une date ou une heure » : champs selon le mode, validation, enregistrement exécutable", async () => {
    await openEditor();
    await item("wait_until").click();
    await page.locator(".drawflow-node").filter({ hasText: "Attendre une date ou une heure" }).first().click();
    await dialog().waitFor({ timeout: 8000 });
    const mode = dialog().locator("select").first();
    // Heures ouvrables : jours cochés par défaut du lundi au vendredi ; aucun jour = refus avec message
    await mode.selectOption("business_hours");
    assert.equal(await dialog().locator("input[type=checkbox]:checked").count(), 5);
    for (let k = 0; k < 7; k += 1) await dialog().locator("input[type=checkbox]").nth(k).setChecked(false);
    await dialog().locator("[data-step-save]").click();
    assert.match(await dialog().locator(".mk-step-dialog-error").innerText(), /au moins un jour ouvrable/);
    // Fermeture avant ouverture : refus
    await dialog().locator("input[type=checkbox]").nth(1).check();
    await dialog().locator("input[type=time]").nth(0).fill("18:00");
    await dialog().locator("input[type=time]").nth(1).fill("09:00");
    await dialog().locator("[data-step-save]").click();
    assert.match(await dialog().locator(".mk-step-dialog-error").innerText(), /ouverture doit précéder la fermeture/);
    // Jour de la semaine : on change de mode, les champs d'un autre mode ne traînent pas
    await mode.selectOption("weekday");
    assert.equal(await dialog().locator("input[type=checkbox]").count(), 0, "plus de cases de jours ouvrables");
    await dialog().locator("select").nth(2).selectOption("3"); // Mercredi (mode, fuseau, jour)
    await dialog().locator("input[type=time]").fill("10:30");
    await dialog().locator("[data-step-save]").click();
    await page.locator("dialog.mk-step-dialog[open]").waitFor({ state: "detached", timeout: 8000 });
    await connectAndSave("Attendre une date ou une heure");
    await until(() => { const st = savedSteps(); return st.length === 1 && JSON.stringify(st[0]) === JSON.stringify({ type: "wait_until", mode: "weekday", zone: "contact", weekday: 3, time: "10:30" }); }, "étape « mercredi 10:30 » enregistrée, sans reste d'un autre mode");
    assert.match(await page.locator(".drawflow-node").filter({ hasText: "Attendre une date ou une heure" }).first().innerText(), /Mercredi à 10:30/);
  });

  test("« Attendre une date ou une heure », champ date : propriétés de type date proposées, aucune si elles n'existent pas", async () => {
    await openEditor();
    await item("wait_until").click();
    await page.locator(".drawflow-node").filter({ hasText: "Attendre une date ou une heure" }).first().click();
    await dialog().waitFor({ timeout: 8000 });
    await dialog().locator("select").first().selectOption("property");
    assert.match(await dialog().innerText(), /Aucune propriété de type date/);
    await dialog().locator("[data-step-save]").click();
    assert.match(await dialog().locator(".mk-step-dialog-error").innerText(), /Choisissez un champ date du contact/);
    await dialog().getByRole("button", { name: "Annuler" }).click();
    srv.db().prepare("INSERT INTO mk_property_defs (organization_id, key, label, type, options) VALUES (?, 'rentree', 'Rentrée', 'date', '[]')").run(org);
    await page.reload(); await page.waitForSelector("#au-palette .mk-pal-item");
    await page.locator(".drawflow-node").filter({ hasText: "Attendre une date ou une heure" }).first().click();
    await dialog().waitFor({ timeout: 8000 });
    await dialog().locator("select").first().selectOption("property");
    assert.deepEqual(await dialog().locator("select").nth(2).locator("option").allInnerTexts(), ["Choisir un champ…", "Rentrée"]);
  });

  test("« Démarrer / Arrêter un autre scénario » : cibles proposées, avertissement si inactif, enregistrement exécutable", async () => {
    await openEditor();
    const cible = await boss.post("/marketing/automatisations", { name: "Cible visée", kind: "marketing", trigger_event: "lms.course_enrolled" });
    const cibleId = Number(String(cible.location).match(/(\d+)$/)[1]);
    await page.reload(); await page.waitForSelector("#au-palette .mk-pal-item");
    await item("start_automation").click();
    await page.locator(".drawflow-node").filter({ hasText: "Démarrer un autre scénario" }).first().click();
    await dialog().waitFor({ timeout: 8000 });
    await dialog().locator("[data-step-save]").click();
    assert.match(await dialog().locator(".mk-step-dialog-error").innerText(), /Choisissez un scénario/);
    const choix = dialog().locator("select").first();
    assert.ok((await choix.locator("option").allInnerTexts()).includes("Cible visée (brouillon)"), "les autres scénarios sont proposés, avec leur état");
    assert.ok(!(await choix.locator("option").allInnerTexts()).some((o) => o.startsWith(`Palette ${n} `)), "le scénario en cours n'est pas proposé");
    await choix.selectOption(String(cibleId));
    assert.match(await dialog().innerText(), /n'est pas actif : cette étape ne démarrera rien/, "avertissement réel : la cible n'est pas active");
    await dialog().locator("[data-step-save]").click();
    await page.locator("dialog.mk-step-dialog[open]").waitFor({ state: "detached", timeout: 8000 });
    await connectAndSave("Démarrer un autre scénario");
    await until(() => { const st = savedSteps(); return st.length === 1 && st[0].type === "start_automation" && st[0].automationId === cibleId; }, "étape enregistrée et exécutable");
    assert.match(await page.locator(".drawflow-node").filter({ hasText: "Démarrer un autre scénario" }).first().innerText(), /Démarre « Cible visée »/);
  });

  test("actions sur les données : « Copier un champ », « Définir une date », « Calculer un nombre » — formulaires, validation, enregistrement exécutable", async () => {
    await openEditor();
    // Sans propriété du bon type : le formulaire le dit (aucun contrôle sans effet)
    await item("calculate").click();
    await page.locator(".drawflow-node").filter({ hasText: "Calculer un nombre" }).first().click();
    await dialog().waitFor({ timeout: 8000 });
    assert.match(await dialog().innerText(), /Aucune propriété de type nombre/);
    await dialog().getByRole("button", { name: "Fermer" }).or(dialog().getByRole("button", { name: "Annuler" })).first().click();
    for (const [key, label, type] of [["niveau", "Niveau", "text"], ["rentree", "Rentrée", "date"], ["solde", "Solde", "number"]]) srv.db().prepare("INSERT OR IGNORE INTO mk_property_defs (organization_id, key, label, type, options) VALUES (?, ?, ?, ?, '[]')").run(org, key, label, type);
    await page.reload(); await page.waitForSelector("#au-palette .mk-pal-item");
    const open = async (label) => { await page.locator(".drawflow-node").filter({ hasText: label }).last().click(); await dialog().waitFor({ timeout: 8000 }); };
    const save = async () => { await dialog().locator("[data-step-save]").click(); await page.locator("dialog.mk-step-dialog[open]").waitFor({ state: "detached", timeout: 8000 }); };
    // Copier un champ
    await item("copy_field").click(); await open("Copier un champ");
    await dialog().locator("[data-step-save]").click();
    assert.match(await dialog().locator(".mk-step-dialog-error").innerText(), /Choisissez le champ de départ/);
    const selects = dialog().locator("select");
    await selects.nth(0).selectOption("first_name");
    await selects.nth(1).selectOption("property:niveau");
    await selects.nth(2).selectOption("capitalize");
    await save();
    // Définir une date
    await item("set_date").click(); await open("Définir une date");
    await dialog().locator("select").nth(0).selectOption("property:rentree");
    await dialog().locator("input[type=number]").fill("7");
    await save();
    // Calculer un nombre (décimal accepté)
    await item("calculate").click(); await open("Calculer un nombre");
    await dialog().locator("select").nth(0).selectOption("property:solde");
    await dialog().locator("select").nth(1).selectOption("multiply");
    await dialog().locator("input[type=number]").fill("2.5");
    await save();
    // Relier en chaîne : déclencheur → copier → date → calcul
    const node = (label) => page.locator(".drawflow-node").filter({ hasText: label }).last();
    await node("Déclencheur").locator(".output").first().dragTo(node("Copier un champ").locator(".input").first());
    await node("Copier un champ").locator(".output").first().dragTo(node("Définir une date").locator(".input").first());
    await node("Définir une date").locator(".output").first().dragTo(node("Calculer un nombre").locator(".input").first());
    await page.locator("#au-save").click();
    await until(() => JSON.stringify(savedSteps()) === JSON.stringify([
      { type: "copy_field", from: "first_name", to: "property:niveau", transform: "capitalize" },
      { type: "set_date", property: "property:rentree", base: "today", offsetDays: 7, zone: "contact" },
      { type: "calculate", property: "property:solde", op: "multiply", value: 2.5 },
    ]), "trois étapes enregistrées et exécutables");
    const text = (label) => node(label).innerText();
    assert.match(await text("Copier un champ"), /Prénom → Niveau \(majuscule à chaque mot\)/);
    assert.match(await text("Définir une date"), /Rentrée = aujourd'hui \+ 7 j/);
    assert.match(await text("Calculer un nombre"), /Solde × 2\.5/);
  });

  test("« Envoyer vers un webhook » : marqué « Connexion requise » sans webhook, puis formulaire, validation et enregistrement exécutable", async () => {
    await openEditor();
    srv.db().prepare("DELETE FROM mk_webhook_endpoints").run();
    await page.reload(); await page.waitForSelector("#au-palette .mk-pal-item");
    assert.equal(await item("webhook_call").locator(".mk-pal-badge").innerText(), "Connexion requise");
    assert.match(await item("webhook_call").getAttribute("data-tip"), /Intégrations → Webhooks/);
    await item("webhook_call").click();
    await page.locator(".drawflow-node").filter({ hasText: "Envoyer vers un webhook" }).first().click();
    await dialog().waitFor({ timeout: 8000 });
    assert.match(await dialog().innerText(), /Aucun webhook : créez-en un dans Intégrations → Webhooks/);
    await dialog().getByRole("button", { name: "Annuler" }).or(dialog().getByRole("button", { name: "Fermer" })).first().click();
    srv.db().prepare("INSERT INTO mk_webhook_endpoints (organization_id, name, url, secret, events) VALUES (?, 'CRM', 'https://crm.exemple.com/hook/secret-path', '', '[\"*\"]')").run(org);
    await page.reload(); await page.waitForSelector("#au-palette .mk-pal-item");
    assert.equal(await page.locator("#au-palette .mk-pal-badge").count(), 0 + (await page.locator("#au-palette .mk-pal-item.is-needs-connection").count()), "plus de badge pour le webhook");
    assert.equal(await item("webhook_call").locator(".mk-pal-badge").count(), 0);
    await page.locator(".drawflow-node").filter({ hasText: "Envoyer vers un webhook" }).first().click();
    await dialog().waitFor({ timeout: 8000 });
    await dialog().locator("[data-step-save]").click();
    assert.match(await dialog().locator(".mk-step-dialog-error").innerText(), /Choisissez le webhook à appeler/);
    const options = await dialog().locator("select").first().locator("option").allInnerTexts();
    assert.ok(options.includes("CRM — crm.exemple.com"), "le webhook est proposé avec son domaine seulement (jamais le chemin ni le secret)");
    assert.ok(!(await dialog().innerText()).includes("secret-path"));
    await dialog().locator("select").first().selectOption({ label: "CRM — crm.exemple.com" });
    await dialog().getByRole("button", { name: "Ajouter un champ" }).click();
    await dialog().locator("input[type=text]").nth(0).fill("1 mauvais nom");
    await dialog().locator("input[type=text]").nth(1).fill("{{inconnue}}");
    await dialog().locator("[data-step-save]").click();
    const erreurs = await dialog().locator(".mk-step-dialog-error").innerText();
    assert.match(erreurs, /nom invalide/); assert.match(erreurs, /variable inconnue/);
    await dialog().locator("input[type=text]").nth(0).fill("email_client");
    await dialog().locator("input[type=text]").nth(1).fill("{{email}}");
    await dialog().getByRole("button", { name: "Ajouter un champ" }).click();
    await dialog().locator("input[type=text]").nth(2).fill("source");
    await dialog().locator("input[type=text]").nth(3).fill("scénario");
    await dialog().getByRole("button", { name: /Retirer le champ 2/ }).click();
    await dialog().getByRole("button", { name: "Ajouter un champ" }).click();
    await dialog().locator("input[type=text]").nth(2).fill("formation");
    await dialog().locator("input[type=text]").nth(3).fill("{{event.course_title}}");
    await dialog().locator("[data-step-save]").click();
    await page.locator("dialog.mk-step-dialog[open]").waitFor({ state: "detached", timeout: 8000 });
    await connectAndSave("Envoyer vers un webhook");
    const webhookId = srv.db().prepare("SELECT id FROM mk_webhook_endpoints WHERE name = 'CRM' ORDER BY id DESC").get().id;
    await until(() => JSON.stringify(savedSteps()) === JSON.stringify([{ type: "webhook_call", endpointId: webhookId, fields: [{ key: "email_client", value: "{{email}}" }, { key: "formation", value: "{{event.course_title}}" }] }]), "étape enregistrée et exécutable");
    assert.match(await page.locator(".drawflow-node").filter({ hasText: "Envoyer vers un webhook" }).first().innerText(), /« CRM » · 2 champs/);
  });

  test("aucune erreur de script ni de console", () => { assert.deepEqual(errors, []); });
});
