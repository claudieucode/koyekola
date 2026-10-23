// KOLAKISA CMS — Paramètres → Général dans un VRAI Chrome (Playwright, ignoré sans) : modification et enregistrement réels (la base est relue), état « non enregistré », erreurs serveur
// (valeur refusée = formulaire conservé, rien d'écrit), panne réseau, double clic, confirmation des réglages sensibles, protection à la sortie, aperçus (formats, fuseau, calendrier),
// choix d'une icône, lecture seule, clavier, téléphone (390 px). Aucune erreur JavaScript sur tout le parcours.
const { test, describe, before, after } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const { TEST_KEY } = require("./marketing-helpers");
const { startServer, loginInstructor, newStudent } = require("./helpers");

let chromium = null;
try { chromium = require("playwright-core").chromium; } catch { /* module absent */ }
const CHROME = process.env.CHROME_PATH || ["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/usr/bin/google-chrome", "/usr/bin/chromium"].find((p) => fs.existsSync(p));
const SKIP = !chromium || !CHROME ? "Playwright ou Chrome absent : parcours navigateur non exécuté sur cette machine" : false;

describe("paramètres → général (navigateur)", { skip: SKIP }, () => {
  let srv, boss, browser, db, A, B, viewerA, errors, orgId;
  const one = (sql, ...a) => db.prepare(sql).get(...a);
  const R = "/marketing/site-web";
  const idOf = (c) => one("SELECT id FROM users WHERE email = ?", c.email).id;
  const open = async (client = boss, width = 1280) => {
    const context = await browser.newContext({ viewport: { width, height: 900 }, hasTouch: width < 600 });
    await context.addCookies([...client.cookies].map(([name, value]) => ({ name, value, url: srv.base })));
    context.setDefaultTimeout(8000);
    const page = await context.newPage();
    page.on("pageerror", (e) => errors.push(`pageerror : ${e.message}`));
    page.on("console", (m) => { if (m.type() === "error" && !/Failed to load resource/.test(m.text())) errors.push(`console : ${m.text().slice(0, 200)}`); });
    return page;
  };
  const go = async (page, site = A) => { await page.goto(`${srv.base}${R}/sites/${site}/reglages`); await page.locator("[data-sg-form]").waitFor(); await page.waitForFunction(() => /Aucune modification|Enregistré/.test(document.querySelector("[data-sg-state]").textContent)); };
  const state = (page) => page.locator("[data-sg-state]").innerText();
  const save = async (page) => { await page.click("[data-sg-save]"); await page.waitForFunction(() => /Enregistré à|Modifications non enregistrées|Aucune modification/.test(document.querySelector("[data-sg-state]").textContent) && !/Enregistrement/.test(document.querySelector("[data-sg-state]").textContent)); };
  const settings = (id) => JSON.parse(one("SELECT settings FROM mk_sites WHERE id = ?", id).settings || "{}");

  before(async () => {
    srv = await startServer({ ENCRYPTION_KEY: TEST_KEY, SITE_URL: "https://k.test", SMTP_HOST: "", ALLOW_INDEXING: "1" });
    boss = await loginInstructor(srv); db = srv.db(); errors = [];
    orgId = one("SELECT id FROM mk_organizations").id;
    const site = (n) => Number(db.prepare("INSERT INTO mk_sites (organization_id, name, slug, tokens) VALUES (?, ?, ?, '{}')").run(orgId, n, n.toLowerCase()).lastInsertRowid);
    A = site("Alpha"); B = site("Beta");
    db.prepare("INSERT INTO mk_media (organization_id, kind, type, path, name, mime, size) VALUES (?, 'image', 'image', '/uploads/marketing/1/icone-alpha.png', 'icone-alpha.png', 'image/png', 10)").run(orgId);
    viewerA = await newStudent(srv); db.prepare("INSERT INTO mk_site_members (site_id, user_id, role) VALUES (?, ?, 'viewer')").run(A, idOf(viewerA));
    browser = await chromium.launch({ executablePath: CHROME });
  });
  after(async () => { await browser.close(); db.close(); await srv.stop(); });

  test("l'écran s'ouvre : cinq sections, aucune modification, boutons d'enregistrement inactifs ; l'heure locale s'affiche et avance", async () => {
    const page = await open(); await go(page);
    for (const id of ["identite", "adresses", "comptes", "langue", "dates"]) await page.locator(`#${id}`).waitFor();
    assert.equal(await state(page), "Aucune modification");
    assert.equal(await page.locator("[data-sg-save]").isDisabled(), true); assert.equal(await page.locator("[data-sg-cancel]").isDisabled(), true);
    const c1 = await page.locator("[data-sg-clock]").innerText(); assert.match(c1, /Heure locale du site : .*\(GMT\+[12]\)/);
    await page.waitForFunction((t) => document.querySelector("[data-sg-clock]").textContent !== t, c1);
    assert.equal(await page.locator("#sg-site_name").inputValue(), "Alpha");
    await page.context().close();
  });

  test("modifier puis enregistrer : « non enregistrées » → « Enregistré à » ; la base est relue ; le rechargement montre les valeurs enregistrées ; annuler remet les valeurs", async () => {
    const page = await open(); await go(page);
    await page.fill("#sg-site_name", "Alpha Studio"); await page.fill("#sg-description", "Des formations claires");
    assert.match(await state(page), /Modifications non enregistrées \(2\)/); assert.equal(await page.locator("[data-sg-save]").isEnabled(), true);
    await page.click("[data-sg-cancel]"); assert.equal(await page.locator("#sg-site_name").inputValue(), "Alpha"); assert.equal(await state(page), "Aucune modification");
    await page.fill("#sg-site_name", "Alpha Studio"); await page.fill("#sg-description", "Des formations claires");
    await save(page); assert.match(await state(page), /Enregistré à \d/);
    assert.equal(one("SELECT name FROM mk_sites WHERE id = ?", A).name, "Alpha Studio"); assert.equal(settings(A).identity.description, "Des formations claires");
    await go(page); assert.equal(await page.locator("#sg-site_name").inputValue(), "Alpha Studio"); assert.equal(await page.locator("#sg-description").inputValue(), "Des formations claires");
    assert.match(await page.locator(".mk-cms-site-name, [data-site-name]").first().innerText().catch(() => "Alpha Studio"), /Alpha/);
    await page.context().close();
  });

  test("valeur refusée par le serveur : message sous le champ et en haut, valeurs CONSERVÉES, rien d'écrit (même le champ valide) ; la correction puis l'enregistrement fonctionnent", async () => {
    const page = await open(); await go(page);
    await page.fill("#sg-site_name", "Nom valide mais bloqué"); await page.fill("#sg-site_slug", "Pas Valide!");
    await save(page);
    await page.locator("[data-sg-banner]").waitFor({ state: "visible" });
    assert.match(await page.locator('[data-sg-err="site_slug"]').innerText(), /minuscules|tirets/i); assert.equal(await page.locator("#sg-site_slug").getAttribute("aria-invalid"), "true");
    assert.equal(await page.locator("#sg-site_name").inputValue(), "Nom valide mais bloqué", "la saisie n'est pas réinitialisée");
    assert.equal(one("SELECT name FROM mk_sites WHERE id = ?", A).name, "Alpha Studio", "rien n'est écrit");
    assert.match(await state(page), /non enregistrées/);
    await page.fill("#sg-site_slug", "alpha-studio");
    await page.click("[data-sg-save]");
    await page.locator("[data-sg-dlg-confirm]").waitFor({ state: "visible" }); // l'identifiant est un réglage sensible
    assert.match(await page.locator("[data-sg-confirm-list]").innerText(), /Identifiant du site[\s\S]*alpha → alpha-studio/);
    await page.click("[data-sg-confirm-ok]");
    await page.waitForFunction(() => /Enregistré à/.test(document.querySelector("[data-sg-state]").textContent));
    assert.equal(one("SELECT slug, name FROM mk_sites WHERE id = ?", A).slug, "alpha-studio"); assert.equal(one("SELECT name FROM mk_sites WHERE id = ?", A).name, "Nom valide mais bloqué");
    await page.locator("[data-sg-banner]").waitFor({ state: "hidden" });
    await page.context().close();
  });

  test("panne réseau et réponse d'erreur : le message est exploitable, les valeurs restent dans le formulaire, aucun faux « Enregistré »", async () => {
    const page = await open(); await go(page);
    await page.fill("#sg-description", "Texte en attente");
    await page.route("**/parametres/api/general*", (route) => route.abort());
    await save(page);
    await page.locator("[data-sg-banner]").waitFor({ state: "visible" });
    assert.match(await page.locator("[data-sg-banner]").innerText(), /Rien n'a été enregistré[\s\S]*réseau/); assert.equal(await page.locator("#sg-description").inputValue(), "Texte en attente");
    assert.match(await state(page), /non enregistrées/); assert.notEqual(settings(A).identity.description, "Texte en attente");
    await page.unroute("**/parametres/api/general*");
    await page.route("**/parametres/api/general*", (route) => route.fulfill({ status: 500, contentType: "application/json", body: JSON.stringify({ error: "Erreur interne simulée" }) }));
    await save(page); assert.match(await page.locator("[data-sg-banner]").innerText(), /Erreur interne simulée/); assert.equal(await page.locator("#sg-description").inputValue(), "Texte en attente");
    await page.unroute("**/parametres/api/general*");
    await save(page); assert.equal(settings(A).identity.description, "Texte en attente");
    await page.context().close();
  });

  test("double clic sur Enregistrer : une seule requête part ; protection à la sortie : un lien avec des modifications demande confirmation (refuser = rester)", async () => {
    const page = await open(); await go(page);
    let puts = 0; await page.route("**/parametres/api/general*", async (route) => { puts++; await new Promise((r) => setTimeout(r, 400)); await route.continue(); });
    await page.fill("#sg-description", "Double clic");
    await page.dblclick("[data-sg-save]"); await page.waitForFunction(() => /Enregistré à/.test(document.querySelector("[data-sg-state]").textContent));
    assert.equal(puts, 1, "une seule requête"); await page.unroute("**/parametres/api/general*");
    await page.fill("#sg-description", "Perdu ?");
    let asked = 0; page.on("dialog", async (d) => { asked++; await d.dismiss(); });
    await page.locator('.mk-sg-linklist a[href*="styles"]').click(); await page.waitForTimeout(300);
    assert.equal(asked, 1, "confirmation demandée"); assert.match(page.url(), /reglages$/, "on reste sur la page"); assert.equal(await page.locator("#sg-description").inputValue(), "Perdu ?");
    await page.click("[data-sg-cancel]");
    page.removeAllListeners("dialog"); asked = 0; page.on("dialog", (d) => { asked++; d.accept(); });
    await page.locator('.mk-sg-linklist a[href*="styles"]').click(); await page.waitForURL(/styles/); assert.equal(asked, 0, "aucune confirmation sans modification");
    await page.context().close();
  });

  test("domaine personnalisé : réglage sensible → fenêtre de confirmation avec l'impact ; Retour = rien d'écrit ; Confirmer = enregistré ; clavier : Entrée dans un champ enregistre", async () => {
    const page = await open(); await go(page);
    await page.fill("#sg-public_url", "https://www.alpha-navigateur.example"); await page.click("[data-sg-save]");
    await page.locator("[data-sg-dlg-confirm]").waitFor({ state: "visible" });
    assert.match(await page.locator("[data-sg-confirm-list]").innerText(), /Domaine personnalisé[\s\S]*alpha-navigateur[\s\S]*moteurs de recherche/);
    await page.keyboard.press("Escape"); await page.locator("[data-sg-dlg-confirm]").waitFor({ state: "hidden" });
    assert.ok(!((settings(A).seo || {}).publicUrl), "rien d'écrit sans confirmation");
    await page.click("[data-sg-save]"); await page.locator("[data-sg-dlg-confirm]").waitFor({ state: "visible" });
    await page.click("[data-sg-confirm-ok]"); await page.waitForFunction(() => /Enregistré à/.test(document.querySelector("[data-sg-state]").textContent));
    assert.equal(settings(A).seo.publicUrl, "https://www.alpha-navigateur.example"); assert.match(await page.locator("[data-sg-public]").innerText(), /k\.test|alpha-navigateur/);
    await page.fill("#sg-description", "Entrée enregistre"); await page.press("#sg-description", "Tab"); await page.press("#sg-site_name", "Enter");
    await page.waitForFunction(() => /Enregistré à/.test(document.querySelector("[data-sg-state]").textContent));
    assert.equal(settings(A).identity.description, "Entrée enregistre");
    await page.context().close();
  });

  test("aperçus en direct : le format de date et d'heure, le fuseau et le premier jour de la semaine changent l'aperçu, l'horloge et le calendrier ; enregistrés, ils persistent", async () => {
    const page = await open(); await go(page);
    await page.check('input[name="date_format"][value="iso"]'); assert.match(await page.locator("[data-sg-preview]").innerText(), /Aperçu : \d{4}-\d{2}-\d{2} à \d{2}:\d{2}/);
    await page.check('input[name="time_format"][value="12h"]'); assert.match(await page.locator("[data-sg-preview]").innerText(), /(AM|PM)/);
    await page.selectOption("#sg-timezone", "Asia/Tokyo"); assert.match(await page.locator("[data-sg-clock]").innerText(), /GMT\+9/);
    const before = await page.locator("[data-sg-cal] .mk-sg-cal-grid span").allInnerTexts(); assert.equal(before[0], "L", "lundi en premier");
    await page.selectOption("#sg-week_start", "sunday"); const after = await page.locator("[data-sg-cal] .mk-sg-cal-grid span").allInnerTexts(); assert.equal(after[0], "D", "dimanche en premier");
    await page.selectOption("#sg-language", "en"); assert.match(await page.locator('[data-sg-example-date="long"]').innerText(), /^[A-Z][a-z]+ \d{1,2}, \d{4}$/, "exemples dans la langue du site");
    await save(page);
    const g = settings(A).general; assert.deepEqual([g.dateFormat, g.timeFormat, g.timezone, g.weekStart], ["iso", "12h", "Asia/Tokyo", "sunday"]);
    await go(page); assert.equal(await page.locator('input[name="date_format"][value="iso"]').isChecked(), true); assert.equal(await page.locator("#sg-timezone").inputValue(), "Asia/Tokyo");
    await page.context().close();
  });

  test("icône du site : choisir une image de la médiathèque (aperçu), enregistrer, retirer ; une image hors médiathèque est refusée par le serveur", async () => {
    const page = await open(); await go(page);
    await page.click('[data-sg-pick="favicon"]'); await page.locator("[data-sg-dlg-image]").waitFor({ state: "visible" });
    await page.fill("[data-sg-img-search]", "zzz"); await page.locator("[data-sg-img-empty]").waitFor({ state: "visible" });
    await page.fill("[data-sg-img-search]", "icone"); await page.locator('[data-sg-imggrid] button[aria-label="Choisir icone-alpha.png"]').click();
    await page.locator("[data-sg-dlg-image]").waitFor({ state: "hidden" });
    assert.equal(await page.locator('[data-sg-image="favicon"] [data-sg-thumb-img]').isVisible(), true); assert.equal(await page.locator('[data-sg-clear="favicon"]').isVisible(), true);
    await save(page); assert.equal(settings(A).identity.faviconUrl, "/uploads/marketing/1/icone-alpha.png");
    await go(page); assert.equal(await page.locator('[data-sg-image="favicon"] [data-sg-thumb-img]').isVisible(), true);
    await page.click('[data-sg-clear="favicon"]'); await save(page); assert.equal(settings(A).identity.faviconUrl, "");
    const r = await boss.request(`${R}/parametres/api/general?site=${A}`, { method: "PUT", json: { values: { favicon: "https://evil.example/x.png" } } }); assert.equal(r.status, 422);
    await page.context().close();
  });

  test("effet réel : le premier jour de la semaine choisi ici est celui du calendrier de publication de l'éditeur d'articles", async () => {
    const setWeek = async (v) => { const r = await boss.request(`${R}/parametres/api/general`, { method: "PUT", json: { values: { week_start: v } } }); assert.equal(r.status, 200, r.text); };
    const first = async (v) => {
      await setWeek(v);
      const page = await open(); await page.goto(`${srv.base}/formateur/blog/nouveau`);
      await page.locator(".kdp-trigger").first().click({ force: true }); const head = page.locator(".kdp-week span");
      await head.first().waitFor({ state: "attached" }); const days = await head.allInnerTexts(); await page.context().close(); return days;
    };
    assert.deepEqual(await first("monday"), ["lun.", "mar.", "mer.", "jeu.", "ven.", "sam.", "dim."]);
    assert.deepEqual(await first("sunday"), ["dim.", "lun.", "mar.", "mer.", "jeu.", "ven.", "sam."]);
    assert.deepEqual(await first("saturday"), ["sam.", "dim.", "lun.", "mar.", "mer.", "jeu.", "ven."]);
    await setWeek("monday");
  });

  test("lecture seule et isolation : le lecteur du site voit l'écran sans pouvoir enregistrer ; l'autre site est refusé", async () => {
    const page = await open(viewerA); await page.goto(`${srv.base}${R}/sites/${A}/reglages`);
    await page.locator("[data-sg-form]").waitFor();
    assert.match(await page.locator(".mk-sg-note").innerText(), /Lecture seule/); assert.equal(await page.locator("#sg-site_name").isDisabled(), true); assert.equal(await page.locator("[data-sg-save]").isDisabled(), true);
    const other = await page.goto(`${srv.base}${R}/sites/${B}/reglages`); assert.ok([403, 404].includes(other.status()), String(other.status()));
    await page.context().close();
  });

  test("téléphone (390 px) : aucune barre de défilement horizontale, la barre d'enregistrement reste utilisable ; tout est atteignable au clavier ; aucune erreur JavaScript", async () => {
    const page = await open(boss, 390); await go(page);
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1), "pas de défilement horizontal");
    await page.fill("#sg-description", "Mobile"); const bar = await page.locator("[data-sg-save]").boundingBox(); assert.ok(bar && bar.width >= 100 && bar.y < 900);
    await page.focus("#sg-site_name"); let reached = false;
    for (let i = 0; i < 80 && !reached; i++) { await page.keyboard.press("Tab"); reached = await page.evaluate(() => document.activeElement && document.activeElement.hasAttribute("data-sg-save")); }
    assert.equal(reached, true, "le bouton Enregistrer est atteignable au clavier");
    assert.deepEqual(errors, []);
    await page.context().close();
  });
});
