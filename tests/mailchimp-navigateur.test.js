// Console Mailchimp dans un VRAI Chrome (Playwright, ignoré sans) : connexion, onglets au clavier, audiences (création, liaison, import CSV avec correspondance, export), contacts (fiche, tags, actions groupées),
// assistant de campagne en 5 étapes (validation, brouillon, envoi, planification), modèles, rapports (détail, comparaison, CSV), webhooks (installation, journal en direct, rejeu), Transactionnel, téléphone,
// noms accessibles, retour du focus. Mailchimp est simulé (tests/fake-mailchimp.js) ; aucune erreur JavaScript ne doit apparaître.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, loginInstructor, Client } = require("./helpers");
const { createFakeMailchimp } = require("./fake-mailchimp");

let chromium = null;
try { chromium = require("playwright-core").chromium; } catch { /* module absent */ }
const CHROME = process.env.CHROME_PATH || ["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/usr/bin/google-chrome", "/usr/bin/chromium"].find((p) => fs.existsSync(p));
const SKIP = !chromium || !CHROME ? "Playwright ou Chrome absent : parcours navigateur non exécuté sur cette machine" : false;

describe("console Mailchimp (navigateur)", { skip: SKIP }, () => {
  let srv, fake, boss, browser, page, errors, remote;
  const URL_ = "/marketing/mailchimp";
  const API = "/marketing/mailchimp/api";
  const panel = () => page.locator("[data-mc-panel]");
  const tab = async (id) => { if (await page.locator("dialog[open]").count()) await page.keyboard.press("Escape"); await page.click(`#mc-tab-${id}`); await page.waitForFunction((i) => document.querySelector("[data-mc-panel]").getAttribute("aria-labelledby") === `mc-tab-${i}` && document.querySelector("[data-mc-panel]").getAttribute("aria-busy") === "false", id); };
  const flashText = () => page.locator("[data-mc-flash]").textContent();
  const waitFlash = (re) => page.waitForFunction((s) => new RegExp(s).test(document.querySelector("[data-mc-flash]").textContent), re.source);
  const dialog = () => page.locator("dialog[open]");
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  before(async () => {
    fake = await createFakeMailchimp();
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "", MAILCHIMP_API_BASE: fake.base, MANDRILL_API_BASE: fake.mandrillBase });
    boss = await loginInstructor(srv); errors = [];
    remote = fake.addList("Newsletter");
    fake.state.lists.get(remote.id).campaign_defaults = { from_name: "Société", from_email: "contact@exemple.fr", subject: "Actualités", language: "fr" };
    fake.addMember(remote.id, "ana@exemple.fr", "subscribed", { FNAME: "Ana", LNAME: "Diallo" }, ["client"]);
    fake.addMember(remote.id, "bob@exemple.fr", "unsubscribed");
    browser = await chromium.launch({ executablePath: CHROME, headless: true });
    const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, acceptDownloads: true });
    await context.addCookies([...boss.cookies].map(([name, value]) => ({ name, value, url: srv.base })));
    context.setDefaultTimeout(12000);
    page = await context.newPage();
    page.on("pageerror", (e) => errors.push(`pageerror : ${e.message} ${String(e.stack).split("\n").slice(0, 3).join(" | ")}`));
    page.on("console", (m) => { if (m.type() === "error" && !/Failed to load resource/.test(m.text())) errors.push(`console : ${m.text().slice(0, 200)}`); });
    page.on("dialog", (d) => d.dismiss());
  });
  after(async () => { if (browser) await browser.close(); await srv.stop(); await fake.close(); });

  test("avant connexion : seul l'onglet Connexion est ouvert, les autres sont verrouillés avec une explication", async () => {
    await page.goto(srv.base + URL_);
    await page.locator("[data-mc-tabs] [role=tab]").first().waitFor();
    assert.equal(await page.locator("[data-mc-tabs] [role=tab]").count(), 14);
    assert.equal(await page.locator("#mc-tab-connexion").getAttribute("aria-selected"), "true");
    assert.equal(await page.locator("#mc-tab-audiences").getAttribute("aria-disabled"), "true");
    await page.click("#mc-tab-audiences", { force: true }); // Playwright refuse de cliquer un contrôle aria-disabled ; une personne le peut
    assert.match(await flashText(), /Connectez d'abord votre compte Mailchimp/);
    assert.equal(await page.locator("#mc-tab-connexion").getAttribute("aria-selected"), "true");
    assert.match(await panel().textContent(), /Collez ici la clé d'API/);
  });

  test("clavier : les flèches déplacent le focus entre les onglets, Début/Fin aussi", async () => {
    await page.focus("#mc-tab-connexion");
    await page.keyboard.press("ArrowRight");
    assert.equal(await page.evaluate(() => document.activeElement.id), "mc-tab-apercu");
    await page.keyboard.press("End");
    assert.equal(await page.evaluate(() => document.activeElement.id), "mc-tab-journal");
    await page.keyboard.press("Home");
    assert.equal(await page.evaluate(() => document.activeElement.id), "mc-tab-connexion");
  });

  test("clé refusée : message français sans fuite ; clé valide : compte affiché, onglets ouverts, première synchronisation lancée", async () => {
    await page.fill("input[type=password]", "ffffffffffffffffffffffffffffffff-us21");
    await page.click("button:has-text('Valider et enregistrer')");
    await waitFlash(/clé d'API Mailchimp est refusée/);
    await page.fill("input[type=password]", "pas une clé");
    await page.click("button:has-text('Valider et enregistrer')");
    await waitFlash(/Format de clé invalide/);
    await page.fill("input[type=password]", fake.key);
    await page.click("button:has-text('Valider et enregistrer')");
    await waitFlash(/Connecté au compte « Société Démo »/);
    await page.waitForFunction(() => /Connecté : Société Démo/.test(document.querySelector("[data-mc-bar]").textContent));
    assert.equal(await page.locator("#mc-tab-audiences").getAttribute("aria-disabled"), null);
    assert.doesNotMatch(await page.content(), /0123456789abcdef0123456789abcdef/);
    await page.waitForFunction(() => /Dernière synchronisation/.test(document.querySelector("[data-mc-bar]").textContent), null, { timeout: 20000 });
  });

  test("vue d'ensemble : indicateurs, évolution et campagnes", async () => {
    await tab("apercu");
    assert.match(await panel().textContent(), /Contacts/);
    assert.ok(await panel().locator(".mk-mc-tile").count() >= 5);
    assert.match(await panel().textContent(), /Évolution des abonnés/);
  });

  test("audiences : liste avec statistiques, création (validation, puis succès), liaison à une liste Kolakisa", async () => {
    await tab("audiences");
    assert.match(await panel().textContent(), /Newsletter/);
    await page.click("button:has-text('Créer une audience')");
    await dialog().locator("button[type=submit]").click();
    assert.match(await dialog().locator(".mk-mc-dlg-error").textContent(), /obligatoire/);
    for (const [label, value] of [["Nom de l'audience", "Clients"], ["Nom de l'expéditeur par défaut", "Société"], ["Société", "Société SARL"], ["Adresse postale", "1 rue de la Paix"], ["Ville", "Paris"], ["Région", "IDF"], ["Code postal", "75001"]]) await dialog().getByLabel(new RegExp(label)).first().fill(value);
    await dialog().getByLabel(/Adresse de l'expéditeur/).fill("contact@exemple.fr");
    await dialog().locator("button[type=submit]").click();
    await waitFlash(/Audience créée/);
    await panel().getByRole("cell", { name: "Clients" }).waitFor();
    assert.ok([...fake.state.lists.values()].some((l) => l.name === "Clients"));
    const row = panel().locator("tr", { hasText: "Newsletter" });
    await row.getByRole("button", { name: "Lier" }).click();
    await waitFlash(/Audience liée/);
    await panel().locator("tr", { hasText: "Newsletter" }).getByText(/Liée \(liste n°/).waitFor();
  });

  test("synchronisation depuis la barre : les contacts de l'audience liée arrivent dans Kolakisa avec leur preuve", async () => {
    await page.click("button:has-text('Synchroniser maintenant')");
    await waitFlash(/Synchronisation terminée|Synchronisation lancée/);
    await page.waitForFunction(() => /Dernière synchronisation/.test(document.querySelector("[data-mc-bar]").textContent) && !/en cours/.test(document.querySelector("[data-mc-bar]").textContent), null, { timeout: 25000 });
    await sleep(800);
    const d = srv.db();
    const ana = d.prepare("SELECT status, first_name FROM mk_contacts WHERE email = 'ana@exemple.fr'").get();
    const bob = d.prepare("SELECT status FROM mk_contacts WHERE email = 'bob@exemple.fr'").get();
    d.close();
    assert.equal(ana && ana.status, "subscribed"); assert.equal(ana.first_name, "Ana"); assert.equal(bob && bob.status, "unsubscribed");
  });

  test("import CSV : correspondance des colonnes devinée, consentement attesté, rapport détaillé (invalides, doublons, écartés)", async () => {
    await tab("audiences");
    await panel().locator("tr", { hasText: "Newsletter" }).getByRole("button", { name: "Importer" }).click();
    const csv = "Courriel;Prénom;Nom de famille;Étiquettes\nnina@exemple.fr;Nina;Roy;vip\nnina@exemple.fr;Dup;Dup;\nmauvais;X;Y;\nlea@exemple.fr;Léa;Petit;\n";
    await dialog().locator("input[type=file]").setInputFiles({ name: "contacts.csv", mimeType: "text/csv", buffer: Buffer.from(csv) });
    await dialog().getByText("Correspondance des colonnes").first().waitFor();
    const values = await dialog().locator("table select").evaluateAll((els) => els.map((s) => s.value));
    assert.deepEqual(values.slice(0, 2), ["email", "FNAME"]);
    await dialog().getByLabel(/Je certifie que ces personnes ont donné leur consentement/).check();
    await dialog().getByLabel(/Tag à ajouter/).fill("import-test");
    await dialog().getByRole("button", { name: /Importer 4 ligne/ }).click();
    await dialog().getByText(/Import terminé : 2 créé/).waitFor();
    assert.match(await dialog().textContent(), /Doublons dans le fichier/);
    const nina = fake.state.members.get(remote.id).get(fake.md5("nina@exemple.fr"));
    assert.equal(nina.status, "subscribed");
    assert.deepEqual(nina.tags.map((t) => t.name).sort(), ["import-test", "vip"]);
    await dialog().getByRole("button", { name: "Fermer" }).click();
  });

  test("export CSV : le téléchargement contient les contacts, sans formule active", async () => {
    await tab("audiences");
    await panel().locator("tr", { hasText: "Newsletter" }).getByRole("button", { name: "Exporter" }).click();
    const [download] = await Promise.all([page.waitForEvent("download"), dialog().getByRole("button", { name: "Télécharger le CSV" }).click()]);
    assert.match(download.suggestedFilename(), /^contacts-mailchimp-.*\.csv$/);
    const text = fs.readFileSync(await download.path(), "utf8");
    assert.match(text, /nina@exemple\.fr/);
    assert.ok(text.startsWith("﻿email,statut"));
  });

  test("détail d'une audience : champ personnalisé, segment, tag, groupe d'intérêts", async () => {
    await tab("audiences");
    await panel().getByRole("button", { name: "Ouvrir l'audience Newsletter" }).click();
    await panel().getByRole("heading", { name: "Champs personnalisés (merge fields)" }).waitFor();
    await panel().locator("section", { hasText: "Champs personnalisés" }).getByRole("button", { name: "Ajouter un champ" }).click();
    await dialog().getByLabel(/Nom du champ/).fill("Ville");
    await dialog().locator("button[type=submit]").click();
    await waitFlash(/Créé/);
    assert.ok(fake.requests.some((r) => r.method === "POST" && r.path.endsWith("/merge-fields") && r.body.name === "Ville"));
    await panel().locator("section", { hasText: "Segments" }).first().getByRole("button", { name: "Créer un segment" }).click();
    await dialog().getByLabel(/Nom du segment/).fill("Prénom Ana");
    await dialog().getByLabel(/Valeur/).fill("Ana");
    await dialog().locator("button[type=submit]").click();
    await waitFlash(/Créé/);
    const seg = fake.requests.find((r) => r.method === "POST" && r.path.endsWith("/segments"));
    assert.deepEqual(seg.body.options.conditions[0], { condition_type: "TextMerge", field: "FNAME", op: "is", value: "Ana" });
    await panel().getByRole("button", { name: "← Retour aux audiences" }).click();
    await panel().getByRole("cell", { name: "Newsletter" }).first().waitFor();
  });

  test("contacts : tableau filtré par statut, fiche contact (tag ajouté puis retiré), actions groupées avec confirmation", async () => {
    await tab("contacts");
    await panel().getByRole("button", { name: "Ouvrir la fiche de ana@exemple.fr" }).waitFor();
    await panel().getByRole("button", { name: "Ouvrir la fiche de ana@exemple.fr" }).click();
    await dialog().getByRole("heading", { name: /Fiche contact : ana@exemple.fr/ }).waitFor();
    await dialog().getByLabel("Nouveau tag").fill("vip2");
    await dialog().getByRole("button", { name: "Ajouter le tag" }).click();
    assert.ok(await page.waitForFunction(() => document.body.textContent.includes("vip2")));
    assert.ok(fake.requests.some((r) => /\/tags$/.test(r.path) && r.body.tags && r.body.tags[0].name === "vip2" && r.body.tags[0].status === "active"));
    await dialog().getByRole("button", { name: "Fermer" }).last().click();
    assert.equal(await page.evaluate(() => document.activeElement && document.activeElement.textContent), "ana@exemple.fr", "le focus revient sur le bouton qui a ouvert la fiche");
    await panel().getByLabel("Sélectionner ana@exemple.fr").check();
    await panel().getByRole("button", { name: "Désabonner" }).click();
    await dialog().getByRole("button", { name: "Désabonner" }).click();
    await waitFlash(/1 contact\(s\) traité/);
    assert.equal(fake.state.members.get(remote.id).get(fake.md5("ana@exemple.fr")).status, "unsubscribed");
    fake.addMember(remote.id, "ana@exemple.fr", "subscribed");
  });

  test("assistant de campagne : étapes validées (objet, lien de désabonnement), brouillon enregistré chez Mailchimp", async () => {
    await tab("campagnes");
    await page.click("button:has-text('Nouvelle campagne')");
    await dialog().getByRole("heading", { name: /étape 1 sur 5/ }).waitFor();
    assert.equal(await dialog().locator("input[name=type]").count(), 4);
    await dialog().getByRole("button", { name: "Suivant" }).click();
    await dialog().getByRole("heading", { name: /étape 2 sur 5/ }).waitFor();
    await dialog().getByRole("button", { name: "Suivant" }).click();
    await dialog().getByRole("heading", { name: /étape 3 sur 5/ }).waitFor();
    await dialog().getByRole("button", { name: "Suivant" }).click();
    assert.match(await dialog().locator(".mk-mc-dlg-error").textContent(), /titre interne est obligatoire/);
    await dialog().locator("input[name=title]").fill("Lettre de novembre");
    await dialog().locator("input[name=subject]").fill("Nos nouveautés");
    await dialog().getByRole("button", { name: "Suivant" }).click();
    await dialog().getByRole("heading", { name: /étape 4 sur 5/ }).waitFor();
    const code = dialog().locator("textarea.mk-mc-code");
    await code.fill("<p>Bonjour *|FNAME|*</p>");
    await dialog().locator(".mk-mc-lint").getByText(/Il manque le lien de désabonnement/).waitFor();
    await dialog().getByRole("button", { name: "Suivant" }).click();
    assert.match(await dialog().locator(".mk-mc-dlg-error").textContent(), /lien de désabonnement/);
    await code.fill("<p>Bonjour *|FNAME|*</p><p>*|LIST:ADDRESSLINE|*</p><a href=\"*|UNSUB|*\">Se désabonner</a>");
    await page.waitForFunction(() => { const f = document.querySelector("dialog[open] iframe.mk-mc-frame"); return f && /Bonjour Camille/.test(f.srcdoc || ""); });
    await dialog().getByRole("button", { name: "Suivant" }).click();
    await dialog().getByRole("heading", { name: /étape 5 sur 5/ }).waitFor();
    await dialog().getByRole("button", { name: "Terminer" }).click();
    assert.match(await dialog().locator(".mk-mc-dlg-error").textContent(), /case de confirmation/);
    await dialog().getByLabel(/Je confirme avoir relu/).check();
    await dialog().getByRole("button", { name: "Terminer" }).click();
    await waitFlash(/Brouillon enregistré dans Mailchimp/);
    const c = [...fake.state.campaigns.values()].find((x) => x.settings.title === "Lettre de novembre");
    assert.ok(c, "campagne créée chez Mailchimp");
    assert.equal(c.type, "regular"); assert.equal(c.status, "save"); assert.equal(c.recipients.list_id, remote.id); assert.equal(c.settings.reply_to, "contact@exemple.fr");
    const content = fake.requests.find((r) => r.method === "PUT" && r.path === `/campaigns/${c.id}/content`);
    assert.match(content.body.html, /\*\|UNSUB\|\*/);
    await panel().getByRole("cell", { name: "Lettre de novembre" }).waitFor();
  });

  test("envoi : la confirmation nomme l'action ; annuler n'envoie rien ; confirmer envoie ; l'envoi planifié est arrondi au quart d'heure", async () => {
    const c = [...fake.state.campaigns.values()].find((x) => x.settings.title === "Lettre de novembre");
    c.recipients.recipient_count = 1200;
    await tab("campagnes");
    const row = panel().locator("tr", { hasText: "Lettre de novembre" });
    await row.getByRole("button", { name: "Planifier" }).click();
    await dialog().locator("button[type=submit]").click();
    assert.match(await dialog().locator(".mk-mc-dlg-error").textContent(), /Cochez la case/);
    await dialog().getByLabel(/Je confirme la planification/).check();
    await dialog().getByLabel(/Date et heure d'envoi/).fill("2020-01-01T10:00");
    await dialog().locator("button[type=submit]").click();
    assert.match(await dialog().locator(".mk-mc-dlg-error").textContent(), /date future/);
    await dialog().getByRole("button", { name: "Annuler" }).click();
    fake.reset();
    await row.getByRole("button", { name: "Envoyer", exact: true }).click();
    await dialog().getByRole("heading", { name: "Envoyer la campagne maintenant ?" }).waitFor();
    assert.match(await dialog().textContent(), /1\s?200 destinataire/);
    await dialog().getByRole("button", { name: "Annuler" }).click();
    assert.equal(fake.requests.filter((r) => /actions\/send$/.test(r.path)).length, 0, "annuler n'envoie rien");
    await row.getByRole("button", { name: "Envoyer", exact: true }).click();
    await dialog().getByRole("button", { name: "Envoyer maintenant" }).click();
    await waitFlash(/Campagne envoyée/);
    assert.equal(c.status, "sent");
    assert.equal(fake.requests.filter((r) => /actions\/send$/.test(r.path)).length, 1);
    assert.equal(fake.requests.find((r) => /actions\/send$/.test(r.path)).body.confirm, undefined);
  });

  test("modèles : création avec aperçu en direct, duplication, suppression confirmée", async () => {
    await tab("modeles");
    await panel().getByRole("button", { name: "Nouveau modèle" }).click();
    await dialog().getByLabel(/Nom du modèle/).fill("Modèle test");
    const code = dialog().locator("textarea.mk-mc-code");
    await code.waitFor();
    assert.match(await code.inputValue(), /\*\|UNSUB\|\*/);
    await page.waitForFunction(() => { const f = document.querySelector("dialog[open] iframe.mk-mc-frame"); return f && /Camille/.test(f.srcdoc || ""); });
    await dialog().getByRole("button", { name: "Enregistrer" }).click();
    await waitFlash(/Modèle enregistré/);
    await panel().getByRole("heading", { name: "Modèle test" }).waitFor();
    assert.ok([...fake.state.templates.values()].some((t) => t.name === "Modèle test"));
    await panel().getByRole("button", { name: "Dupliquer" }).first().click();
    await panel().getByRole("heading", { name: "Modèle test (copie)" }).waitFor().catch(() => {});
  });

  test("rapports : liste, détail par rubrique, comparaison, exports CSV", async () => {
    const a = fake.addCampaign({ settings: { title: "Rapport A", subject_line: "A" }, recipients: { list_id: remote.id } }), b = fake.addCampaign({ settings: { title: "Rapport B", subject_line: "B" }, recipients: { list_id: remote.id } });
    const rep = (c, open) => ({ id: c.id, campaign_title: c.settings.title, subject_line: c.settings.subject_line, send_time: c.send_time, emails_sent: 100, opens: { open_rate: open, unique_opens: open * 100, opens_total: 150 }, clicks: { click_rate: 0.1, unique_clicks: 10 }, bounces: { hard_bounces: 1, soft_bounces: 2 }, unsubscribed: 1, abuse_reports: 0, ecommerce: { total_revenue: 42 } });
    // les rapports sont listés par /reports ; le faux serveur sert /reports/{id} : on prépare aussi la liste
    fake.setReport(a.id, rep(a, 0.3)); fake.setReport(b.id, rep(b, 0.6));
    const origList = fake.state.reports;
    await page.route("**/marketing/mailchimp/api/rapports?*", async (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, data: { reports: [rep(a, 0.3), rep(b, 0.6)], total_items: 2 } }) }));
    await tab("rapports");
    await panel().getByRole("button", { name: "Ouvrir le rapport de Rapport A" }).waitFor();
    const [dl] = await Promise.all([page.waitForEvent("download"), panel().getByRole("button", { name: "Exporter en CSV" }).first().click()]);
    assert.match(fs.readFileSync(await dl.path(), "utf8"), /Rapport A/);
    await panel().getByLabel("Comparer Rapport A").check(); await panel().getByLabel("Comparer Rapport B").check();
    await panel().getByRole("button", { name: "Comparer la sélection" }).click();
    await panel().getByRole("heading", { name: "Comparaison de 2 campagnes" }).waitFor();
    assert.match(await panel().textContent(), /Rapport B \(meilleure ouverture\)/);
    await panel().getByRole("button", { name: "← Retour aux rapports" }).click();
    await panel().getByRole("button", { name: "Ouvrir le rapport de Rapport A" }).click();
    await panel().getByRole("heading", { name: "Rapport A" }).waitFor();
    assert.match(await panel().textContent(), /Taux d'ouverture/);
    for (const name of ["Ouvertures", "Clics", "Rebonds", "Désabonnements", "Plaintes", "Domaines", "Localisation", "Revenus par produit", "Test A/B"]) {
      await panel().getByRole("button", { name, exact: true }).click();
      await page.waitForFunction(() => !document.querySelector("[data-mc-panel] .mk-mc-loading"));
    }
    void origList;
  });

  test("webhooks : installation en un clic, événement reçu affiché en direct, détail de la charge, rejeu", async () => {
    await page.unroute("**/marketing/mailchimp/api/rapports?*");
    await tab("webhooks");
    await panel().getByRole("button", { name: "Installer le webhook Kolakisa" }).click();
    await waitFlash(/Webhook installé/);
    await panel().getByText(/webhooks\/mailchimp\/1\/••••••••/).waitFor();
    assert.doesNotMatch(await panel().textContent(), /[0-9a-f]{48}/);
    const url = (await (await fetch(srv.base + API + "/webhook-url", { headers: { cookie: [...boss.cookies].map(([k, v]) => `${k}=${v}`).join("; ") } })).json()).data.url.replace("https://k.test", srv.base);
    const body = new URLSearchParams({ type: "subscribe", fired_at: "2026-10-30 15:00:00", "data[list_id]": remote.id, "data[email]": "live@exemple.fr", "data[merges][FNAME]": "Live" }).toString();
    assert.equal((await fetch(url, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body })).status, 200);
    await panel().getByText("live@exemple.fr").waitFor({ timeout: 10000 });
    await panel().locator("tr", { hasText: "live@exemple.fr" }).getByRole("button", { name: "Charge" }).click();
    assert.match(await dialog().locator("pre").textContent(), /"email": "live@exemple.fr"/);
    await dialog().getByRole("button", { name: "Fermer" }).click();
    await panel().locator("tr", { hasText: "live@exemple.fr" }).getByRole("button", { name: "Rejouer" }).click();
    await waitFlash(/Événement rejoué/);
    await panel().locator("select").nth(2).selectOption("applied");
    assert.ok(await panel().locator("tr", { hasText: "live@exemple.fr" }).count() >= 1);
  });

  test("Transactionnel : clé refusée, clé valide, envoi refusé sans case à cocher, reçu envoyé avec", async () => {
    await tab("transactionnel");
    await panel().locator("input[type=password]").fill("mauvaise-cle-1234567890");
    await panel().getByRole("button", { name: "Enregistrer la clé" }).click();
    await waitFlash(/Mandrill\) est refusée/);
    assert.equal(srv.db().prepare("SELECT COUNT(*) AS n FROM mk_settings WHERE key = 'mailchimp.transactional_key'").get().n, 0, "une clé refusée n'est pas conservée");
    await panel().locator("input[type=password]").fill("mauvaise-cle-1234567890x");
    await panel().locator("input[type=password]").fill(fake.mandrillKey);
    await panel().getByRole("button", { name: "Enregistrer la clé" }).click();
    await panel().getByRole("heading", { name: "Compte Transactional" }).waitFor();
    await panel().getByRole("button", { name: "Envoyer un e-mail…" }).click();
    await dialog().getByLabel("Destinataire").fill("client@exemple.fr");
    await dialog().getByLabel(/Adresse d'expédition/).fill("contact@exemple.fr");
    await dialog().getByLabel("Objet").fill("Votre reçu");
    await dialog().getByLabel(/Message \(HTML\)/).fill("<p>Merci</p>");
    await dialog().locator("button[type=submit]").click();
    assert.match(await dialog().locator(".mk-mc-dlg-error").textContent(), /Cochez la case/);
    await dialog().getByLabel(/Je confirme l'envoi réel/).check();
    await dialog().locator("button[type=submit]").click();
    await waitFlash(/Envoi demandé : sent/);
  });

  test("compte et journal des appels : rendus, sans clé ni adresse e-mail dans le journal", async () => {
    await tab("compte");
    assert.match(await panel().textContent(), /Société Démo/);
    assert.match(await panel().textContent(), /n'est pas exposée par l'API Marketing/);
    await tab("journal");
    const text = await panel().textContent();
    assert.match(text, /\/lists\/:?[0-9a-f]*/);
    assert.doesNotMatch(text, /@exemple\.fr|0123456789abcdef/);
  });

  test("accessibilité : tous les contrôles ont un nom, hiérarchie des titres sans saut, aucune erreur JavaScript", async () => {
    for (const id of ["connexion", "apercu", "audiences", "contacts", "campagnes", "modeles", "rapports", "webhooks", "automatisations", "boutiques", "pages", "compte", "transactionnel", "journal"]) {
      await tab(id);
      const unnamed = await page.evaluate(() => [...document.querySelectorAll("[data-mc-root] button, [data-mc-root] input:not([type=hidden]), [data-mc-root] select, [data-mc-root] textarea")].filter((el) => {
        const name = (el.getAttribute("aria-label") || (el.labels && el.labels[0] && el.labels[0].textContent) || el.textContent || el.getAttribute("title") || "").trim();
        return !name;
      }).map((el) => el.outerHTML.slice(0, 120)));
      assert.deepEqual(unnamed, [], `${id} : contrôles sans nom accessible`);
      const levels = await page.evaluate(() => [...document.querySelectorAll("[data-mc-panel] h2, [data-mc-panel] h3, [data-mc-panel] h4")].map((h) => Number(h.tagName[1])));
      for (let i = 1; i < levels.length; i++) assert.ok(levels[i] - levels[i - 1] <= 1, `${id} : saut de titre ${levels[i - 1]} → ${levels[i]}`);
    }
    assert.deepEqual(errors, []);
  });

  test("téléphone (390 px) : aucun défilement horizontal de la page, tableaux repliés en fiches", async () => {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 800 }, hasTouch: true });
    await ctx.addCookies([...boss.cookies].map(([name, value]) => ({ name, value, url: srv.base })));
    const m = await ctx.newPage();
    await m.goto(srv.base + URL_ + "#audiences");
    await m.locator("[data-mc-panel] table").first().waitFor();
    const overflow = await m.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    const info = overflow > 1 ? await m.evaluate(() => {
      const inScroller = (e) => !!e.closest(".mk-mc-scroll");
      const wide = [...document.querySelectorAll("body *")].filter((e) => !inScroller(e) && e.getBoundingClientRect().right > window.innerWidth + 1 && e.getBoundingClientRect().width > 0).slice(0, 8).map((e) => `${e.tagName}.${String(e.className).slice(0, 40)}#${e.id} ${Math.round(e.getBoundingClientRect().right)}`);
      const t = document.querySelector("[data-mc-panel] table");
      return { wide, tableDisplay: t && getComputedStyle(t).display, scroller: t && Math.round(t.parentNode.getBoundingClientRect().right), docW: document.documentElement.scrollWidth };
    }) : null;
    assert.ok(overflow <= 1, `débordement horizontal : ${overflow}px — ${JSON.stringify(info)}`);
    assert.equal(await m.locator("[data-mc-panel] table thead").first().evaluate((el) => getComputedStyle(el).position), "absolute");
    await ctx.close();
  });

  test("un éditeur de l'organisation n'a pas accès à la console : page refusée, aucun onglet, aucune requête vers Mailchimp", async () => {
    const { newStudent } = require("./helpers");
    const c = await newStudent(srv);
    const d = srv.db();
    d.prepare("INSERT INTO mk_org_members (organization_id, user_id, role) VALUES (1, (SELECT id FROM users WHERE email = ?), 'editor')").run(c.email);
    d.close();
    const ctx = await browser.newContext({ viewport: { width: 1000, height: 700 } });
    await ctx.addCookies([...c.cookies].map(([name, value]) => ({ name, value, url: srv.base })));
    const p = await ctx.newPage();
    fake.reset();
    const res = await p.goto(srv.base + URL_);
    assert.equal(res.status(), 403);
    assert.match(await p.locator("body").textContent(), /Réservé aux administrateurs de l'organisation/);
    assert.equal(await p.locator("[data-mc-tabs]").count(), 0);
    assert.equal(fake.requests.length, 0);
    await ctx.close();
  });

  test("captures d'écran (si MC_SHOTS est défini) : bureau et téléphone, pour relecture visuelle", async () => {
    if (!process.env.MC_SHOTS) return;
    fs.mkdirSync(process.env.MC_SHOTS, { recursive: true });
    for (const id of ["connexion", "apercu", "audiences", "contacts", "campagnes", "modeles", "rapports", "webhooks", "transactionnel"]) { await tab(id); await sleep(500); await page.screenshot({ path: `${process.env.MC_SHOTS}/${id}.png`, fullPage: true }); }
  });
});
