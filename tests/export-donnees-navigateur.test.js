// Outils → Exporter les données, en vrai Chrome : parcours complet (demande, confirmation par le lien public, génération, téléchargement de l'archive,
// accès refusé, envoi du lien, expiration et nettoyage), isolation entre deux sites, affichage bureau et mobile, mouvement réduit et stabilité de la mise en page.
// Nécessite playwright-core et Chrome : sans eux, le parcours est ignoré avec un message explicite (rien n'est prétendu vérifié).
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, loginInstructor } = require("./helpers");
const zip = require("../src/services/privacy/exportEngine/zip");

let chromium = null;
try { chromium = require("playwright-core").chromium; } catch { /* module absent */ }
const CHROME = process.env.CHROME_PATH || ["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/usr/bin/google-chrome", "/usr/bin/chromium"].find((p) => fs.existsSync(p));
const SKIP = !chromium || !CHROME ? "Playwright ou Chrome absent : parcours navigateur non exécuté sur cette machine" : false;
const SHOTS = process.env.PX_SHOTS || "";

describe("Exporter les données : navigateur réel", { skip: SKIP }, () => {
  let srv, boss, browser, db, errors, A, B;
  const SP = "/marketing/site-web/sites";
  const one = (sql, ...a) => db.prepare(sql).get(...a);
  const EMAIL = "navigateur.synthetique@exemple.org";
  const open = async (width = 1400, height = 900, { auth = true, ...extra } = {}) => {
    const context = await browser.newContext({ viewport: { width, height }, acceptDownloads: true, ...extra });
    if (auth) await context.addCookies([...boss.cookies].map(([name, value]) => ({ name, value, url: srv.base })));
    const page = await context.newPage();
    page.on("pageerror", (e) => errors.push(`pageerror : ${e.message}`));
    page.on("console", (m) => { if (m.type() === "error" && !/Failed to load resource/.test(m.text())) errors.push(`console : ${m.text().slice(0, 200)}`); });
    return page;
  };
  const shot = async (page, name) => { if (SHOTS) { fs.mkdirSync(SHOTS, { recursive: true }); await page.screenshot({ path: path.join(SHOTS, `${name}.png`), fullPage: true }); } };
  const overflow = (page) => page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  const mkSite = async (name) => Number(String((await boss.post(SP, { name })).location).match(/sites\/(\d+)/)[1]);
  const tokenOf = (mailId, kind) => one("SELECT body FROM mail_outbox WHERE id = ?", mailId).body.match(new RegExp(`/donnees-personnelles/${kind}/([A-Za-z0-9_-]+)`))[1];
  const pageUrl = (site) => `${srv.base}/marketing/site-web/outils/donnees?site=${site}`;

  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "" });
    boss = await loginInstructor(srv); db = srv.db(); errors = [];
    const orgId = one("SELECT id FROM mk_organizations").id;
    A = await mkSite("Site Chrome A"); B = await mkSite("Site Chrome B");
    const post = Number(db.prepare("INSERT INTO posts (slug, title, content, published, status, published_at) VALUES ('article-chrome', 'Article Chrome', '<p>x</p>', 1, 'published', datetime('now'))").run().lastInsertRowid);
    db.prepare("INSERT INTO mk_content_sites (content_type, content_id, organization_id, site_id) VALUES ('post', ?, ?, ?)").run(post, orgId, A);
    db.prepare("INSERT INTO blog_comments (post_id, content_type, content_id, author_name, author_email, body, status) VALUES (?, 'post', ?, 'Zoë 日本', ?, 'Commentaire <b>navigateur</b> accentué — été', 'approved')").run(post, post, EMAIL);
    browser = await chromium.launch({ executablePath: CHROME, headless: true });
  });
  after(async () => { if (browser) await browser.close(); db.close(); await srv.stop(); });

  test("page vide (bureau puis mobile 375 px) : formulaire, tableau et état vide lisibles, sans débordement ni erreur de console", async () => {
    for (const [w, h, name] of [[1400, 900, "bureau"], [375, 740, "mobile"]]) {
      const page = await open(w, h);
      await page.goto(`${srv.base}${SP}/${A}/outils/donnees`, { waitUntil: "load" });
      assert.match(await page.locator("h1").first().innerText(), /Exporter les données/);
      assert.equal(await page.locator("#px-id").isVisible(), true);
      assert.equal(await page.locator("[data-px-email]").isChecked(), true, "case cochée par défaut");
      assert.equal(await page.locator("[data-px-direct]").isVisible(), false);
      assert.match(await page.locator("#px-empty").innerText(), /Aucune demande d'exportation pour ce site/);
      assert.ok((await overflow(page)) <= 1, `pas de défilement horizontal (${name}) : ${await overflow(page)} px`);
      await shot(page, `vide-${name}`);
      await page.context().close();
    }
    assert.deepEqual(errors, [], errors.join("\n"));
  });

  test("formulaire : contrôle immédiat des saisies, confirmation directe visible seulement sans e-mail, libellé du bouton adapté", async () => {
    const page = await open();
    await page.goto(pageUrl(A), { waitUntil: "load" });
    await page.click("[data-px-submit]");
    assert.match(await page.locator("[data-px-error]").innerText(), /Saisissez un identifiant/);
    assert.equal(await page.locator("#px-id").getAttribute("aria-invalid"), "true");
    await page.fill("#px-id", "pas-une-adresse@");
    await page.click("[data-px-submit]");
    assert.match(await page.locator("[data-px-error]").innerText(), /pas valide/);
    assert.equal(one("SELECT COUNT(*) n FROM cms_privacy_requests").n, 0, "rien n'a été envoyé au serveur");
    await page.uncheck("[data-px-email]");
    assert.equal(await page.locator("[data-px-direct]").isVisible(), true);
    assert.match(await page.locator("[data-px-submit]").innerText(), /Créer la demande confirmée/);
    await page.fill("#px-id", EMAIL);
    await page.click("[data-px-submit]");
    assert.match(await page.locator("[data-px-error]").innerText(), /cochez/);
    assert.equal(one("SELECT COUNT(*) n FROM cms_privacy_requests").n, 0);
    await shot(page, "formulaire-direct");
    await page.check("[data-px-email]");
    assert.equal(await page.locator("[data-px-direct]").isVisible(), false);
    assert.match(await page.locator("[data-px-submit]").innerText(), /Envoyer la demande de confirmation/);
    await page.context().close();
  });

  test("parcours complet : demande → e-mail → confirmation par le lien → génération → ZIP téléchargé et relu → accès refusé → envoi du lien → téléchargement par la personne", async () => {
    const admin = await open();
    await admin.goto(pageUrl(A), { waitUntil: "load" });
    await admin.fill("#px-id", EMAIL);
    await admin.click("[data-px-submit]");
    await admin.waitForURL(/outils\/donnees\?site=/);
    assert.match(await admin.locator("body").innerText(), /Demande enregistrée/);
    assert.match(await admin.locator("#px-table").innerText(), /En attente de confirmation/);
    const req = one("SELECT * FROM cms_privacy_requests WHERE site_id = ?", A);
    assert.equal(req.status, "pending_confirmation");
    await shot(admin, "liste-en-attente");

    // La personne ouvre le lien reçu (contexte sans session) : l'ouverture ne confirme rien ; le bouton confirme
    const person = await open(1000, 800, { auth: false });
    const confirmUrl = `${srv.base}/donnees-personnelles/confirmer/${tokenOf(req.confirm_mail_id, "confirmer")}`;
    await person.goto(confirmUrl, { waitUntil: "load" });
    assert.match(await person.locator("body").innerText(), /Site Chrome A/);
    assert.equal(one("SELECT status FROM cms_privacy_requests WHERE id = ?", req.id).status, "pending_confirmation");
    await shot(person, "public-confirmation");
    await person.click(".auth-card button[type=submit]");
    assert.match(await person.locator("body").innerText(), /Demande confirmée/);
    assert.equal(one("SELECT status FROM cms_privacy_requests WHERE id = ?", req.id).status, "confirmed");
    await person.goto(confirmUrl, { waitUntil: "load" });
    assert.match(await person.locator("body").innerText(), /n'est plus valable/, "lien à usage unique");

    // L'administrateur génère l'export puis télécharge l'archive
    await admin.reload({ waitUntil: "load" });
    assert.match(await admin.locator("#px-table").innerText(), /Confirmée/);
    await admin.click('button:has-text("Générer l\'export")');
    await admin.waitForURL(/outils\/donnees\?site=/);
    assert.match(await admin.locator("body").innerText(), /Export prêt/);
    assert.match(await admin.locator("#px-table").innerText(), /conservée jusqu'au/);
    await shot(admin, "liste-export-pret");
    const [download] = await Promise.all([admin.waitForEvent("download"), admin.click('a:has-text("Télécharger l\'archive")')]);
    const saved = path.join(srv.dir, "telecharge.zip"); await download.saveAs(saved);
    const entries = Object.fromEntries(zip.read(fs.readFileSync(saved)).map((e) => [e.name, e.data.toString("utf8")]));
    assert.match(entries["donnees-personnelles.html"], /Zoë 日本/); assert.match(entries["donnees-personnelles.html"], /&lt;b&gt;navigateur&lt;\/b&gt; accentué — été/);
    assert.equal(JSON.parse(entries["donnees.json"]).categories.some((c) => c.id === "commentaires"), true);

    // Rendu de l'archive : le HTML s'ouvre et reste lisible
    const reader = await open(1000, 800, { auth: false });
    await reader.setContent(entries["donnees-personnelles.html"], { waitUntil: "load" });
    assert.match(await reader.locator("h1").innerText(), /Vos données personnelles/);
    assert.equal(await reader.locator("script").count(), 0, "aucun script dans le rapport");
    await shot(reader, "archive-html");
    await reader.context().close();

    // Accès non autorisé : sans session → connexion ; autre site → introuvable
    const stranger = await open(1000, 800, { auth: false });
    await stranger.goto(`${srv.base}/marketing/site-web/outils/donnees/${req.id}/archive?site=${A}`, { waitUntil: "load" });
    assert.match(stranger.url(), /connexion/);
    await stranger.context().close();
    const other = await admin.context().newPage();
    const refused = await other.goto(`${srv.base}/marketing/site-web/outils/donnees/${req.id}/archive?site=${B}`);
    assert.equal(refused.status(), 404, "l'archive du site A n'est pas lisible depuis le site B");
    await other.close();

    // Envoi du lien : sans SMTP configuré, l'état reste honnête (pas « Envoyée »)
    await admin.click('button:has-text("Envoyer le lien à la personne")');
    await admin.waitForURL(/outils\/donnees\?site=/);
    assert.match(await admin.locator("body").innerText(), /Le lien de téléchargement est en cours d'envoi/);
    const sent = one("SELECT * FROM cms_privacy_requests WHERE id = ?", req.id);
    const dlUrl = `${srv.base}/donnees-personnelles/telecharger/${tokenOf(sent.delivery_mail_id, "telecharger")}`;
    await person.goto(dlUrl, { waitUntil: "load" });
    assert.match(await person.locator("body").innerText(), /Télécharger l'archive/);
    assert.equal(one("SELECT download_count n FROM cms_privacy_requests WHERE id = ?", req.id).n, 0);
    await shot(person, "public-telechargement");
    const [personDownload] = await Promise.all([person.waitForEvent("download"), person.click(".auth-card button[type=submit]")]);
    const savedPerson = path.join(srv.dir, "personne.zip"); await personDownload.saveAs(savedPerson);
    assert.equal(zip.read(fs.readFileSync(savedPerson)).length, 3);
    assert.equal(one("SELECT download_count n FROM cms_privacy_requests WHERE id = ?", req.id).n, 1);

    // Expiration : l'archive est supprimée, le lien meurt, la demande passe en « Expirée »
    db.prepare("UPDATE cms_privacy_requests SET archive_expires_at = '2020-01-01 00:00:00' WHERE id = ?").run(req.id);
    await admin.goto(pageUrl(A), { waitUntil: "load" });
    assert.match(await admin.locator("#px-table").innerText(), /Expirée/);
    assert.equal(fs.existsSync(path.join(srv.dir, "data", "private-exports", `site-${A}`, sent.archive_file)), false, "archive supprimée");
    await person.goto(dlUrl, { waitUntil: "load" });
    assert.match(await person.locator("body").innerText(), /n'est plus valable/);
    assert.match(await admin.locator("#px-table").innerText(), /Relancer la demande/);
    await shot(admin, "liste-expiree");
    await person.context().close(); await admin.context().close();
    assert.deepEqual(errors, [], errors.join("\n"));
  });

  test("isolation : le site B ne voit ni la demande du site A ni son adresse ; sélection globale, actions groupées et refus en ligne", async () => {
    const page = await open();
    await page.goto(pageUrl(B), { waitUntil: "load" });
    assert.doesNotMatch(await page.locator("body").innerText(), new RegExp(EMAIL.replace(/\./g, "\\.")));
    assert.match(await page.locator("#px-empty").innerText(), /Aucune demande/);
    await page.goto(pageUrl(A), { waitUntil: "load" });
    assert.match(await page.locator("#px-table").innerText(), new RegExp(EMAIL.replace(/\./g, "\\.")));
    await page.click("#px-bulk button[type=submit]");
    assert.match(await page.locator("[data-px-bulk-error]").innerText(), /Choisissez une action/);
    await page.selectOption("#px-bulk-action", "generer");
    await page.click("#px-bulk button[type=submit]");
    assert.match(await page.locator("[data-px-bulk-error]").innerText(), /Sélectionnez au moins une demande/);
    await page.locator("[data-px-all]").first().check();
    assert.equal(await page.locator("[data-px-one]").first().isChecked(), true);
    await page.click("#px-bulk button[type=submit]");
    await page.waitForURL(/outils\/donnees\?site=/);
    assert.match(await page.locator("body").innerText(), /0 demande\(s\) traitée\(s\), 1 refusée\(s\)/, "l'état « Expirée » ne permet pas la génération : refus motivé");
    await shot(page, "groupe-recap");
    await page.context().close();
  });

  test("mouvement réduit respecté, aucun décalage de mise en page au chargement, aucune erreur de console", async () => {
    const reduced = await open(1400, 900, { reducedMotion: "reduce" });
    await reduced.goto(pageUrl(A), { waitUntil: "load" });
    assert.ok(parseFloat(await reduced.evaluate(() => getComputedStyle(document.querySelector(".mk-px-table tbody tr")).transitionDuration)) <= 0.00001, "aucune transition perceptible en mouvement réduit");
    await reduced.context().close();
    const page = await open(1400, 900);
    await page.addInitScript(() => { window.__cls = 0; new PerformanceObserver((l) => { for (const e of l.getEntries()) if (!e.hadRecentInput) window.__cls += e.value; }).observe({ type: "layout-shift", buffered: true }); });
    for (const url of [pageUrl(A), `${srv.base}/marketing/site-web/outils/donnees/${one("SELECT id FROM cms_privacy_requests").id}?site=${A}`]) {
      await page.goto(url, { waitUntil: "load" }); await page.waitForTimeout(600);
      const cls = await page.evaluate(() => window.__cls || 0);
      assert.ok(cls < 0.1, `décalage de mise en page ${cls} < 0,1 (${url})`);
    }
    await shot(page, "detail");
    assert.deepEqual(errors, [], errors.join("\n"));
    await page.context().close();
  });
});
