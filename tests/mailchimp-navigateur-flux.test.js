// Console Mailchimp dans Chrome — parcours COMPLÉMENTAIRES : types de campagne (texte brut, RSS, test A/B), contrôle avant envoi bloquant, planification (UTC, quart d'heure), édition et test d'une campagne existante,
// contact (consentement coché ou non), audience (modification, suppression par saisie du nom), automatisations, boutiques, pages de destination, compte (domaines), webhook personnalisé, Transactionnel (liste de rejet).
// Chaque assertion lit ce que le faux Mailchimp a REÇU : on vérifie les requêtes réellement émises par l'écran, pas seulement l'affichage.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, loginInstructor } = require("./helpers");
const { createFakeMailchimp } = require("./fake-mailchimp");

let chromium = null;
try { chromium = require("playwright-core").chromium; } catch { /* module absent */ }
const CHROME = process.env.CHROME_PATH || ["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/usr/bin/google-chrome", "/usr/bin/chromium"].find((p) => fs.existsSync(p));
const SKIP = !chromium || !CHROME ? "Playwright ou Chrome absent : parcours navigateur non exécuté sur cette machine" : false;

describe("console Mailchimp — parcours complémentaires (navigateur)", { skip: SKIP }, () => {
  let srv, fake, boss, browser, page, errors, remote;
  const API = "/marketing/mailchimp/api";
  const panel = () => page.locator("[data-mc-panel]");
  const dialog = () => page.locator("dialog[open]");
  const tab = async (id) => { if (await page.locator("dialog[open]").count()) await page.keyboard.press("Escape"); await page.click(`#mc-tab-${id}`); await page.waitForFunction((i) => document.querySelector("[data-mc-panel]").getAttribute("aria-labelledby") === `mc-tab-${i}` && document.querySelector("[data-mc-panel]").getAttribute("aria-busy") === "false", id); };
  const waitFlash = (re) => page.waitForFunction((s) => new RegExp(s).test(document.querySelector("[data-mc-flash]").textContent), re.source);
  const sent = (method, re) => fake.requests.filter((r) => r.method === method && re.test(r.path));
  const wizard = async () => { await tab("campagnes"); await page.click("button:has-text('Nouvelle campagne')"); await dialog().getByRole("heading", { name: /étape 1 sur 5/ }).waitFor(); };
  const next = (n) => dialog().getByRole("button", { name: "Suivant" }).click().then(() => dialog().getByRole("heading", { name: new RegExp(`étape ${n} sur 5`) }).waitFor());
  const identity = async () => { await dialog().locator("input[name=title]").fill("Titre interne"); await dialog().locator("input[name=subject]").fill("Mon objet"); };

  before(async () => {
    fake = await createFakeMailchimp();
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "", MAILCHIMP_API_BASE: fake.base, MANDRILL_API_BASE: fake.mandrillBase });
    boss = await loginInstructor(srv); errors = [];
    remote = fake.addList("Newsletter");
    Object.assign(fake.state.lists.get(remote.id), { permission_reminder: "Vous recevez cet e-mail car vous vous êtes inscrit.", campaign_defaults: { from_name: "Société", from_email: "contact@exemple.fr", subject: "", language: "fr" } });
    fake.addMember(remote.id, "ana@exemple.fr", "subscribed", { FNAME: "Ana" });
    const c = await boss.request(`${API}/connexion`, { method: "POST", json: { apiKey: fake.key }, headers: { "X-Requested-With": "fetch" } });
    assert.equal(c.status, 200);
    await boss.request(`${API}/sync`, { method: "POST", json: {}, headers: { "X-Requested-With": "fetch" } });
    browser = await chromium.launch({ executablePath: CHROME, headless: true });
    const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, acceptDownloads: true });
    await context.addCookies([...boss.cookies].map(([name, value]) => ({ name, value, url: srv.base })));
    context.setDefaultTimeout(12000);
    page = await context.newPage();
    page.on("pageerror", (e) => errors.push(`pageerror : ${e.message} ${String(e.stack).split("\n").slice(0, 3).join(" | ")}`));
    page.on("console", (m) => { if (m.type() === "error" && !/Failed to load resource/.test(m.text())) errors.push(`console : ${m.text().slice(0, 200)}`); });
    await page.goto(srv.base + "/marketing/mailchimp#apercu");
    await page.locator("#mc-tab-apercu[aria-selected=true]").waitFor();
  });
  after(async () => { if (browser) await browser.close(); await srv.stop(); await fake.close(); });

  test("campagne en texte brut : le lien de désabonnement est exigé, le texte est envoyé en plain_text", async () => {
    await wizard();
    await dialog().locator("input[name=type][value=plaintext]").check();
    await next(2); await next(3); await identity(); await next(4);
    const ta = dialog().locator("textarea[name=plain]");
    await ta.fill("Bonjour, rien d'autre.");
    await dialog().getByRole("button", { name: "Suivant" }).click();
    assert.match(await dialog().locator(".mk-mc-dlg-error").textContent(), /lien de désabonnement/);
    await ta.fill("Bonjour *|FNAME|*\nSe désabonner : *|UNSUB|*\n*|LIST:ADDRESSLINE|*");
    await next(5);
    await dialog().getByLabel(/Je confirme avoir relu/).check();
    await dialog().getByRole("button", { name: "Terminer" }).click();
    await waitFlash(/Brouillon enregistré/);
    const c = [...fake.state.campaigns.values()].find((x) => x.type === "plaintext");
    assert.ok(c);
    const put = sent("PUT", new RegExp(`/campaigns/${c.id}/content$`))[0];
    assert.match(put.body.plain_text, /\*\|UNSUB\|\*/); assert.equal(put.body.html, undefined);
  });

  test("campagne RSS : l'adresse du flux doit être en HTTPS ; les options RSS sont envoyées", async () => {
    await wizard();
    await dialog().locator("input[name=type][value=rss]").check();
    await dialog().locator("input[name=feedUrl]").fill("http://exemple.fr/feed");
    await dialog().getByRole("button", { name: "Suivant" }).click();
    assert.match(await dialog().locator(".mk-mc-dlg-error").textContent(), /https:\/\//);
    await dialog().locator("input[name=feedUrl]").fill("https://exemple.fr/feed");
    await dialog().locator("select[name=frequency]").selectOption("weekly");
    await next(2); await next(3); await identity(); await next(4); await next(5);
    await dialog().getByLabel(/Je confirme avoir relu/).check();
    await dialog().getByRole("button", { name: "Terminer" }).click();
    await waitFlash(/Brouillon enregistré/);
    const post = sent("POST", /\/campaigns$/).pop();
    assert.equal(post.body.type, "rss");
    assert.deepEqual({ feed_url: post.body.rss_opts.feed_url, frequency: post.body.rss_opts.frequency }, { feed_url: "https://exemple.fr/feed", frequency: "weekly" });
  });

  test("test A/B : second objet obligatoire, paramètres du test envoyés", async () => {
    await wizard();
    await dialog().locator("input[name=type][value=variate]").check();
    await dialog().getByRole("button", { name: "Suivant" }).click();
    assert.match(await dialog().locator(".mk-mc-dlg-error").textContent(), /second objet/);
    await dialog().locator("input[name=subjectB]").fill("Objet B");
    await dialog().locator("input[name=testSize]").fill("30");
    await dialog().locator("select[name=criteria]").selectOption("clicks");
    await next(2); await next(3); await identity(); await next(4); await next(5);
    await dialog().getByLabel(/Je confirme avoir relu/).check();
    await dialog().getByRole("button", { name: "Terminer" }).click();
    await waitFlash(/Brouillon enregistré/);
    const post = sent("POST", /\/campaigns$/).pop();
    assert.equal(post.body.type, "variate");
    assert.deepEqual(post.body.variate_settings, { winner_criteria: "clicks", wait_time: 24, test_size: 30, subject_lines: ["Mon objet", "Objet B"] });
  });

  test("segment : un segment choisi à l'étape 2 est transmis comme segment enregistré", async () => {
    const seg = (await api2("POST", `/audiences/${remote.id}/segments`, { name: "Les Ana", options: { match: "all", conditions: [{ condition_type: "TextMerge", field: "FNAME", op: "is", value: "Ana" }] } })).data;
    await wizard();
    await next(2);
    await page.waitForFunction(() => [...document.querySelectorAll("dialog[open] select[name=segmentId] option")].some((o) => /Les Ana/.test(o.textContent)));
    await dialog().locator("select[name=segmentId]").selectOption(String(seg.id));
    await next(3); await identity(); await next(4); await next(5);
    await dialog().getByLabel(/Je confirme avoir relu/).check();
    await dialog().getByRole("button", { name: "Terminer" }).click();
    await waitFlash(/Brouillon enregistré/);
    const post = sent("POST", /\/campaigns$/).pop();
    assert.deepEqual(post.body.recipients, { list_id: remote.id, segment_opts: { saved_segment_id: seg.id } });
  });
  async function api2(method, path, body) { const r = await boss.request(API + path, { method, json: body, headers: { "X-Requested-With": "fetch" } }); return JSON.parse(r.text); }

  test("contrôle avant envoi : une campagne « pas prête » n'est jamais envoyée, la liste des problèmes s'affiche", async () => {
    const c = fake.addCampaign({ status: "save", settings: { title: "Pas prête", subject_line: "X" }, recipients: { list_id: remote.id, recipient_count: 10 } }); c.notReady = true;
    await tab("campagnes");
    const row = panel().locator("tr", { hasText: "Pas prête" });
    await row.getByRole("button", { name: "Envoyer", exact: true }).click();
    await dialog().getByRole("heading", { name: "Pas encore prête à l'envoi" }).waitFor();
    assert.match(await dialog().textContent(), /Le contenu est vide/);
    await dialog().getByRole("button", { name: "Fermer" }).click();
    assert.equal(sent("POST", new RegExp(`/campaigns/${c.id}/actions/send$`)).length, 0);
    await row.getByRole("button", { name: "Vérifier" }).click();
    await dialog().getByRole("heading", { name: "Pas encore prête à l'envoi" }).waitFor();
    await dialog().getByRole("button", { name: "Fermer" }).click();
  });

  test("planification : date future, heure envoyée en UTC sur un multiple de 15 minutes, confirmation exigée", async () => {
    const c = fake.addCampaign({ status: "save", settings: { title: "À planifier", subject_line: "X" }, recipients: { list_id: remote.id, recipient_count: 10 } });
    await tab("campagnes");
    const row = panel().locator("tr", { hasText: "À planifier" });
    await row.getByRole("button", { name: "Planifier" }).click();
    const when = new Date(Date.now() + 2 * 86400000); when.setHours(10, 7, 0, 0);
    const local = `${when.getFullYear()}-${String(when.getMonth() + 1).padStart(2, "0")}-${String(when.getDate()).padStart(2, "0")}T10:07`;
    await dialog().getByLabel(/Date et heure d'envoi/).fill(local);
    await dialog().getByLabel(/Je confirme la planification/).check();
    await dialog().locator("button[type=submit]").click();
    await waitFlash(/Envoi planifié pour le/);
    const req = sent("POST", new RegExp(`/campaigns/${c.id}/actions/schedule$`))[0];
    assert.match(req.body.schedule_time, /^\d{4}-\d\d-\d\dT\d\d:\d\d:00\+00:00$/);
    assert.equal(Number(req.body.schedule_time.slice(14, 16)) % 15, 0, "minutes multiples de 15");
    assert.equal(req.body.confirm, undefined);
    assert.equal(new Date(req.body.schedule_time).getTime() >= when.getTime(), true, "arrondi vers le haut");
  });

  test("campagne existante : modification du contenu, test avec validation des adresses", async () => {
    const c = fake.addCampaign({ status: "save", settings: { title: "À modifier", subject_line: "X" }, recipients: { list_id: remote.id, recipient_count: 3 } });
    await tab("campagnes");
    const row = panel().locator("tr", { hasText: "À modifier" });
    await row.getByRole("button", { name: "Contenu" }).click();
    await dialog().locator("textarea.mk-mc-code").fill("<p>Nouveau *|FNAME|*</p><a href=\"*|UNSUB|*\">x</a>");
    await dialog().getByRole("button", { name: "Enregistrer le contenu" }).click();
    await waitFlash(/Contenu enregistré/);
    assert.match(sent("PUT", new RegExp(`/campaigns/${c.id}/content$`))[0].body.html, /Nouveau/);
    await row.getByRole("button", { name: "Test" }).click();
    await dialog().getByLabel(/Adresses/).fill("pas-un-mail");
    await dialog().locator("button[type=submit]").click();
    assert.match(await dialog().locator(".mk-mc-dlg-error").textContent(), /invalide/);
    await dialog().getByLabel(/Adresses/).fill("a@exemple.fr, b@exemple.fr");
    await dialog().locator("button[type=submit]").click();
    await waitFlash(/Test envoyé à a@exemple.fr, b@exemple.fr/);
    const test = sent("POST", new RegExp(`/campaigns/${c.id}/actions/test$`))[0];
    assert.deepEqual(test.body, { test_emails: ["a@exemple.fr", "b@exemple.fr"], send_type: "html" });
    await row.getByRole("button", { name: "Dupliquer" }).click();
    await waitFlash(/Campagne dupliquée/);
    await row.getByRole("button", { name: "Supprimer" }).click();
    await dialog().getByRole("button", { name: "Supprimer" }).click();
    await waitFlash(/Campagne supprimée/);
    assert.equal(fake.state.campaigns.has(c.id), false);
  });

  test("contact : sans case de consentement le contact est « pending », avec la case il est « subscribed »", async () => {
    await tab("contacts");
    for (const [email, consent, expected] of [["pend@exemple.fr", false, "pending"], ["abo@exemple.fr", true, "subscribed"]]) {
      await panel().getByRole("button", { name: "Ajouter un contact" }).click();
      await dialog().getByLabel(/Adresse e-mail/).fill(email);
      await dialog().getByLabel("Prénom").fill("Test");
      if (consent) await dialog().getByLabel(/a donné son consentement/).check();
      await dialog().locator("button[type=submit]").click();
      await waitFlash(/Contact ajouté/);
      const got = fake.state.members.get(remote.id).get(fake.md5(email));
      assert.ok(got, `${email} absent de l'audience ; requêtes : ${JSON.stringify(fake.requests.filter((r) => r.method === "POST").map((r) => r.path))}`);
      assert.equal(got.status, expected);
    }
    await panel().getByRole("button", { name: "Ajouter un contact" }).click();
    await dialog().getByLabel(/Adresse e-mail/).fill("invalide");
    await dialog().locator("button[type=submit]").click();
    assert.match(await dialog().locator(".mk-mc-dlg-error").textContent(), /adresse e-mail invalide/);
    await dialog().getByRole("button", { name: "Annuler" }).click();
  });

  test("contacts : filtre par tag (segment statique), abonnement groupé avec attestation de consentement, raccourci depuis le détail d'une audience", async () => {
    await api2("POST", `/audiences/${remote.id}/segments`, { name: "VIP", static_segment: ["ana@exemple.fr"] });
    await tab("contacts");
    await panel().getByRole("button", { name: "Ouvrir la fiche de ana@exemple.fr" }).waitFor();
    await panel().getByLabel("Segment ou tag").selectOption({ label: "Tag : VIP" });
    await page.waitForFunction(() => document.querySelectorAll("[data-mc-panel] tbody tr").length === 1);
    assert.equal(await panel().getByRole("button", { name: "Ouvrir la fiche de ana@exemple.fr" }).count(), 1);
    assert.equal(await panel().getByRole("button", { name: "Ouvrir la fiche de abo@exemple.fr" }).count(), 0);
    assert.ok(fake.requests.some((r) => /\/segments\/\d+\/members$/.test(r.path)));
    await panel().getByLabel("Segment ou tag").selectOption("");
    await panel().getByLabel("Statut").selectOption("pending");
    await panel().getByLabel("Sélectionner pend@exemple.fr").check();
    await panel().getByRole("button", { name: "Abonner", exact: true }).click();
    await dialog().locator("button[type=submit]").click();
    assert.match(await dialog().locator(".mk-mc-dlg-error").textContent(), /Cochez la case de consentement/);
    await dialog().getByLabel(/consentement/).check();
    await dialog().locator("button[type=submit]").click();
    await waitFlash(/1 contact\(s\) abonné/);
    assert.equal(fake.state.members.get(remote.id).get(fake.md5("pend@exemple.fr")).status, "subscribed");
    await tab("audiences");
    await panel().getByRole("button", { name: /Ouvrir l'audience/ }).first().click();
    await panel().getByRole("button", { name: "Voir les contacts de cette audience" }).click();
    await page.waitForFunction(() => document.querySelector("[data-mc-panel]").getAttribute("aria-labelledby") === "mc-tab-contacts" && document.querySelector("[data-mc-panel]").getAttribute("aria-busy") === "false");
    await panel().getByRole("button", { name: "Ouvrir la fiche de ana@exemple.fr" }).waitFor();
  });

  test("audience : modification (double confirmation), suppression seulement après avoir recopié le nom", async () => {
    await tab("audiences");
    const row = panel().locator("tr", { hasText: "Newsletter" });
    await row.getByRole("button", { name: "Modifier" }).click();
    await dialog().getByLabel(/Double confirmation/).check();
    await dialog().getByLabel("Nom de l'audience").fill("Newsletter mensuelle");
    await dialog().locator("button[type=submit]").click();
    await waitFlash(/Audience modifiée/);
    assert.equal(fake.state.lists.get(remote.id).double_optin, true);
    assert.equal(fake.state.lists.get(remote.id).name, "Newsletter mensuelle");
    const extra = fake.addList("À supprimer");
    await tab("audiences");
    await panel().locator("tr", { hasText: "À supprimer" }).getByRole("button", { name: "Supprimer", exact: true }).click();
    const confirm = dialog().getByRole("button", { name: "Supprimer", exact: true });
    assert.equal(await confirm.isDisabled(), true, "le bouton reste inactif tant que le nom n'est pas recopié");
    await dialog().getByLabel(/Recopiez/).fill("À supprimer");
    await confirm.click();
    await waitFlash(/Supprimé/);
    assert.equal(fake.state.lists.has(extra.id), false);
    assert.equal(sent("DELETE", new RegExp(`/lists/${extra.id}$`)).length, 1);
  });

  test("automatisations : démarrage confirmé, ajout et retrait d'un contact", async () => {
    await api2("POST", "/automatisations", { recipients: { list_id: remote.id }, trigger_settings: { workflow_type: "welcomeSeries" }, settings: { title: "Bienvenue" } });
    const a = fake.state.coll["/automations"][0]; a.status = "paused"; a.settings = { title: "Bienvenue" };
    await tab("automatisations");
    await panel().getByRole("button", { name: "Démarrer" }).click();
    await dialog().getByRole("button", { name: "Démarrer" }).click();
    await waitFlash(/Automatisation démarrée/);
    assert.equal(sent("POST", /actions\/start-all-emails$/).length, 1);
    await panel().getByRole("button", { name: "Ouvrir Bienvenue" }).click();
    await panel().getByRole("button", { name: "Ajouter un contact" }).click();
    await dialog().getByLabel(/Adresse e-mail/).fill("ana@exemple.fr");
    await dialog().locator("button[type=submit]").click();
    await waitFlash(/Contact ajouté à la séquence/);
    assert.equal(sent("POST", /\/emails\/em1\/queue$/)[0].body.email_address, "ana@exemple.fr");
    await panel().getByRole("button", { name: "Retirer un contact" }).click();
    await dialog().getByLabel(/Adresse e-mail/).fill("ana@exemple.fr");
    await dialog().locator("button[type=submit]").click();
    await waitFlash(/Contact retiré/);
    const rm = sent("POST", /removed-subscribers$/)[0];
    assert.deepEqual(rm.body, { email_address: "ana@exemple.fr" });
    await panel().getByRole("button", { name: "File d'attente" }).click();
    await dialog().getByRole("heading", { name: "File d'attente de l'e-mail" }).waitFor();
    await dialog().getByRole("button", { name: "Fermer" }).click();
  });

  test("boutiques : création, produit avec une variante, suppression confirmée", async () => {
    await tab("boutiques");
    await panel().getByRole("button", { name: "Créer une boutique" }).click();
    await dialog().getByLabel(/Identifiant unique/).fill("ma-boutique");
    await dialog().getByLabel("Nom (obligatoire)").fill("Ma boutique");
    await dialog().locator("button[type=submit]").click();
    await waitFlash(/Boutique créée/);
    assert.deepEqual({ id: sent("POST", /\/ecommerce\/stores$/)[0].body.id, currency: sent("POST", /\/ecommerce\/stores$/)[0].body.currency_code, list: sent("POST", /\/ecommerce\/stores$/)[0].body.list_id }, { id: "ma-boutique", currency: "EUR", list: remote.id });
    await panel().getByRole("button", { name: "Ouvrir la boutique Ma boutique" }).click();
    await panel().getByRole("button", { name: "Ajouter un produit" }).click();
    await dialog().getByLabel(/Identifiant unique du produit/).fill("formation-seo");
    await dialog().getByLabel(/Titre/).fill("Formation SEO");
    await dialog().getByLabel(/Prix/).fill("49.9");
    await dialog().locator("button[type=submit]").click();
    await waitFlash(/Créé/);
    const prod = sent("POST", /\/products$/)[0];
    assert.deepEqual(prod.body.variants, [{ id: "formation-seo-v1", title: "Formation SEO", price: 49.9 }]);
    await panel().locator("section", { hasText: "Produits" }).first().getByRole("button", { name: "Supprimer" }).click();
    await dialog().getByRole("button", { name: "Supprimer" }).click();
    await waitFlash(/Supprimé/);
    assert.equal(sent("DELETE", /\/products\/formation-seo$/).length, 1);
  });

  test("pages de destination : création, publication confirmée, dépublication", async () => {
    await tab("pages");
    await panel().getByRole("button", { name: "Créer une page" }).click();
    await dialog().getByLabel(/Nom interne/).fill("Inscription hiver");
    await dialog().getByLabel(/Titre affiché/).fill("Rejoignez-nous");
    await dialog().locator("button[type=submit]").click();
    await waitFlash(/Créé/);
    assert.equal(sent("POST", /\/landing-pages$/)[0].query.use_default_list, "true");
    await panel().getByRole("button", { name: "Publier" }).click();
    await dialog().getByRole("button", { name: "Publier" }).click();
    await waitFlash(/Page publiée/);
    assert.equal(sent("POST", /actions\/publish$/).length, 1);
  });

  test("compte : ajout d'un domaine, mauvais code puis bon code de vérification", async () => {
    await tab("compte");
    await panel().getByRole("button", { name: "Ajouter un domaine" }).click();
    await dialog().getByLabel(/Adresse e-mail sur ce domaine/).fill("admin@exemple.org");
    await dialog().locator("button[type=submit]").click();
    await waitFlash(/Créé/);
    await panel().getByRole("button", { name: "Saisir le code reçu" }).click();
    await dialog().getByLabel(/Code reçu/).fill("000000");
    await dialog().locator("button[type=submit]").click();
    await dialog().locator(".mk-mc-dlg-error:not([hidden])").waitFor();
    assert.match(await dialog().locator(".mk-mc-dlg-error").textContent(), /Mailchimp a refusé la demande.*Champ « code »/);
    await dialog().getByLabel(/Code reçu/).fill("123456");
    await dialog().locator("button[type=submit]").click();
    await waitFlash(/Domaine vérifié/);
    await panel().getByText("Oui").first().waitFor();
  });

  test("webhook personnalisé : adresse HTTPS exigée, événements et sources transmis ; suppression confirmée", async () => {
    await tab("webhooks");
    await panel().getByRole("button", { name: "Créer un webhook personnalisé" }).click();
    await dialog().getByLabel(/Adresse du webhook/).fill("http://exemple.fr/hook");
    await dialog().locator("button[type=submit]").click();
    assert.match(await dialog().locator(".mk-mc-dlg-error").textContent(), /https:\/\//);
    await dialog().getByLabel(/Adresse du webhook/).fill("https://exemple.fr/hook");
    await dialog().getByLabel(/Changement d'adresse/).uncheck();
    await dialog().getByLabel(/Source : appels d'API/).check();
    await dialog().locator("button[type=submit]").click();
    await waitFlash(/Webhook créé/);
    const post = sent("POST", /\/webhooks$/).pop();
    assert.equal(post.body.url, "https://exemple.fr/hook");
    assert.equal(post.body.events.upemail, false); assert.equal(post.body.events.subscribe, true); assert.equal(post.body.sources.api, true);
    await panel().locator("tr", { hasText: "exemple.fr/hook" }).getByRole("button", { name: "Supprimer" }).click();
    await dialog().getByRole("button", { name: "Supprimer" }).click();
    await waitFlash(/Supprimé/);
    assert.equal(sent("DELETE", /\/webhooks\/[a-z0-9]+$/).length >= 1, true);
  });

  test("Transactionnel : suppression d'une adresse de la liste de rejet demande confirmation", async () => {
    await boss.request(`${API}/transactionnel/cle`, { method: "PUT", json: { key: fake.mandrillKey }, headers: { "X-Requested-With": "fetch" } });
    await page.reload();
    await tab("transactionnel");
    await panel().getByRole("heading", { name: "Compte Transactional" }).waitFor();
    await panel().getByRole("button", { name: "Rechercher" }).click();
    await panel().getByText("Reçu", { exact: true }).first().waitFor();
    assert.ok(fake.requests.some((r) => r.path === "/api/1.0/messages/search.json" && r.body.query === "*"));
  });

  test("aucune erreur JavaScript pendant ces parcours", async () => {
    assert.deepEqual(errors, []);
  });
});
